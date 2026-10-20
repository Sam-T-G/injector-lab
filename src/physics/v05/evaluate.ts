import { ceaField, combustion, LOX_ETHANOL, type CeaTable } from '../cea'
import { liquidAt } from '../liquids'
import { frictionFactor, holeFlow, sizeHole } from '../orifice'
import type { Prop } from '../types'
import { groupRadii, massMedianRadius } from './drops'
import { jet } from './jet'
import { march, t50Within, type MarchOut } from './march'
import { critical, cstarOfF, R_U } from './tables'
import type { Band, Check05, Curve, Field05, Inputs05, OperatingPoint, Result05, Side05 } from './types'
import { mixVapor, type MixOut, type VaporHole } from './vapormix'

export const MODEL05 = 'v0.5'
const G0 = 9.80665
const deg = (d: number) => (d * Math.PI) / 180

/** Face pressure over nozzle stagnation pressure, P_face/Pc = 1 + 0.54 CR^-2.2 (RocketCEA; rule of thumb). */
export const faceRatio = (cr: number) => 1 + 0.54 * Math.pow(cr, -2.2)

/** Critical dead time for the single-delay chug screen (review A S9). */
export function chugCritical(k: number, thetaG: number): number {
  if (k <= 1) return Infinity
  return (thetaG * Math.acos(-1 / k)) / Math.sqrt(k * k - 1)
}

interface Hardware {
  At: number
  cr: number
  hole: { ox: { n: number; d: number }; fuel: { n: number; d: number } }
  L: number
}

/**
 * Operating point of fixed hardware (review A S7): the chamber pressure where the injector's flow
 * at the available inlet pressures equals the nozzle's flow Pc At / (eta c*). Constant Cf.
 */
export function operatingPoint(
  inp: Inputs05,
  hw: Hardware,
  eta: number,
  etaCf: number,
  t: CeaTable = LOX_ETHANOL,
  /** Inlet pressures to use instead of the maximum allowed, Pa. */
  inlet?: { ox: number; fuel: number },
): OperatingPoint | null {
  const lox = liquidAt('lox', inp.ox.tempK)
  const eth = liquidAt('ethanol', inp.fuel.tempK)
  const loss = (rho: number) => inp.manifoldLossHeads * 0.5 * rho * inp.manifoldVelocity * inp.manifoldVelocity
  const pin = inlet ?? { ox: inp.ox.inletMaxBar * 1e5, fuel: inp.fuel.inletMaxBar * 1e5 }
  const avail = {
    ox: pin.ox - loss(lox.rho) - inp.feedMarginBar * 1e5,
    fuel: pin.fuel - loss(eth.rho) - inp.feedMarginBar * 1e5,
  }
  const rough = inp.roughnessUm * 1e-6
  const flows = (pc: number) => {
    const pf = pc * faceRatio(hw.cr)
    const dpo = avail.ox - pf
    const dpf = avail.fuel - pf
    const mo = dpo > 0 ? hw.hole.ox.n * holeFlow(hw.hole.ox.d, hw.L, dpo, lox.rho, lox.mu, rough).mdot : 0
    const mf = dpf > 0 ? hw.hole.fuel.n * holeFlow(hw.hole.fuel.d, hw.L, dpf, eth.rho, eth.mu, rough).mdot : 0
    return { mo, mf, dpo, dpf }
  }
  const residual = (pc: number) => {
    const f = flows(pc)
    const of = f.mf > 0 ? f.mo / f.mf : 50
    const cstar = ceaField(t, 'cstar', pc / 1e5, Math.min(50, Math.max(0.02, of)))
    return f.mo + f.mf - (pc * hw.At) / (eta * cstar)
  }
  let lo = t.Pc[0]! * 1e5
  let hi = Math.min(avail.ox, avail.fuel) / faceRatio(hw.cr)
  if (!(hi > lo) || residual(lo) < 0 || residual(hi * (1 - 1e-9)) > 0) return null
  for (let k = 0; k < 80; k++) {
    const mid = 0.5 * (lo + hi)
    if (residual(mid) > 0) lo = mid
    else hi = mid
  }
  const pc = 0.5 * (lo + hi)
  const f = flows(pc)
  if (!(f.mo > 0 && f.mf > 0)) return null
  const of = f.mo / f.mf
  const comb = combustion(t, pc / 1e5, of)
  const cf = comb.IspSL / comb.cstar
  const thrust = etaCf * cf * pc * hw.At
  return {
    eta,
    pcBar: pc / 1e5,
    mdotOx: f.mo,
    mdotFuel: f.mf,
    of,
    thrustN: thrust,
    ispS: thrust / ((f.mo + f.mf) * G0),
    dpOverPcOx: f.dpo / pc,
    dpOverPcFuel: f.dpf / pc,
  }
}

/** Smallest distance between an oxidizer hole and a fuel hole, m. */
function minUnlike(holes: { prop: Prop; x: number; y: number }[]): number {
  let m = Infinity
  for (const a of holes) for (const b of holes) if (a.prop !== b.prop) m = Math.min(m, Math.hypot(a.x - b.x, a.y - b.y))
  return m
}

function sideFor(
  inp: Inputs05,
  prop: Prop,
  mdot: number,
  pc: number,
  pFace: number,
  Dc: number,
  rhoGas: number,
  given: { d: number } | null,
): Omit<Side05, 't50' | 'maxWe' | 'breakup' | 'reRange' | 'bTMax'> {
  const pi = inp[prop]
  const liq = liquidAt(prop === 'ox' ? 'lox' : 'ethanol', pi.tempK)
  const L = (inp.injectorThicknessMm - inp.manifoldDepthMm) / 1000
  const rough = inp.roughnessUm * 1e-6
  const manifoldLoss = inp.manifoldLossHeads * 0.5 * liq.rho * inp.manifoldVelocity * inp.manifoldVelocity
  const dpMax = pi.inletMaxBar * 1e5 - pFace - manifoldLoss - inp.feedMarginBar * 1e5
  let hole
  let dp
  if (given) {
    dp = pi.inletMaxBar * 1e5 - pFace - manifoldLoss - inp.feedMarginBar * 1e5
    hole = holeFlow(given.d, L, Math.max(dp, 1), liq.rho, liq.mu, rough)
  } else {
    if (!(dpMax > 0)) {
      throw new RangeError(
        `The ${prop === 'ox' ? 'LOX' : 'ethanol'} feed budget leaves no pressure drop: ${pi.inletMaxBar} bar inlet against ${(pFace / 1e5).toFixed(2)} bar at the face plus ${(manifoldLoss / 1e5).toFixed(2)} bar manifold loss and ${inp.feedMarginBar} bar margin.`,
      )
    }
    dp = Math.min(dpMax, inp.dpCap * pc)
    hole = sizeHole(mdot / pi.holes, L, Math.max(dp, 1), liq.rho, liq.mu, rough)
  }
  const ringRadius = (pi.ringRatio * Dc) / 2
  const vVc = hole.v / inp.contractionCoeff
  const pVenaContracta = pFace + dp - 0.5 * liq.rho * vVc * vVc
  return {
    prop,
    holes: pi.holes,
    d: hole.d,
    L,
    U: hole.v,
    cd: hole.cd,
    re: hole.re,
    mdot: given ? hole.mdot * pi.holes : mdot,
    dp,
    dpMax,
    inletRequired: pFace + dp + manifoldLoss,
    manifoldLoss,
    boreD: Math.sqrt((4 * mdot) / (Math.PI * liq.rho * inp.manifoldVelocity)),
    ringRadius,
    pitch: (2 * Math.PI * ringRadius) / pi.holes,
    pVenaContracta,
    cavitates: pVenaContracta < liq.psat,
    rho: liq.rho,
    jet: withShortHoleFlag(jet({ d: hole.d, U: hole.v, rhoL: liq.rho, sigma: liq.sigma, rhoG: rhoGas, f: frictionFactor(hole.re, rough / hole.d) }), L / hole.d),
    drops: massMedianRadius({ d: hole.d, U: hole.v, sigma: liq.sigma, muL: liq.mu, rhoL: liq.rho }),
  }
}

/** Review B S2: the turbulence-intensity regression assumes fully developed pipe flow. */
function withShortHoleFlag(j: ReturnType<typeof jet>, lOverD: number): ReturnType<typeof jet> {
  if (lOverD < 40) j.coreFlags.push(`hole L/d ${lOverD.toFixed(1)} is below 40, so the jet turbulence is uncertain`)
  return j
}

export interface EvalOptions {
  /** Cells across the diameter for the sweep runs. */
  nSweep?: number
  /** Cells across the diameter for the drawn central case. */
  nField?: number
  /** Stations along the chamber. */
  stations?: number
}

export function evaluate05(inp: Inputs05, opt: EvalOptions = {}, t: CeaTable = LOX_ETHANOL): Result05 {
  const nSweep = opt.nSweep ?? 64
  const nField = opt.nField ?? 110
  const S = opt.stations ?? 121
  const analyze = inp.mode05 === 'analyze'
  const lambdaNozzle = (1 + Math.cos(deg(inp.nozzleExitDeg))) / 2
  const etaCf = lambdaNozzle * inp.etaKinBL

  // Sizing (design) or given hardware (analyze).
  let pc: number
  let of = inp.of
  let At: number
  let Dc: number
  let mdot: number
  let given: { ox: { d: number }; fuel: { d: number } } | null = null
  let cr = inp.contractionRatio
  const L = (inp.injectorThicknessMm - inp.manifoldDepthMm) / 1000
  if (!analyze) {
    pc = inp.pcBar * 1e5
    const c0 = combustion(t, inp.pcBar, of)
    const cf = c0.IspSL / c0.cstar
    At = inp.thrustN / (etaCf * cf * pc)
    mdot = (pc * At) / (inp.etaDesign * c0.cstar)
    Dc = Math.sqrt((4 * cr * At) / Math.PI)
  } else {
    At = (Math.PI / 4) * (inp.analyze.DtMm / 1000) ** 2
    Dc = inp.analyze.DcMm / 1000
    cr = (Dc * Dc) / (inp.analyze.DtMm / 1000) ** 2
    given = { ox: { d: inp.analyze.dOxMm / 1000 }, fuel: { d: inp.analyze.dFuelMm / 1000 } }
    const op = operatingPoint(
      inp,
      { At, cr, L, hole: { ox: { n: inp.ox.holes, d: given.ox.d }, fuel: { n: inp.fuel.holes, d: given.fuel.d } } },
      inp.etaDesign,
      etaCf,
      t,
    )
    if (!op) throw new RangeError('This hardware has no operating point with these inlet pressures inside the CEA table (5-60 bar).')
    pc = op.pcBar * 1e5
    of = op.of
    mdot = op.mdotOx + op.mdotFuel
  }
  const pcBar = pc / 1e5
  const comb = combustion(t, pcBar, of)
  const mdotOx = (mdot * of) / (1 + of)
  const mdotFuel = mdot / (1 + of)
  const Ac = (Math.PI / 4) * Dc * Dc
  const Rc = Dc / 2
  const Rt = Math.sqrt(At / Math.PI)
  const Lconv = (Rc - Rt) / Math.tan(deg(inp.convergentDeg))
  const Vconv = (Math.PI / 3) * Lconv * (Rc * Rc + Rc * Rt + Rt * Rt)
  const LcylMax = analyze ? inp.analyze.LcylMm / 1000 : (inp.lStarMaxM * At - Vconv) / Ac
  const LcylMin = analyze ? LcylMax : Math.max(0, (inp.lStarMinM * At - Vconv) / Ac)
  if (!(LcylMax > 0)) throw new RangeError('The longest L* leaves no room for a cylinder after the convergent section.')
  const pFace = pc * faceRatio(cr)
  const rhoGas = comb.rho
  const uFin = mdot / (rhoGas * Ac)

  const base = {
    ox: sideFor(inp, 'ox', mdotOx, pc, pFace, Dc, rhoGas, given?.ox ?? null),
    fuel: sideFor(inp, 'fuel', mdotFuel, pc, pFace, Dc, rhoGas, given?.fuel ?? null),
  }

  // Three drop-size cases, one march each.
  const sample = LcylMax / (S - 1)
  const drops = [1, inp.dropLo, inp.dropHi]
  const marches: MarchOut[] = drops.map((m) =>
    march({
      streams: [
        { key: 'lox', mdot: mdotOx, U0: base.ox.U, T0: inp.ox.tempK, radii: groupRadii(base.ox.drops.rm * m) },
        { key: 'ethanol', mdot: mdotFuel, U0: base.fuel.U, T0: inp.fuel.tempK, radii: groupRadii(base.fuel.drops.rm * m) },
      ],
      pcBar,
      of,
      Tinf: comb.Tc,
      uFin,
      mdotGas: mdot,
      length: LcylMax,
      sample,
      dxMax: Math.min(2.5e-4, sample),
    }),
  )

  // Hole layout and the vapor sources.
  const holes: VaporHole[] = []
  const layout: Result05['holes'] = []
  for (const side of [base.ox, base.fuel]) {
    const pi = inp[side.prop]
    for (let k = 0; k < pi.holes; k++) {
      const a = deg(pi.clockDeg + (360 * k) / pi.holes)
      const x = side.ringRadius * Math.cos(a)
      const y = side.ringRadius * Math.sin(a)
      holes.push({ prop: side.prop, x, y, mdot: side.mdot / pi.holes, d: side.d, coreLength: side.jet.coreLength, halfAngle: side.jet.halfAngle })
      layout.push({ prop: side.prop, x, y, d: side.d })
    }
  }
  let sMin = Infinity
  for (let a = 0; a < layout.length; a++)
    for (let b = a + 1; b < layout.length; b++) sMin = Math.min(sMin, Math.hypot(layout[a]!.x - layout[b]!.x, layout[a]!.y - layout[b]!.y))
  const lambdas = [sMin, Rc]
  const cstar = cstarOfF(t, pcBar)
  const ceaRange: [number, number] = [1 / (1 + t.OF[t.OF.length - 1]!), 1 / (1 + t.OF[0]!)]
  const fInj = 1 / (1 + of)
  const wallBand = Math.max(1e-3, 0.1 * Rc)

  const runs: { drop: number; i: number; Lambda: number; out: MixOut }[] = []
  marches.forEach((m, di) => {
    for (const i of inp.mixI)
      for (const Lambda of lambdas)
        runs.push({
          drop: drops[di]!,
          i,
          Lambda,
          out: mixVapor({
            holes,
            R: Rc,
            n: nSweep,
            i,
            Lambda,
            x: m.x,
            F: { ox: m.streams[0]!.F, fuel: m.streams[1]!.F },
            cstar,
            fInj,
            wallBand,
            ceaRange,
          }),
        })
  })
  const central = runs.find((r) => r.drop === 1 && r.i === inp.mixI[Math.floor(inp.mixI.length / 2)] && r.Lambda === Rc) ?? runs[0]!
  const mid = marches[0]!
  const curve: Curve = { x: [], lo: [], mid: [], hi: [], vapOx: [], vapFuel: [], Em: [], ofWall: [] }
  for (let j = 0; j < S; j++) {
    let lo = Infinity
    let hi = -Infinity
    for (const r of runs) {
      lo = Math.min(lo, r.out.etaCstar[j]!)
      hi = Math.max(hi, r.out.etaCstar[j]!)
    }
    curve.x.push(mid.x[j]!)
    curve.lo.push(lo)
    curve.hi.push(hi)
    curve.mid.push(central.out.etaCstar[j]!)
    curve.vapOx.push(mid.streams[0]!.F[j]!)
    curve.vapFuel.push(mid.streams[1]!.F[j]!)
    curve.Em.push(central.out.Em[j]!)
    curve.ofWall.push(central.out.ofWall[j]!)
  }

  // Chamber length: shortest station at or beyond the L* floor whose lower band meets the target.
  let at = S - 1
  let targetMet = false
  if (!analyze) {
    for (let j = 0; j < S; j++) {
      if (curve.x[j]! < LcylMin - 1e-12) continue
      if (curve.lo[j]! >= inp.etaTarget) {
        at = j
        targetMet = true
        break
      }
    }
  } else targetMet = curve.lo[at]! >= inp.etaTarget
  const Lcyl = curve.x[at]!
  const lStar = (Ac * Lcyl + Vconv) / At
  const eta: Band = { lo: curve.lo[at]!, mid: curve.mid[at]!, hi: curve.hi[at]! }
  const ispBand: Band = {
    lo: (eta.lo * etaCf * comb.IspSL) / G0,
    mid: (eta.mid * etaCf * comb.IspSL) / G0,
    hi: (eta.hi * etaCf * comb.IspSL) / G0,
  }

  // Built hardware across the band.
  const hw: Hardware = { At, cr, L, hole: { ox: { n: inp.ox.holes, d: base.ox.d }, fuel: { n: inp.fuel.holes, d: base.fuel.d } } }
  // Design mode: the feed set to the pressures this design needs (with margin), not the maximum.
  const inletUsed = analyze
    ? undefined
    : { ox: base.ox.inletRequired + inp.feedMarginBar * 1e5, fuel: base.fuel.inletRequired + inp.feedMarginBar * 1e5 }
  const operating = [eta.lo, eta.mid, eta.hi]
    .filter((e) => e > 0.05)
    .map((e) => operatingPoint(inp, hw, e, etaCf, t, inletUsed))
    .filter((o): o is OperatingPoint => o !== null)

  // Gas residence time and chug screen.
  const cstarDel = inp.etaDesign * comb.cstar
  const Rg = R_U / (comb.MW / 1000)
  const thetaG = (lStar * cstarDel) / (Rg * comb.Tc)
  const kOx = pc / (2 * Math.max(base.ox.dp, 1))
  const kFuel = pc / (2 * Math.max(base.fuel.dp, 1))
  const t50 = [t50Within(mid.streams[0]!, at), t50Within(mid.streams[1]!, at)]
  const tau = t50.every(Number.isFinite) ? Math.max(t50[0]!, t50[1]!) : Infinity

  // Bartz throat heat transfer (review A S11), SI form, band x0.4-1.7.
  const muC = ceaField(t, 'mu', pcBar, of)
  const cpC = ceaField(t, 'cpfr', pcBar, of)
  const prC = ceaField(t, 'Prfr', pcBar, of)
  const g = comb.gamma
  const Dt = 2 * Rt
  const rtc = inp.throatCurvature * Rt
  const M2 = 1
  const s1 = 1 + ((g - 1) / 2) * M2
  const sig = Math.pow(0.5 * (inp.wallTempK / comb.Tc) * s1 + 0.5, -0.68) * Math.pow(s1, -0.12)
  const hG = 0.026 * Math.pow(Dt, -0.2) * Math.pow(muC, 0.2) * cpC * Math.pow(prC, -0.6) * Math.pow(pc / cstarDel, 0.8) * Math.pow(Dt / rtc, 0.1) * sig
  const Taw = (comb.Tc * (1 + Math.cbrt(prC) * ((g - 1) / 2) * M2)) / s1
  const q = hG * (Taw - inp.wallTempK)

  // Wall zone: which propellant the outer ring carries, and the vapor O/F at the wall.
  const outerProp: Prop = base.ox.ringRadius >= base.fuel.ringRadius ? 'ox' : 'fuel'
  const vaporOF = [0.25, 0.5, 1].map((fr) => {
    const j = Math.min(S - 1, Math.round(fr * at))
    return { x: curve.x[j]!, of: curve.ofWall[j]! }
  })

  // Fields of the central case for drawing, at about 21 stations up to the chosen length.
  const keep: number[] = []
  for (let k = 0; k <= 20; k++) keep.push(Math.round((k / 20) * at))
  const drawn = mixVapor({
    holes,
    R: Rc,
    n: nField,
    i: central.i,
    Lambda: central.Lambda,
    x: mid.x,
    F: { ox: mid.streams[0]!.F, fuel: mid.streams[1]!.F },
    cstar,
    fInj,
    wallBand,
    ceaRange,
    keep: [...new Set(keep)],
  })
  const fields: Field05[] = drawn.fields.map((f) => ({ x: mid.x[f.index]!, n: nField, R: Rc, ox: f.ox, fuel: f.fuel }))

  const checks: Check05[] = []
  for (const s of [base.ox, base.fuel]) {
    const name = s.prop === 'ox' ? 'LOX' : 'Ethanol'
    checks.push({ key: `stiff-${s.prop}`, label: `${name} pressure drop at least 15% of Pc`, ok: s.dp >= 0.15 * pc, value: s.dp / pc, limit: 0.15, unit: 'of Pc' })
    checks.push({ key: `pitch-${s.prop}`, label: `${name} hole spacing`, ok: s.pitch >= inp.minPitchDiameters * s.d, value: s.pitch / s.d, limit: inp.minPitchDiameters, unit: 'hole dia' })
    checks.push({ key: `cav-${s.prop}`, label: `${name} vena contracta above vapor pressure`, ok: !s.cavitates, value: s.pVenaContracta / 1e5, limit: (s.prop === 'ox' ? liquidAt('lox', inp.ox.tempK) : liquidAt('ethanol', inp.fuel.tempK)).psat / 1e5, unit: 'bar' })
  }
  const dMax = Math.max(base.ox.d, base.fuel.d)
  checks.push({ key: 'ring-gap', label: 'Gap between rings', ok: Math.abs(base.ox.ringRadius - base.fuel.ringRadius) >= inp.minPitchDiameters * dMax, value: Math.abs(base.ox.ringRadius - base.fuel.ringRadius) / dMax, limit: inp.minPitchDiameters, unit: 'hole dia' })
  const body = Dc * 1000 + 2 * inp.wallMm
  checks.push({ key: 'body', label: 'Chamber plus wall', ok: body <= inp.maxDiameterMm, value: body, limit: inp.maxDiameterMm, unit: 'mm' })
  const mass = inp.bodyDensity * (Math.PI / 4) * (Dc + (2 * inp.bodyMarginMm) / 1000) ** 2 * (inp.injectorThicknessMm / 1000)
  checks.push({ key: 'mass', label: 'Injector mass', ok: mass <= inp.maxInjectorMassKg, value: mass, limit: inp.maxInjectorMassKg, unit: 'kg' })
  checks.push({ key: 'cylinder', label: 'Cylinder length after the convergent', ok: Lcyl > 0, value: Lcyl * 1000, limit: 0, unit: 'mm' })

  const sideOut = (s: typeof base.ox, k: 0 | 1): Side05 => {
    const tr = mid.streams[k]!
    return {
      ...s,
      t50: t50[k]!,
      maxWe: tr.weMaxAt[at]!,
      breakup: tr.breakupStation <= at,
      reRange: [tr.reMin, tr.reMaxAt[at]!],
      bTMax: tr.bTMaxAt[at]!,
    }
  }

  return {
    model: 'v0.5',
    mode: inp.mode05,
    pcBar,
    of,
    comb: { cstar: comb.cstar, Tc: comb.Tc, gamma: comb.gamma, MW: comb.MW, IspSL: comb.IspSL, eps: comb.eps, rho: comb.rho },
    etaCf,
    geom: { At, Dt, Ac, Dc, Lconv, Vconv, LcylMax, Lcyl, lStar, Rface: Rc },
    mdot,
    mdotOx,
    mdotFuel,
    pFaceBar: pFace / 1e5,
    uFin,
    thetaG,
    ox: sideOut(base.ox, 0),
    fuel: sideOut(base.fuel, 1),
    curve,
    at,
    targetMet,
    eta,
    isp: ispBand,
    operating,
    chug: {
      ox: { k: kOx, tauCrit: chugCritical(kOx, thetaG) },
      fuel: { k: kFuel, tauCrit: chugCritical(kFuel, thetaG) },
      tau,
    },
    throat: { h: hG, q: { lo: 0.4 * q, mid: q, hi: 1.7 * q }, Taw },
    wall: { outerProp, faceOF: outerProp === 'ox' ? Infinity : 0, vaporOF },
    nearCritical: { lox: pc / critical('lox').p, ethanol: pc / critical('ethanol').p },
    massError: Math.max(...runs.map((r) => Math.max(r.out.massError, r.out.compositionError)), drawn.massError, drawn.compositionError),
    gapMass: Math.max(...runs.map((r) => r.out.gapMass[at]!)),
    gapMassCentral: central.out.gapMass[at]!,
    etaMixMax: Math.max(...runs.map((r) => r.out.etaMix[at]!).filter(Number.isFinite)),
    emRange: [Math.min(...runs.map((r) => r.out.Em[at]!).filter(Number.isFinite)), Math.max(...runs.map((r) => r.out.Em[at]!).filter(Number.isFinite))],
    xNear: 2 * minUnlike(layout),
    checks,
    feasible: checks.every((c) => c.ok),
    fields,
    sweep: runs.map((r) => ({ drop: r.drop, i: r.i, Lambda: r.Lambda, etaAt: r.out.etaCstar[at]! })),
    holes: layout,
  }
}


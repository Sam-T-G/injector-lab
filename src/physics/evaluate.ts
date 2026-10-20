import { droplet } from './atomization'
import { cstarCurve, LEGACY_OF_RANGE, LOX_ETHANOL, type CeaTable } from './cea'
import { sizeEngine } from './engine'
import { liquidAt } from './liquids'
import { fluxField, mixingStats, spraySigma, type CstarCurve, type SprayHole } from './mixing'
import { sizeHole } from './orifice'
import { lifetime, vaporizedFraction } from './vaporization'
import type {
  Constraint,
  DesignInputs,
  DesignPoint,
  EngineSize,
  Prop,
  PropSide,
  Scenario,
  ScenarioProp,
  ScenarioResult,
  PointResult,
} from './types'

export const MODEL = 'v0.4-port'

export function propSide(inp: DesignInputs, prop: Prop, eng: EngineSize, dpFrac: number): PropSide {
  const pi = inp[prop]
  const liquid = liquidAt(prop === 'ox' ? 'lox' : 'ethanol', pi.tempK)
  const mdot = prop === 'ox' ? eng.mdotOx : eng.mdotFuel
  const pc = eng.comb.pcBar * 1e5
  const dp = dpFrac * pc
  const L = (inp.injectorThicknessMm - inp.manifoldDepthMm) / 1000
  if (!(L > 0)) throw new RangeError('manifold depth must be less than the injector thickness')
  const hole = sizeHole(mdot / pi.holes, L, dp, liquid.rho, liquid.mu, inp.roughnessUm * 1e-6)
  const ringRadius = (pi.ringRatio * eng.Dc) / 2
  const qBore = 0.5 * liquid.rho * inp.manifoldVelocity * inp.manifoldVelocity
  const manifoldLoss = inp.manifoldLossHeads * qBore
  const vVc = hole.v / inp.contractionCoeff
  const pVenaContracta = pc + dp - 0.5 * liquid.rho * vVc * vVc
  return {
    prop,
    liquid,
    mdot,
    holes: pi.holes,
    hole,
    ringRadius,
    clockDeg: pi.clockDeg,
    pitch: (2 * Math.PI * ringRadius) / pi.holes,
    boreD: Math.sqrt((4 * mdot) / (Math.PI * liquid.rho * inp.manifoldVelocity)),
    manifoldLoss,
    dp,
    inletRequired: pc + dp + manifoldLoss,
    pVenaContracta,
    cavitates: pVenaContracta < liquid.psat,
  }
}

function constraints(inp: DesignInputs, eng: EngineSize, ox: PropSide, fuel: PropSide, massKg: number): Constraint[] {
  const out: Constraint[] = []
  for (const s of [ox, fuel]) {
    const name = s.prop === 'ox' ? 'LOX' : 'Ethanol'
    out.push({
      key: `inlet-${s.prop}`,
      label: `${name} inlet pressure`,
      ok: s.inletRequired <= inp[s.prop].inletMaxBar * 1e5,
      value: s.inletRequired / 1e5,
      limit: inp[s.prop].inletMaxBar,
      unit: 'bar',
    })
    out.push({
      key: `pitch-${s.prop}`,
      label: `${name} hole pitch`,
      ok: s.pitch >= inp.minPitchDiameters * s.hole.d,
      value: s.pitch / s.hole.d,
      limit: inp.minPitchDiameters,
      unit: 'hole dia',
    })
    out.push({
      key: `cavitation-${s.prop}`,
      label: `${name} vena contracta above vapor pressure`,
      ok: !s.cavitates,
      value: s.pVenaContracta / 1e5,
      limit: s.liquid.psat / 1e5,
      unit: 'bar',
    })
  }
  const gap = Math.abs(ox.ringRadius - fuel.ringRadius)
  const dMax = Math.max(ox.hole.d, fuel.hole.d)
  out.push({
    key: 'ring-gap',
    label: 'Gap between rings',
    ok: gap >= inp.minPitchDiameters * dMax,
    value: gap / dMax,
    limit: inp.minPitchDiameters,
    unit: 'hole dia',
  })
  const body = eng.Dc * 1000 + 2 * inp.wallMm
  out.push({ key: 'body', label: 'Chamber plus wall', ok: body <= inp.maxDiameterMm, value: body, limit: inp.maxDiameterMm, unit: 'mm' })
  out.push({ key: 'mass', label: 'Injector mass', ok: massKg <= inp.maxInjectorMassKg, value: massKg, limit: inp.maxInjectorMassKg, unit: 'kg' })
  return out
}

/** Solid round body of the chamber diameter plus a margin (port assumption). */
export function injectorMass(inp: DesignInputs, eng: EngineSize): number {
  const D = eng.Dc + (2 * inp.bodyMarginMm) / 1000
  return inp.bodyDensity * (Math.PI / 4) * D * D * (inp.injectorThicknessMm / 1000)
}

export function sprayHoles(side: PropSide, sigma: number): SprayHole[] {
  const out: SprayHole[] = []
  for (let k = 0; k < side.holes; k++) {
    const a = ((side.clockDeg + (360 * k) / side.holes) * Math.PI) / 180
    out.push({ prop: side.prop, x: side.ringRadius * Math.cos(a), y: side.ringRadius * Math.sin(a), mdot: side.mdot / side.holes, sigma })
  }
  return out
}

/** v0.4 guesses for the gas speed that shatters drops; nominal is their average. */
export function relativeVelocity(s: Scenario, vJet: number, uGas: number): number {
  const pess = vJet
  const opt = 0.5 * uGas
  return s === 'pessimistic' ? pess : s === 'optimistic' ? opt : 0.5 * (pess + opt)
}

function scenarioProp(inp: DesignInputs, eng: EngineSize, side: PropSide, s: Scenario, x: number): ScenarioProp {
  const vRel = relativeVelocity(s, side.hole.v, eng.uGas)
  const drop = droplet({
    rhoL: side.liquid.rho,
    sigma: side.liquid.sigma,
    muL: side.liquid.mu,
    d: side.hole.d,
    vJet: side.hole.v,
    rhoG: eng.rhoGas,
    vRel,
  })
  const tau = lifetime(drop.smd, inp.vaporizationK)
  const xv = side.hole.v * 0.5 * tau
  return {
    vRel,
    drop,
    tau,
    xv,
    vaporized: vaporizedFraction(eng.tRes, tau),
    sigmaEnd: spraySigma(x, side.hole.d, drop.tanHalfAngle, xv),
  }
}

export function ofClamp(inp: DesignInputs, t: CeaTable): readonly [number, number] {
  return inp.clampLegacyOF ? LEGACY_OF_RANGE : [t.OF[0]!, t.OF[t.OF.length - 1]!]
}

export function runScenario(
  inp: DesignInputs,
  eng: EngineSize,
  ox: PropSide,
  fuel: PropSide,
  s: Scenario,
  n: number,
  curve: CstarCurve,
  t: CeaTable = LOX_ETHANOL,
): ScenarioResult {
  const sOx = scenarioProp(inp, eng, ox, s, eng.Lc)
  const sFuel = scenarioProp(inp, eng, fuel, s, eng.Lc)
  const field = fluxField([...sprayHoles(ox, sOx.sigmaEnd), ...sprayHoles(fuel, sFuel.sigmaEnd)], eng.Dc / 2, n, inp.wallMode)
  const mixing = mixingStats(field, curve, {
    ofDesign: inp.of,
    cstarDesign: eng.comb.cstar,
    mdotOx: eng.mdotOx,
    mdotFuel: eng.mdotFuel,
    ofClamp: ofClamp(inp, t),
    cap: inp.capEtaMix,
  })
  const etaVap = (eng.mdotOx * sOx.vaporized + eng.mdotFuel * sFuel.vaporized) / eng.mdot
  const eta = etaVap * mixing.etaMix
  return { scenario: s, ox: sOx, fuel: sFuel, etaVap, mixing, eta, ispDelivered: eng.comb.IspSL * eta }
}

export function evaluatePoint(
  inp: DesignInputs,
  point: DesignPoint,
  scenarios: readonly Scenario[],
  n = 121,
  t: CeaTable = LOX_ETHANOL,
): PointResult {
  const eng = sizeEngine(t, inp.thrustN, point.pcBar, inp.of, point.lStarM, inp.contractionRatio)
  const ox = propSide(inp, 'ox', eng, point.dpFrac)
  const fuel = propSide(inp, 'fuel', eng, point.dpFrac)
  const injectorMassKg = injectorMass(inp, eng)
  const cons = constraints(inp, eng, ox, fuel, injectorMassKg)
  const result: PointResult = {
    point,
    engine: eng,
    ox,
    fuel,
    injectorMassKg,
    constraints: cons,
    feasible: cons.every((c) => c.ok),
    scenarios: {},
  }
  if (scenarios.length) {
    const curve = cstarCurve(t, point.pcBar)
    for (const s of scenarios) result.scenarios[s] = runScenario(inp, eng, ox, fuel, s, n, curve, t)
  }
  return result
}

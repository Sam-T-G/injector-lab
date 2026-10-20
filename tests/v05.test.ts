import { describe, expect, it } from 'vitest'
import { combustion, LOX_ETHANOL } from '../src/physics/cea'
import { groupRadii, massMedianRadius } from '../src/physics/v05/drops'
import { chugCritical, evaluate05, faceRatio, operatingPoint } from '../src/physics/v05/evaluate'
import { jet } from '../src/physics/v05/jet'
import { dropRates, march } from '../src/physics/v05/march'
import { cstarOfF, liquid, productProps, R_U, tSat, vaporCp } from '../src/physics/v05/tables'
import { DEFAULT_INPUTS05 } from '../src/physics/v05/types'
import { mixVapor } from '../src/physics/v05/vapormix'

const comb = combustion(LOX_ETHANOL, 27.5, 1.7)
const far = productProps(27.5, 1.7, comb.Tc)
const env = { P: 27.5e5, pcBar: 27.5, of: 1.7, Tinf: comb.Tc, rhoFar: (27.5e5 * far.MW) / 1000 / (R_U * comb.Tc) }

describe('drop sizes (review B, S3)', () => {
  it('reproduces Priem 25/48/75/120/225 µm groups within 4%', () => {
    const r = groupRadii(75e-6).map((x) => x * 1e6)
    ;[25, 48, 75, 120, 225].forEach((want, k) => expect(Math.abs(r[k]! / want - 1)).toBeLessThan(0.04))
  })

  it('gives a property factor near 1 for n-heptane, the calibration fluid', () => {
    const f = massMedianRadius({ d: 1e-3, U: 19.8, sigma: 0.0201, muL: 3.86e-4, rhoL: 684 }).propertyFactor
    expect(f).toBeGreaterThan(0.98)
    expect(f).toBeLessThan(1.06)
  })
})

describe('jet core length (review B, S2)', () => {
  it('lands inside review B range for the v0.4 LOX jet (221-328 mm)', () => {
    const j = jet({ d: 1.404e-3, U: 19.7, rhoL: 1141, sigma: 0.0132, rhoG: 2.29, f: 0.023 })
    expect(j.regime).toBe('atomization')
    expect(j.coreLength! * 1000).toBeGreaterThan(221)
    expect(j.coreLength! * 1000).toBeLessThan(328)
  })
})

describe('droplet march (review B, S4-S8)', () => {
  it('reproduces the Spalding d²-law in the boiling limit with no slip (S7)', () => {
    const Tcap = tSat('lox', 0.99 * 27.5e5)
    const m = (4 / 3) * Math.PI * (1e-4) ** 3 * liquid('lox', Tcap).rho
    const d = dropRates('lox', m, Tcap, 0, Tcap, env)
    const Tref = Tcap + (comb.Tc - Tcap) / 3
    const film = productProps(27.5, 1.7, Tref)
    const cpv = vaporCp('lox', Tref)
    const liq = liquid('lox', Tcap)
    const B = (cpv * (comb.Tc - Tcap)) / liq.hvap
    const K0 = (8 * (film.k / cpv) * Math.log(1 + B)) / liq.rho
    const dD2dt = -(2 * d.mdotE) / (Math.PI * liq.rho * d.r) // d(D^2)/dt for a sphere
    expect(dD2dt / -K0).toBeCloseTo(1, 6)
  })

  it('matches review B readings of the TN 3883 oxygen curve within 6 points', () => {
    const cases: [number, number][] = [
      [79e-6, 0.99],
      [110e-6, 0.96],
      [200e-6, 0.85],
    ]
    for (const [rm, want] of cases) {
      const out = march({
        streams: [{ key: 'lox', mdot: 0.4185, U0: 19.7, T0: 90, radii: groupRadii(rm) }],
        pcBar: 27.5,
        of: 1.7,
        Tinf: comb.Tc,
        uFin: 138,
        mdotGas: 0.4185,
        length: 0.25,
        sample: 0.005,
      })
      const F = out.streams[0]!.F
      expect(Math.abs(F[F.length - 1]! - want)).toBeLessThan(0.06)
    }
  })

  it('keeps vaporized fraction monotone and gas speed tied to it', () => {
    const out = march({
      streams: [{ key: 'ethanol', mdot: 0.25, U0: 25, T0: 293.15, radii: groupRadii(110e-6) }],
      pcBar: 27.5,
      of: 1.7,
      Tinf: comb.Tc,
      uFin: 140,
      mdotGas: 0.25,
      length: 0.3,
      sample: 0.01,
    })
    const F = out.streams[0]!.F
    for (let k = 1; k < F.length; k++) expect(F[k]!).toBeGreaterThanOrEqual(F[k - 1]! - 1e-12)
    for (let k = 0; k < F.length; k++) expect(out.u[k]!).toBeCloseTo(140 * F[k]!, 9)
  })

  it('refuses a chamber pressure above the LOX critical pressure', () => {
    expect(() =>
      march({ streams: [{ key: 'lox', mdot: 0.4, U0: 20, T0: 90, radii: [5e-5] }], pcBar: 55, of: 1.7, Tinf: 3300, uFin: 140, mdotGas: 0.4, length: 0.1, sample: 0.01 }),
    ).toThrow(/critical/)
  })
})

describe('vapor mixing (review C, M4-M9)', () => {
  const x = Float64Array.from({ length: 51 }, (_, k) => k * 0.004)
  const F = Float64Array.from(x, (v) => Math.min(1, v / 0.05))
  const base = {
    R: 0.025,
    n: 60,
    x,
    F: { ox: F, fuel: F },
    cstar: cstarOfF(LOX_ETHANOL, 27.5),
    fInj: 1 / 2.7,
    wallBand: 0.0025,
  }
  const holes = [
    { prop: 'ox' as const, x: 0.017, y: 0, mdot: 0.034, d: 1.4e-3, coreLength: null, halfAngle: 0.04 },
    { prop: 'fuel' as const, x: -0.012, y: 0, mdot: 0.02, d: 1.2e-3, coreLength: null, halfAngle: 0.03 },
  ]

  it('conserves each propellant to round-off', () => {
    const out = mixVapor({ ...base, holes, i: 0.1, Lambda: 0.025 })
    expect(out.massError).toBeLessThan(1e-9)
  })

  it('mixes better with more turbulence and keeps E_m inside 0-1', () => {
    const weak = mixVapor({ ...base, holes, i: 0.02, Lambda: 0.006 })
    const strong = mixVapor({ ...base, holes, i: 0.1, Lambda: 0.025 })
    const end = x.length - 1
    expect(strong.Em[end]!).toBeGreaterThan(weak.Em[end]!)
    for (const o of [weak, strong]) for (let k = 1; k <= end; k++) {
      expect(o.Em[k]!).toBeGreaterThanOrEqual(-1e-12)
      expect(o.Em[k]!).toBeLessThanOrEqual(1 + 1e-12)
    }
  })
})

describe('performance pieces (review A)', () => {
  it('gives review A chug-screen ratios tau_crit/theta at dP/Pc 0.15-0.40', () => {
    const want: [number, number][] = [
      [0.15, 0.59],
      [0.2, 0.87],
      [0.25, 1.21],
      [0.3, 1.66],
      [0.4, 3.33],
    ]
    for (const [dp, r] of want) expect(chugCritical(1 / (2 * dp), 1)).toBeCloseTo(r, 2)
    expect(chugCritical(1, 1)).toBe(Infinity)
  })

  it('adds 1.6% face pressure at CR 5 and 4.8% at CR 3', () => {
    expect(faceRatio(5)).toBeCloseTo(1.016, 3)
    expect(faceRatio(3)).toBeCloseTo(1.048, 3)
  })
})

describe('v0.5 design case', () => {
  const r = evaluate05(DEFAULT_INPUTS05, { nSweep: 40, nField: 40, stations: 61 })

  it('closes mass in every mixing run', () => {
    expect(r.massError).toBeLessThan(1e-9)
  })

  it('built hardware at the design efficiency runs at the design Pc and thrust', () => {
    const op = operatingPoint(
      DEFAULT_INPUTS05,
      { At: r.geom.At, cr: DEFAULT_INPUTS05.contractionRatio, L: r.ox.L, hole: { ox: { n: 12, d: r.ox.d }, fuel: { n: 12, d: r.fuel.d } } },
      DEFAULT_INPUTS05.etaDesign,
      r.etaCf,
    )!
    expect(op.pcBar).toBeCloseTo(27.5, 1)
    expect(Math.abs(op.thrustN / 1700 - 1)).toBeLessThan(0.005)
    expect(op.of).toBeCloseTo(1.7, 2)
  })

  it('reports a band with lo <= mid <= hi at the chosen length', () => {
    expect(r.eta.lo).toBeLessThanOrEqual(r.eta.mid + 1e-12)
    expect(r.eta.mid).toBeLessThanOrEqual(r.eta.hi + 1e-12)
  })

  it('takes the largest pressure drop the feed budget allows', () => {
    const pc = 27.5e5
    for (const s of [r.ox, r.fuel]) expect(s.dp).toBeCloseTo(Math.min(s.dpMax, 0.4 * pc), 6)
  })
})

describe('review fixes (2026-10-19 correctness pass)', () => {
  it('runs the built engine at the design point when the pressure-drop cap binds', () => {
    const inp = { ...DEFAULT_INPUTS05, ox: { ...DEFAULT_INPUTS05.ox, inletMaxBar: 45 }, fuel: { ...DEFAULT_INPUTS05.fuel, inletMaxBar: 45 } }
    const r = evaluate05({ ...inp, etaTarget: 0 }, { nSweep: 32, nField: 32, stations: 41 })
    expect(r.ox.dp).toBeCloseTo(0.4 * 27.5e5, 3)
    const mid = r.operating.find((o) => o.eta === r.eta.mid)!
    // At the central efficiency the engine sits near, not at, the design point; at 85% it is exact.
    const op = operatingPoint(inp, { At: r.geom.At, cr: 5, L: r.ox.L, hole: { ox: { n: 12, d: r.ox.d }, fuel: { n: 12, d: r.fuel.d } } }, 0.85, r.etaCf, undefined, {
      ox: r.ox.inletRequired,
      fuel: r.fuel.inletRequired,
    })!
    expect(op.pcBar).toBeCloseTo(27.5, 1)
    expect(Math.abs(op.thrustN / 1700 - 1)).toBeLessThan(0.005)
    expect(mid.pcBar).toBeLessThan(31)
  })

  it('names the feed budget when there is no room for a pressure drop', () => {
    const inp = { ...DEFAULT_INPUTS05, ox: { ...DEFAULT_INPUTS05.ox, inletMaxBar: 28 } }
    expect(() => evaluate05(inp, { nSweep: 24, nField: 24, stations: 21 })).toThrow(/feed budget/)
  })

  it('keeps the vapor composition equal to the vaporized-fuel ratio', () => {
    const x = Float64Array.from({ length: 31 }, (_, k) => k * 0.005)
    const out = mixVapor({
      holes: [
        { prop: 'ox', x: 0.017, y: 0, mdot: 0.034, d: 1.4e-3, coreLength: null, halfAngle: 0.04 },
        { prop: 'fuel', x: -0.012, y: 0, mdot: 0.02, d: 1.2e-3, coreLength: null, halfAngle: 0.03 },
      ],
      R: 0.025,
      n: 40,
      i: 0.05,
      Lambda: 0.025,
      x,
      F: { ox: Float64Array.from(x, (v) => Math.min(1, v / 0.03)), fuel: Float64Array.from(x, (v) => Math.min(1, v / 0.12)) },
      cstar: cstarOfF(LOX_ETHANOL, 27.5),
      fInj: 1 / 2.7,
      wallBand: 0.0025,
    })
    expect(out.compositionError).toBeLessThan(1e-9)
  })
})

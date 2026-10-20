import { describe, expect, it } from 'vitest'
import { breakupCap, droplet } from '../src/physics/atomization'
import { DEFAULT_INPUTS, evaluatePoint } from '../src/physics'
import { fluxField, mixingStats, spraySigma } from '../src/physics/mixing'
import { cstarCurve, LOX_ETHANOL } from '../src/physics/cea'
import { frictionFactor, holeFlow, sizeHole } from '../src/physics/orifice'
import { lifetime, vaporizedFraction } from '../src/physics/vaporization'
import { steps } from '../src/physics/interp'
import { liquidAt } from '../src/physics/liquids'

describe('orifice', () => {
  it('uses 64/Re below Re 2300 and Swamee-Jain above', () => {
    expect(frictionFactor(1000, 1e-3)).toBeCloseTo(0.064, 6)
    // Swamee-Jain at Re 1.6e5, e/d 1.42e-3 (hand calculation: 0.0230)
    expect(frictionFactor(1.6e5, 1.42e-3)).toBeCloseTo(0.023, 3)
  })

  it('passes the requested flow after sizing', () => {
    const lox = liquidAt('lox', 90.17)
    const h = sizeHole(0.0349, 0.0218, 4.125e5, lox.rho, lox.mu, 2e-6)
    expect(h.mdot).toBeCloseTo(0.0349, 7)
    expect(holeFlow(h.d, 0.0218, 4.125e5, lox.rho, lox.mu, 2e-6).mdot).toBeCloseTo(h.mdot, 9)
  })
})

describe('v0.4 droplet model', () => {
  it('drop lifetime scales as v_rel^-4 while the breakup cap is active (audit finding 1)', () => {
    const base = { rhoL: 1141, sigma: 0.0132, muL: 1.95e-4, d: 1.4e-3, vJet: 20, rhoG: 2.3 }
    const a = droplet({ ...base, vRel: 20 })
    const b = droplet({ ...base, vRel: 40 })
    expect(a.capActive && b.capActive).toBe(true)
    expect(lifetime(a.smd, 2e-6) / lifetime(b.smd, 2e-6)).toBeCloseTo(16, 6)
    expect(breakupCap(0.0132, 2.3, 20)).toBeCloseTo((12 * 0.0132) / (2.3 * 400), 12)
  })

  it('vaporizes nothing at t = 0 and everything at t >= tau', () => {
    expect(vaporizedFraction(0, 1)).toBe(0)
    expect(vaporizedFraction(1, 1)).toBe(1)
    expect(vaporizedFraction(0.5, 1)).toBeCloseTo(1 - Math.pow(0.5, 1.5), 12)
  })
})

describe('mixing field', () => {
  const R = 0.025
  const holes = [
    { prop: 'ox' as const, x: 0.017, y: 0, mdot: 0.03, sigma: 0.012 },
    { prop: 'fuel' as const, x: -0.011, y: 0, mdot: 0.02, sigma: 0.012 },
  ]

  it('mirror mode conserves each propellant inside the wall', () => {
    const f = fluxField(holes, R, 121, 'mirror')
    const curve = cstarCurve(LOX_ETHANOL, 27.5)
    const m = mixingStats(f, curve, { ofDesign: 1.5, cstarDesign: 1700, mdotOx: 0.03, mdotFuel: 0.02, ofClamp: [0.1, 10], cap: false })
    expect(m.capturedOx).toBeCloseTo(1, 9)
    expect(m.capturedFuel).toBeCloseTo(1, 9)
    expect(m.ofInside).toBeCloseTo(1.5, 9)
  })

  it('truncate mode loses the tails past the wall', () => {
    const f = fluxField(holes, R, 121, 'truncate')
    const curve = cstarCurve(LOX_ETHANOL, 27.5)
    const m = mixingStats(f, curve, { ofDesign: 1.5, cstarDesign: 1700, mdotOx: 0.03, mdotFuel: 0.02, ofClamp: [0.1, 10], cap: false })
    expect(m.capturedOx).toBeLessThan(0.8)
  })

  it('spray sigma adds the gas-jet term only past x_v', () => {
    expect(spraySigma(0.1, 1e-3, 0.05, 0.2)).toBeCloseTo(0.5 * (0.5e-3 + 0.005), 12)
    const s = spraySigma(0.3, 1e-3, 0.05, 0.2)
    expect(s).toBeCloseTo(Math.hypot(0.5 * (0.5e-3 + 0.015), (0.1 * 0.1) / 1.177), 12)
  })
})

describe('v0.4 default case diagnostics', () => {
  const r = evaluatePoint(DEFAULT_INPUTS, { pcBar: 27.5, lStarM: 1.25, dpFrac: 0.15 }, ['nominal', 'optimistic'], 121)

  it('computes the nominal efficiency on less than half the propellant (audit finding 5)', () => {
    const m = r.scenarios.nominal!.mixing
    expect(m.capturedOx).toBeLessThan(0.45)
    expect(m.capturedFuel).toBeLessThan(0.55)
  })

  it('needs the cap because the raw optimistic stream-tube value exceeds 1', () => {
    expect(r.scenarios.optimistic!.mixing.etaMixRaw).toBeGreaterThan(1)
    expect(r.scenarios.optimistic!.mixing.etaMix).toBe(1)
  })

  it('has a mass-conserving nominal efficiency at or below 1 under mirror walls', () => {
    const m = evaluatePoint({ ...DEFAULT_INPUTS, wallMode: 'mirror', capEtaMix: false }, r.point, ['nominal'], 121)
    expect(m.scenarios.nominal!.mixing.etaMixRaw).toBeLessThanOrEqual(1 + 1e-9)
  })
})

describe('grid', () => {
  it('includes the max value', () => {
    expect(steps(0.15, 0.4, 0.025)).toHaveLength(11)
    expect(steps(10, 40, 2.5).at(-1)).toBe(40)
  })
})

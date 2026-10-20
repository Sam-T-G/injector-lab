import { describe, expect, it } from 'vitest'
import { combustion, DEFAULT_INPUTS, LOX_ETHANOL, search } from '../src/physics'

// The v0.4 author's default-case output (1700 N, 35 bar inlets). The port is a
// reimplementation from the written description, so these are its acceptance numbers.
const V04 = {
  pcBar: 27.5,
  lStarM: 1.25,
  LcMm: 250,
  dpFrac: 0.15,
  DcMm: 51.5,
  DtMm: 23.0,
  mdot: 0.666,
  dOxMm: 1.404,
  dFuelMm: 1.21,
  vOx: 19.7,
  vFuel: 22.6,
  etaNominal: 0.995,
  etaPessimistic: 0.124,
  etaOptimistic: 1.0,
}

describe('CEA table', () => {
  it('matches the author check: c* = 1718 m/s at 20 bar, O/F 1.6', () => {
    expect(combustion(LOX_ETHANOL, 20, 1.6).cstar).toBeCloseTo(1718, 0)
  })
})

describe('v0.4 default case', () => {
  const r = search(DEFAULT_INPUTS)
  const c = r.chosen!

  it('chooses the same design point', () => {
    expect(c.point).toEqual({ pcBar: V04.pcBar, lStarM: V04.lStarM, dpFrac: V04.dpFrac })
    expect(c.engine.Lc * 1000).toBeCloseTo(V04.LcMm, 0)
  })

  it('sizes the same engine', () => {
    expect(c.engine.Dc * 1000).toBeCloseTo(V04.DcMm, 0)
    expect(c.engine.Dt * 1000).toBeCloseTo(V04.DtMm, 0)
    expect(Math.abs(c.engine.mdot / V04.mdot - 1)).toBeLessThan(0.005)
  })

  it('sizes the same holes and jet velocities', () => {
    expect(Math.abs((c.ox.hole.d * 1000) / V04.dOxMm - 1)).toBeLessThan(0.005)
    expect(Math.abs((c.fuel.hole.d * 1000) / V04.dFuelMm - 1)).toBeLessThan(0.005)
    expect(c.ox.hole.v).toBeCloseTo(V04.vOx, 0)
    expect(c.fuel.hole.v).toBeCloseTo(V04.vFuel, 0)
  })

  it('reports the same efficiency band', () => {
    expect(c.scenarios.nominal!.eta).toBeCloseTo(V04.etaNominal, 2)
    expect(c.scenarios.pessimistic!.eta).toBeCloseTo(V04.etaPessimistic, 2)
    expect(c.scenarios.optimistic!.eta).toBeCloseTo(V04.etaOptimistic, 2)
  })
})

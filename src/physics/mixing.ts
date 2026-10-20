import { bracket } from './interp'
import { flammabilityWeight } from './igniter'
import type { MixingStats, Prop, WallMode } from './types'

export interface SprayHole {
  prop: Prop
  x: number
  y: number
  mdot: number
  sigma: number
}

/** Mass flux of fuel and oxidizer on an n x n grid over the chamber cross-section, kg/(m^2 s). */
export interface FluxField {
  n: number
  R: number
  dx: number
  ox: Float64Array
  fuel: Float64Array
  inside: Uint8Array
}

/**
 * v0.4 spray width at distance x: half the spray edge radius (0.5 d + x tan(a/2)),
 * plus a gas-jet spreading term after vaporization onset x_v, added in quadrature.
 * 0.1 is the half-width spreading rate; 1.177 = sqrt(2 ln 2) turns half-width into sigma.
 */
export function spraySigma(x: number, d: number, tanHalf: number, xv: number): number {
  const s0 = 0.5 * (0.5 * d + x * tanHalf)
  if (x <= xv) return s0
  const g = (0.1 * (x - xv)) / 1.177
  return Math.sqrt(s0 * s0 + g * g)
}

/**
 * Sum of one Gaussian per hole. 'truncate' drops the tails that cross the wall,
 * as v0.4 appears to; 'mirror' adds an image source across the wall tangent and
 * then rescales each hole so its flux inside the chamber adds back to its mass flow.
 */
export function fluxField(holes: readonly SprayHole[], R: number, n: number, wall: WallMode): FluxField {
  const dx = (2 * R) / n
  const ox = new Float64Array(n * n)
  const fuel = new Float64Array(n * n)
  const inside = new Uint8Array(n * n)
  const xs = new Float64Array(n)
  for (let i = 0; i < n; i++) xs[i] = -R + (i + 0.5) * dx
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      if (xs[i]! * xs[i]! + xs[j]! * xs[j]! <= R * R) inside[j * n + i] = 1
    }
  }
  const one = new Float64Array(n * n)
  for (const h of holes) {
    const target = h.prop === 'ox' ? ox : fuel
    const r0 = Math.hypot(h.x, h.y)
    const sources: [number, number][] = [[h.x, h.y]]
    if (wall === 'mirror' && r0 > 0) {
      const s = (2 * R - r0) / r0
      sources.push([h.x * s, h.y * s])
    }
    const amp = h.mdot / (2 * Math.PI * h.sigma * h.sigma)
    const inv = 1 / (2 * h.sigma * h.sigma)
    let captured = 0
    one.fill(0)
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const k = j * n + i
        if (!inside[k]) continue
        let f = 0
        for (const [sx, sy] of sources) {
          const ddx = xs[i]! - sx
          const ddy = xs[j]! - sy
          f += amp * Math.exp(-(ddx * ddx + ddy * ddy) * inv)
        }
        one[k] = f
        captured += f * dx * dx
      }
    }
    const scale = wall === 'mirror' && captured > 0 ? h.mdot / captured : 1
    for (let k = 0; k < n * n; k++) target[k]! += one[k]! * scale
  }
  return { n, R, dx, ox, fuel, inside }
}

export interface CstarCurve {
  of: Float64Array
  cstar: Float64Array
}

function cstarAt(curve: CstarCurve, of: number): number {
  const { i, t } = bracket(curve.of, of)
  return curve.cstar[i]! + t * (curve.cstar[i + 1]! - curve.cstar[i]!)
}

export interface MixingOptions {
  ofDesign: number
  cstarDesign: number
  mdotOx: number
  mdotFuel: number
  ofClamp: readonly [number, number]
  cap: boolean
}

export function mixingStats(f: FluxField, curve: CstarCurve, o: MixingOptions): MixingStats {
  const dA = f.dx * f.dx
  let mOx = 0
  let mFuel = 0
  let cells = 0
  for (let k = 0; k < f.ox.length; k++) {
    if (!f.inside[k]) continue
    mOx += f.ox[k]! * dA
    mFuel += f.fuel[k]! * dA
    cells++
  }
  const meanOx = mOx / (cells * dA)
  const meanFuel = mFuel / (cells * dA)
  const total = mOx + mFuel
  const fBar = mFuel / total

  let varF = 0
  let cstarSum = 0
  let both = 0
  let flammable = 0
  for (let k = 0; k < f.ox.length; k++) {
    if (!f.inside[k]) continue
    const fo = f.ox[k]!
    const ff = f.fuel[k]!
    const w = (fo + ff) * dA
    if (w <= 0) continue
    const z = ff / (fo + ff)
    varF += w * (z - fBar) * (z - fBar)
    const ofLocal = ff > 0 ? fo / ff : Infinity
    const ofUse = Math.min(Math.max(ofLocal, o.ofClamp[0]), o.ofClamp[1])
    cstarSum += w * cstarAt(curve, ofUse)
    if (fo >= 0.05 * meanOx && ff >= 0.05 * meanFuel) {
      both++
      if (flammabilityWeight(ofLocal) >= Math.exp(-0.5)) flammable++
    }
  }
  const segregation = varF / total / (fBar * (1 - fBar))
  const etaMixRaw = cstarSum / total / o.cstarDesign
  return {
    capturedOx: mOx / o.mdotOx,
    capturedFuel: mFuel / o.mdotFuel,
    ofInside: mOx / mFuel,
    mixingIndex: 1 - segregation,
    etaMixRaw,
    etaMix: o.cap ? Math.min(1, etaMixRaw) : etaMixRaw,
    bothPresentArea: both / cells,
    flammableArea: flammable / cells,
  }
}

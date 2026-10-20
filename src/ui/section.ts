import { fluxField, igniterSpots, spraySigma, sprayHoles, type PointResult, type Scenario, type WallMode } from '../physics'
import type { FluxField } from '../physics/mixing'

/** Flux field at distance x (m) from the face for one scenario, using the result's spray parameters. */
export function sectionAt(r: PointResult, s: Scenario, x: number, n: number, wall: WallMode): FluxField {
  const sc = r.scenarios[s]!
  const sOx = spraySigma(x, r.ox.hole.d, sc.ox.drop.tanHalfAngle, sc.ox.xv)
  const sFuel = spraySigma(x, r.fuel.hole.d, sc.fuel.drop.tanHalfAngle, sc.fuel.xv)
  return fluxField([...sprayHoles(r.ox, sOx), ...sprayHoles(r.fuel, sFuel)], r.engine.Dc / 2, n, wall)
}

/** v0.4 igniter heuristic at a few stations; returns the best interior and near-wall spots overall. */
export function igniter(r: PointResult, s: Scenario, wall: WallMode) {
  const Lc = r.engine.Lc
  let interior: ReturnType<typeof igniterSpots>['interior'] = null
  let near: ReturnType<typeof igniterSpots>['wall'] = null
  for (const frac of [0.1, 0.25, 0.5, 0.75]) {
    const spots = igniterSpots(sectionAt(r, s, frac * Lc, 81, wall), frac * Lc)
    if (spots.interior && (!interior || spots.interior.score > interior.score)) interior = spots.interior
    if (spots.wall && (!near || spots.wall.score > near.score)) near = spots.wall
  }
  return { interior, wall: near }
}

// Diverging ramp: fuel-rich (amber) to design O/F (neutral) to oxidizer-rich (blue).
const RAMP: [number, number, number][] = [
  [0x6e, 0x43, 0x05],
  [0xb8, 0x74, 0x07],
  [0xe2, 0xbb, 0x72],
  [0xd9, 0xdd, 0xdb],
  [0x93, 0xb7, 0xdf],
  [0x2e, 0x6b, 0xb0],
  [0x17, 0x38, 0x61],
]

/** Color for a local O/F against the design value; t spans -1..1 over a factor of 4 either way. */
export function ofColor(of: number, ofDesign: number): [number, number, number] {
  const t = Number.isFinite(of) && of > 0 ? Math.max(-1, Math.min(1, Math.log(of / ofDesign) / Math.log(4))) : of > 0 ? 1 : -1
  const pos = ((t + 1) / 2) * (RAMP.length - 1)
  const i = Math.min(RAMP.length - 2, Math.floor(pos))
  const u = pos - i
  const a = RAMP[i]!
  const b = RAMP[i + 1]!
  return [a[0] + u * (b[0] - a[0]), a[1] + u * (b[1] - a[1]), a[2] + u * (b[2] - a[2])]
}

export const RAMP_CSS = `linear-gradient(90deg, ${RAMP.map((c) => `rgb(${c.join(',')})`).join(', ')})`

/** RGBA pixels for the field: color by O/F, opacity by total flux against the 98th percentile. */
export function fieldPixels(f: FluxField, ofDesign: number): Uint8ClampedArray {
  const px = new Uint8ClampedArray(f.n * f.n * 4)
  const totals: number[] = []
  for (let k = 0; k < f.ox.length; k++) if (f.inside[k]) totals.push(f.ox[k]! + f.fuel[k]!)
  totals.sort((a, b) => a - b)
  const ref = totals[Math.floor(0.98 * (totals.length - 1))] || 1
  for (let k = 0; k < f.ox.length; k++) {
    if (!f.inside[k]) continue
    const fo = f.ox[k]!
    const ff = f.fuel[k]!
    const [r, g, b] = ofColor(ff > 0 ? fo / ff : Infinity, ofDesign)
    px[4 * k] = r
    px[4 * k + 1] = g
    px[4 * k + 2] = b
    px[4 * k + 3] = 255 * Math.pow(Math.min(1, (fo + ff) / ref), 0.6)
  }
  return px
}

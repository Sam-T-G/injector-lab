import { OF_STOICH_LOX_ETHANOL } from './defaults'
import type { FluxField } from './mixing'

/** v0.4 flammability weight: a log-normal bump centered on stoichiometric O/F. */
export function flammabilityWeight(of: number, ofStoich = OF_STOICH_LOX_ETHANOL, width = 0.7): number {
  if (!(of > 0) || !Number.isFinite(of)) return 0
  const z = Math.log(of / ofStoich) / width
  return Math.exp(-0.5 * z * z)
}

export interface IgniterSpot {
  x: number
  r: number
  thetaDeg: number
  of: number
  score: number
}

/**
 * v0.4 igniter heuristic at one station: the cell with the highest flammability
 * weight times total flux, in the interior (r <= 0.8 R) and near the wall (r >= 0.9 R).
 * The 0.8 and 0.9 limits are port choices.
 */
export function igniterSpots(f: FluxField, x: number): { interior: IgniterSpot | null; wall: IgniterSpot | null } {
  let interior: IgniterSpot | null = null
  let wall: IgniterSpot | null = null
  for (let j = 0; j < f.n; j++) {
    for (let i = 0; i < f.n; i++) {
      const k = j * f.n + i
      if (!f.inside[k]) continue
      const px = -f.R + (i + 0.5) * f.dx
      const py = -f.R + (j + 0.5) * f.dx
      const r = Math.hypot(px, py)
      const fo = f.ox[k]!
      const ff = f.fuel[k]!
      const of = ff > 0 ? fo / ff : Infinity
      const score = flammabilityWeight(of) * (fo + ff)
      const spot = { x, r, thetaDeg: (Math.atan2(py, px) * 180) / Math.PI, of, score }
      if (r <= 0.8 * f.R && (!interior || score > interior.score)) interior = spot
      if (r >= 0.9 * f.R && (!wall || score > wall.score)) wall = spot
    }
  }
  return { interior, wall }
}

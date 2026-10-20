import type { HoleFlow } from './types'

const RE_LAMINAR = 2300

/** Darcy friction factor: 64/Re when laminar, Swamee-Jain otherwise. */
export function frictionFactor(re: number, relRough: number): number {
  if (re < RE_LAMINAR) return 64 / Math.max(re, 1e-9)
  const x = Math.log10(relRough / 3.7 + 5.74 / Math.pow(re, 0.9))
  return 0.25 / (x * x)
}

/** v0.4 hole model: sharp entry (K = 0.5) plus pipe friction over L/d. */
export function dischargeCoefficient(re: number, lOverD: number, relRough: number): number {
  return 1 / Math.sqrt(1 + 0.5 + frictionFactor(re, relRough) * lOverD)
}

/** Flow through one hole at pressure drop dp; v is the mean velocity in the hole. */
export function holeFlow(d: number, L: number, dp: number, rho: number, mu: number, roughness: number): HoleFlow {
  const vIdeal = Math.sqrt((2 * dp) / rho)
  let v = 0.7 * vIdeal
  let cd = 0.7
  let re = 0
  for (let k = 0; k < 200; k++) {
    re = (rho * v * d) / mu
    cd = dischargeCoefficient(re, L / d, roughness / d)
    const next = cd * vIdeal
    if (Math.abs(next - v) <= 1e-12 * vIdeal) {
      v = next
      break
    }
    v = next
  }
  re = (rho * v * d) / mu
  return { d, L, v, cd, re, mdot: rho * v * (Math.PI / 4) * d * d }
}

/** Hole diameter that passes mdotPerHole at dp, by bisection on d. */
export function sizeHole(mdotPerHole: number, L: number, dp: number, rho: number, mu: number, roughness: number): HoleFlow {
  let lo = 1e-5
  let hi = 0.02
  if (holeFlow(hi, L, dp, rho, mu, roughness).mdot < mdotPerHole) {
    throw new RangeError('required flow needs a hole larger than 20 mm')
  }
  for (let k = 0; k < 80; k++) {
    const mid = 0.5 * (lo + hi)
    if (holeFlow(mid, L, dp, rho, mu, roughness).mdot < mdotPerHole) lo = mid
    else hi = mid
  }
  return holeFlow(0.5 * (lo + hi), L, dp, rho, mu, roughness)
}

/** d^2-law lifetime of a drop of diameter d with evaporation constant K (m^2/s). */
export function lifetime(d: number, K: number): number {
  return (d * d) / K
}

/** Vaporized mass fraction after time t under the d^2-law: 1 - (1 - t/tau)^1.5. */
export function vaporizedFraction(t: number, tau: number): number {
  if (t >= tau) return 1
  if (t <= 0) return 0
  return 1 - Math.pow(1 - t / tau, 1.5)
}

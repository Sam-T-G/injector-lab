// Drop sizes (review B, S3).
// Mass-median radius from the Priem-Heidmann "parallel jets" line, back-fitted from LOX/heptane
// hot fires at 19.8 m/s (Fang 1983, NASA CR-168066, Fig 27). The line is a by-eye fit (+/-20%)
// until digitized [TBD]. Property correction: Fang Eq 2 [sourced]. Velocity correction:
// Fang section V.B, chosen there for sheets [judgment for jets].

export const SIGMA_G = 2.3
/** Midpoints of five equal-mass bins of a log-normal mass distribution. */
export const GROUP_Z = [-1.2816, -0.5244, 0, 0.5244, 1.2816] as const

export interface DropIn {
  d: number
  U: number
  sigma: number
  muL: number
  rhoL: number
}

export interface DropOut {
  rmUncorrected: number
  propertyFactor: number
  velocityFactor: number
  /** Mass-median radius, m. */
  rm: number
  flags: string[]
}

export function massMedianRadius(p: DropIn): DropOut {
  const rmUncorrected = 93e-6 * Math.pow(p.d / 1e-3, 0.6)
  const propertyFactor = 99.29 * Math.pow((p.sigma * p.muL) / p.rhoL, 0.25)
  const velocityFactor = Math.pow(p.U / 19.8, -0.66)
  const rm = rmUncorrected * propertyFactor * velocityFactor
  const flags: string[] = []
  if (p.U < 10 || p.U > 40) flags.push('injection velocity outside 10-40 m/s')
  if (rm < 25e-6 || rm > 225e-6) flags.push('mass-median radius outside 25-225 µm')
  return { rmUncorrected, propertyFactor, velocityFactor, rm, flags }
}

/** Radii of the five equal-mass groups. */
export function groupRadii(rm: number): number[] {
  return GROUP_Z.map((z) => rm * Math.pow(SIGMA_G, z))
}

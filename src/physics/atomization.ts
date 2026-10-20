import type { Droplet } from './types'

// v0.4 droplet model, as described by its author, citing Bayvel & Orzechowski,
// Liquid Atomization (1993): Eq 2-92 threshold, Eq 2-39 SMD (K from Table 6-3),
// Eq 6-10 spray angle. Fitted to diesel-type sprays; see FITTED below.
export const FITTED = { we: [6.3e4, 4e5] as const, lp: [185, 800] as const }

export interface DropletIn {
  rhoL: number
  sigma: number
  muL: number
  d: number
  vJet: number
  rhoG: number
  vRel: number
}

/** Secondary-breakup size limit D = 12 sigma / (rho_g v_rel^2). */
export function breakupCap(sigma: number, rhoG: number, vRel: number): number {
  return (12 * sigma) / (rhoG * vRel * vRel)
}

export function droplet(p: DropletIn): Droplet {
  const we = (p.rhoL * p.vJet * p.vJet * p.d) / p.sigma
  const lp = (p.rhoL * p.sigma * p.d) / (p.muL * p.muL)
  const m = p.rhoG / p.rhoL
  const z = 1 / Math.sqrt(lp) // Ohnesorge number
  const threshold = 266 * Math.pow(lp, -0.133) * Math.pow(m, -0.8)
  const regime = we >= threshold ? 'atomization' : 'jet-breakup'
  const primary =
    regime === 'atomization'
      ? 2.68 * p.d * Math.pow(we * m, -0.266) * Math.pow(lp, -0.0733)
      : 1.88 * p.d * Math.pow(1 + 3 * z, 1 / 6)
  const cap = breakupCap(p.sigma, p.rhoG, p.vRel)
  const smd = Math.min(primary, cap)
  const [C, mExp] = m >= 0.0095 ? [0.0112, 0.5] : [0.00364, 0.26]
  const tanHalfAngle = C * Math.pow(we, 0.32) * Math.pow(lp, 0.07) * Math.pow(m, mExp)
  return {
    we,
    lp,
    m,
    z,
    threshold,
    regime,
    primary,
    cap,
    capActive: cap < primary,
    smd,
    tanHalfAngle,
    halfAngleDeg: (Math.atan(tanHalfAngle) * 180) / Math.PI,
    inFittedRange: we >= FITTED.we[0] && we <= FITTED.we[1] && lp >= FITTED.lp[0] && lp <= FITTED.lp[1],
  }
}

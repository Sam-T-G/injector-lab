// Jet regime and intact-core length (review B, S2), after Trettel 2020,
// "Reevaluating the jet breakup regime diagram", Eqs 19, 20, 24, 26 [sourced, medium].
// Cold jets into still gas: in a hot chamber the core is likely shorter by an unknown amount.

export type JetRegime = 'rayleigh' | 'first-wind' | 'surface-breakup' | 'atomization'

export interface JetIn {
  d: number
  U: number
  rhoL: number
  sigma: number
  rhoG: number
  /** Darcy friction factor of the hole. */
  f: number
}

export interface JetOut {
  tu0: number
  tu0Clamped: boolean
  weG: number
  weL: number
  weGcrit: number
  regime: JetRegime
  /** Intact-core length, m; null when no correlation covers the regime. */
  coreLength: number | null
  coreFlags: string[]
  /** Spray half-angle after breakup, rad (Eq 20, low confidence). */
  halfAngle: number
}

export function jet(p: JetIn): JetOut {
  const raw = 0.366 * Math.pow(p.f, 0.459)
  const tu0 = Math.min(0.127, Math.max(0.049, raw))
  const weG = (p.rhoG * p.U * p.U * p.d) / p.sigma
  const weL = (p.rhoL * p.U * p.U * p.d) / p.sigma
  const weGcrit = 3.17 * Math.pow(tu0, -0.876)
  const regime: JetRegime = weG < 0.4 ? 'rayleigh' : weG < 13 ? 'first-wind' : weG > weGcrit ? 'atomization' : 'surface-breakup'
  const flags: string[] = []
  let coreLength: number | null = null
  const densityRatio = p.rhoL / p.rhoG
  if (regime === 'atomization') {
    coreLength = 5.31 * Math.pow(tu0, -0.568) * Math.pow(densityRatio, 0.335) * p.d
    if (densityRatio < 29.4 || densityRatio > 882) flags.push('density ratio outside 29-882')
  } else if (regime === 'surface-breakup') {
    coreLength = 3.61 * Math.pow(tu0, -0.275) * Math.pow(weL, 0.334) * p.d
  } else flags.push('no core-length correlation for this regime')
  if (raw !== tu0) flags.push('turbulence intensity clamped to the fitted 0.049-0.127')
  return {
    tu0,
    tu0Clamped: raw !== tu0,
    weG,
    weL,
    weGcrit,
    regime,
    coreLength,
    coreFlags: flags,
    halfAngle: Math.atan(5.32e-5 * Math.pow(weL, 0.605)),
  }
}

import data from '../data/liquids.json'
import { lerp1 } from './interp'
import type { LiquidState } from './types'

interface LiquidTable {
  label: string
  Tcrit: number
  pcrit: number
  Ttriple: number
  M: number
  T: number[]
  rho: number[]
  mu: number[]
  sigma: number[]
  psat: number[]
  cp: number[]
  k: number[]
  hvap: number[]
}

const TABLES = (data as unknown as { fluids: Record<string, LiquidTable> }).fluids
export const LIQUIDS_SOURCE = (data as { source: string }).source

/** Saturated-liquid properties at T, linearly interpolated. Throws outside the table. */
export function liquidAt(key: 'lox' | 'ethanol', T: number): LiquidState {
  const t = TABLES[key]
  if (!t) throw new RangeError(`no property table for ${key}`)
  const lo = t.T[0]!
  const hi = t.T[t.T.length - 1]!
  if (!(T >= lo && T <= hi)) throw new RangeError(`${t.label}: ${T} K is outside the table (${lo}-${hi} K)`)
  return {
    key,
    label: t.label,
    T,
    rho: lerp1(t.T, t.rho, T),
    mu: lerp1(t.T, t.mu, T),
    sigma: lerp1(t.T, t.sigma, T),
    psat: lerp1(t.T, t.psat, T),
    cp: lerp1(t.T, t.cp, T),
    k: lerp1(t.T, t.k, T),
    hvap: lerp1(t.T, t.hvap, T),
    Tcrit: t.Tcrit,
    pcrit: t.pcrit,
  }
}

export function liquidRange(key: 'lox' | 'ethanol'): [number, number] {
  const t = TABLES[key]!
  return [t.T[0]!, t.T[t.T.length - 1]!]
}

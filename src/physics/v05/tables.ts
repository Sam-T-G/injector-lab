import film from '../../data/film-lox-ethanol.json'
import liquids from '../../data/liquids.json'
import { bracket, lerp1 } from '../interp'
import { ceaField, type CeaTable } from '../cea'

export const R_U = 8.314462618 // J/(mol K)

type Key = 'lox' | 'ethanol'

interface FilmDoc {
  Pc: number[]
  OF: number[]
  T: number[]
  products: Record<'mu' | 'k' | 'cp' | 'MW', number[][][]>
  vapor: { T: number[]; lox: { MW: number; cp: number[] }; ethanol: { MW: number; cp: number[] } }
}
const F = film as unknown as FilmDoc

export interface GasProps {
  mu: number
  k: number
  cp: number
  /** kg/kmol */
  MW: number
}

/** Equilibrium combustion products at (Pc, O/F, T), frozen transport. Trilinear, clamped to the table. */
export function productProps(pcBar: number, of: number, T: number): GasProps {
  const a = bracket(F.Pc, pcBar)
  const b = bracket(F.OF, of)
  const c = bracket(F.T, T)
  const get = (f: 'mu' | 'k' | 'cp' | 'MW') => {
    const v = F.products[f]
    let s = 0
    for (const [ia, wa] of [[a.i, 1 - a.t], [a.i + 1, a.t]] as const)
      for (const [ib, wb] of [[b.i, 1 - b.t], [b.i + 1, b.t]] as const)
        for (const [ic, wc] of [[c.i, 1 - c.t], [c.i + 1, c.t]] as const) s += wa * wb * wc * v[ia]![ib]![ic]!
    return s
  }
  return { mu: get('mu'), k: get('k'), cp: get('cp'), MW: get('MW') }
}

/** Ideal-gas heat capacity of the propellant vapor (J/kg/K), clamped to 300 K and above. */
export function vaporCp(key: Key, T: number): number {
  return lerp1(F.vapor.T, F.vapor[key === 'lox' ? 'lox' : 'ethanol'].cp, Math.max(300, T))
}

export function vaporMW(key: Key): number {
  return F.vapor[key === 'lox' ? 'lox' : 'ethanol'].MW
}

interface LiquidDoc {
  T: number[]
  rho: number[]
  mu: number[]
  sigma: number[]
  psat: number[]
  cp: number[]
  hvap: number[]
  Tcrit: number
  pcrit: number
}
const L = (liquids as unknown as { fluids: Record<Key, LiquidDoc> }).fluids

export interface LiquidAt {
  rho: number
  mu: number
  sigma: number
  psat: number
  cp: number
  hvap: number
}

/** Saturated-liquid properties at T, clamped to the table (which ends just below the critical point). */
export function liquid(key: Key, T: number): LiquidAt {
  const t = L[key]
  return {
    rho: lerp1(t.T, t.rho, T),
    mu: lerp1(t.T, t.mu, T),
    sigma: Math.max(0, lerp1(t.T, t.sigma, T)),
    psat: lerp1(t.T, t.psat, T),
    cp: lerp1(t.T, t.cp, T),
    hvap: Math.max(0, lerp1(t.T, t.hvap, T)),
  }
}

export function critical(key: Key): { T: number; p: number } {
  return { T: L[key].Tcrit, p: L[key].pcrit }
}

/** Saturation temperature at pressure p (Pa), by inverting the tabulated vapor pressure. */
export function tSat(key: Key, p: number): number {
  const t = L[key]
  return lerp1(t.psat, t.T, Math.min(p, t.psat[t.psat.length - 1]!))
}

/**
 * c* over fuel mass fraction f in [0, 1] at one chamber pressure: CEA equilibrium inside the
 * table, and the c* of cold propellant vapor at its saturation temperature at the two ends
 * (judgment, after Hersch TN D-2881 Table I). Piecewise linear, so monotone between points.
 */
export function cstarOfF(t: CeaTable, pcBar: number): { f: Float64Array; cstar: Float64Array } {
  const pts: [number, number][] = t.OF.map((of) => [1 / (1 + of), ceaField(t, 'cstar', pcBar, of)])
  const cold = (key: Key) => {
    const Tv = Math.min(tSat(key, pcBar * 1e5), critical(key).T)
    const R = R_U / (vaporMW(key) / 1000)
    const cp = vaporCp(key, Tv)
    const g = cp / (cp - R)
    const gam = Math.sqrt(g) * Math.pow(2 / (g + 1), (g + 1) / (2 * (g - 1)))
    return Math.sqrt(R * Tv) / gam
  }
  pts.push([0, cold('lox')], [1, cold('ethanol')])
  pts.sort((a, b) => a[0] - b[0])
  return { f: Float64Array.from(pts, (p) => p[0]), cstar: Float64Array.from(pts, (p) => p[1]) }
}

import table from '../data/cea-lox-ethanol.json'
import { bracket } from './interp'
import type { Combustion } from './types'

export type CeaField = 'cstar' | 'Tc' | 'MW' | 'gamma' | 'rho' | 'IspSL' | 'IspVac' | 'eps' | 'cp' | 'mu' | 'kfr' | 'cpfr' | 'Prfr'
// Fields copied into a Combustion record; transport extras are read with ceaField.
const FIELDS = ['cstar', 'Tc', 'MW', 'gamma', 'rho', 'IspSL', 'IspVac', 'eps', 'cp', 'mu'] as const

export interface CeaTable {
  pair: string
  label: string
  source: string
  Pc: number[]
  OF: number[]
  fields: Record<CeaField, (number | null)[][]>
}

export const LOX_ETHANOL = table as unknown as CeaTable

/** The O/F range of the v0.4 table; the original code had no data outside it. */
export const LEGACY_OF_RANGE: readonly [number, number] = [0.3, 4.0]

function cell(t: CeaTable, f: CeaField, i: number, j: number): number {
  const v = t.fields[f][i]?.[j]
  if (v == null) throw new RangeError(`CEA table has no ${f} at Pc=${t.Pc[i]} bar, O/F=${t.OF[j]}`)
  return v
}

/** Bilinear interpolation in (Pc, O/F). Both are clamped to the table. */
export function ceaField(t: CeaTable, f: CeaField, pcBar: number, of: number): number {
  const a = bracket(t.Pc, pcBar)
  const b = bracket(t.OF, of)
  const v00 = cell(t, f, a.i, b.i)
  const v01 = cell(t, f, a.i, b.i + 1)
  const v10 = cell(t, f, a.i + 1, b.i)
  const v11 = cell(t, f, a.i + 1, b.i + 1)
  return (1 - a.t) * ((1 - b.t) * v00 + b.t * v01) + a.t * ((1 - b.t) * v10 + b.t * v11)
}

export function combustion(t: CeaTable, pcBar: number, of: number): Combustion {
  const out = { pcBar, of } as Combustion
  for (const f of FIELDS) out[f] = ceaField(t, f, pcBar, of)
  return out
}

/** Precomputed c*(O/F) at one chamber pressure, for the per-cell stream-tube sum. */
export function cstarCurve(t: CeaTable, pcBar: number): { of: Float64Array; cstar: Float64Array } {
  const of = Float64Array.from(t.OF)
  const cstar = of.map((x) => ceaField(t, 'cstar', pcBar, x))
  return { of, cstar }
}

/** O/F on the table grid with the highest sea-level Isp at this pressure. */
export function bestOF(t: CeaTable, pcBar: number, lo = 0.3, hi = 4.0): number {
  let best = NaN
  let bestIsp = -Infinity
  for (const of of t.OF) {
    if (of < lo || of > hi) continue
    const isp = ceaField(t, 'IspSL', pcBar, of)
    if (isp > bestIsp) {
      bestIsp = isp
      best = of
    }
  }
  return best
}

import { LOX_ETHANOL, cstarCurve, type CeaTable } from './cea'
import { evaluatePoint, MODEL, runScenario } from './evaluate'
import { steps } from './interp'
import { SCENARIOS, type DesignInputs, type SearchCell, type SearchResult } from './types'

export interface SearchOptions {
  /** Grid size for the mixing field while scanning. */
  nScan?: number
  /** Grid size for the chosen design's final evaluation. */
  nFinal?: number
  onProgress?: (done: number, total: number) => void
}

/**
 * v0.4 search: scan Pc x L* x dP/Pc, keep feasible points, maximize nominal delivered
 * Isp, then take the lowest Pc, shortest L*, smallest dP within tieWindow of the best.
 */
export function search(inp: DesignInputs, opts: SearchOptions = {}, t: CeaTable = LOX_ETHANOL): SearchResult {
  const nScan = opts.nScan ?? 61
  const nFinal = opts.nFinal ?? 121
  const axes = {
    pcBar: steps(inp.grid.pcBar.min, inp.grid.pcBar.max, inp.grid.pcBar.step),
    lStarM: steps(inp.grid.lStarM.min, inp.grid.lStarM.max, inp.grid.lStarM.step),
    dpFrac: steps(inp.grid.dpFrac.min, inp.grid.dpFrac.max, inp.grid.dpFrac.step),
  }
  const total = axes.pcBar.length * axes.lStarM.length * axes.dpFrac.length
  const cells: SearchCell[] = []
  let done = 0
  for (const pcBar of axes.pcBar) {
    const curve = cstarCurve(t, pcBar)
    for (const lStarM of axes.lStarM) {
      for (const dpFrac of axes.dpFrac) {
        const point = { pcBar, lStarM, dpFrac }
        const cell: SearchCell = { point, feasible: false, failed: [], ispNominal: null, etaNominal: null }
        try {
          const r = evaluatePoint(inp, point, [], nScan, t)
          cell.failed = r.constraints.filter((c) => !c.ok).map((c) => c.key)
          cell.feasible = r.feasible
          if (r.feasible) {
            const s = runScenario(inp, r.engine, r.ox, r.fuel, 'nominal', nScan, curve, t)
            cell.ispNominal = s.ispDelivered
            cell.etaNominal = s.eta
          }
        } catch (e) {
          cell.failed = [e instanceof Error ? e.message : String(e)]
        }
        cells.push(cell)
        opts.onProgress?.(++done, total)
      }
    }
  }
  const feasible = cells.filter((c) => c.ispNominal != null)
  if (!feasible.length) return { model: MODEL, axes, cells, bestIsp: null, chosen: null, onEdge: [] }
  const bestIsp = Math.max(...feasible.map((c) => c.ispNominal!))
  const pick = feasible
    .filter((c) => c.ispNominal! >= (1 - inp.tieWindow) * bestIsp)
    .sort((a, b) => a.point.pcBar - b.point.pcBar || a.point.lStarM - b.point.lStarM || a.point.dpFrac - b.point.dpFrac)[0]!
  const chosen = evaluatePoint(inp, pick.point, SCENARIOS, nFinal, t)
  const onEdge: SearchResult['onEdge'] = []
  for (const k of ['pcBar', 'lStarM', 'dpFrac'] as const) {
    const ax = axes[k]
    if (ax.length > 1 && (pick.point[k] === ax[0] || pick.point[k] === ax[ax.length - 1])) onEdge.push(k)
  }
  return { model: MODEL, axes, cells, bestIsp, chosen, onEdge }
}

import type { PointResult, SearchResult } from './types'

export type Severity = 'stop' | 'check'

export interface Finding {
  key: string
  severity: Severity
  title: string
  detail: string
}

const pct = (x: number) => `${(100 * x).toFixed(0)}%`

/**
 * Problems with a result that a user must see before trusting it.
 * 'stop' means the number shown is not supported by the model's own data or physics;
 * 'check' means it rests on a rule of thumb or an edge of the search.
 */
export function findings(r: PointResult, search?: SearchResult): Finding[] {
  const out: Finding[] = []
  const nom = r.scenarios.nominal
  const pess = r.scenarios.pessimistic
  const opt = r.scenarios.optimistic

  const outside = [r.scenarios.nominal?.ox.drop, r.scenarios.nominal?.fuel.drop].some((d) => d && !d.inFittedRange)
  if (outside) {
    const d = nom!.ox.drop
    out.push({
      key: 'fitted-range',
      severity: 'stop',
      title: 'Drop size and spray angle are extrapolated',
      detail: `The atomization correlations were fitted for Weber number 6.3e4 to 4e5 and Laplace number 185 to 800. The LOX jet here has We = ${d.we.toExponential(1)} and Lp = ${d.lp.toExponential(1)}.`,
    })
  }

  if (nom && (nom.mixing.capturedOx < 0.95 || nom.mixing.capturedFuel < 0.95)) {
    out.push({
      key: 'mass-leak',
      severity: 'stop',
      title: 'Mixing efficiency is computed on part of the propellant',
      detail: `At the chamber exit, ${pct(nom.mixing.capturedOx)} of the LOX and ${pct(nom.mixing.capturedFuel)} of the ethanol fall inside the wall; the spray tails past the wall are dropped. Set "Spray at the chamber wall" to "Reflect tails back inside" to keep all of it.`,
    })
  }

  const capped = [pess, nom, opt].filter((s) => s && s.mixing.etaMixRaw > 1 + 1e-6)
  if (capped.length) {
    out.push({
      key: 'cap',
      severity: 'stop',
      title: 'Stream-tube efficiency above 100% was cut to 100%',
      detail: `Raw value ${(100 * capped[0]!.mixing.etaMixRaw).toFixed(2)}% in the ${capped[0]!.scenario} case. With all propellant counted and averaged by mass fraction, this sum should not exceed 100% near the design O/F.`,
    })
  }

  if (pess && opt && opt.eta - pess.eta > 0.25) {
    out.push({
      key: 'spread',
      severity: 'stop',
      title: `Efficiency could be anywhere from ${pct(pess.eta)} to ${pct(opt.eta)}`,
      detail: `The band comes from the guessed gas speed that breaks up drops. Drop life scales as that speed to the power -4, so the nominal value is an arbitrary point in the band.`,
    })
  }

  if (r.point.dpFrac < 0.2) {
    out.push({
      key: 'stiffness',
      severity: 'check',
      title: `Injector pressure drop is ${pct(r.point.dpFrac)} of chamber pressure`,
      detail: 'A common rule of thumb against chugging is at least 15 to 20%. This is a rule of thumb, not a stability analysis.',
    })
  }

  if (search?.onEdge.length) {
    const names = { pcBar: 'chamber pressure', lStarM: 'L*', dpFrac: 'pressure drop' }
    out.push({
      key: 'edge',
      severity: 'check',
      title: `The chosen design sits at the edge of the search range for ${search.onEdge.map((k) => names[k]).join(' and ')}`,
      detail: 'The search bounds, not the physics, decided that value. The tie-break picks the lowest pressure, shortest chamber and smallest pressure drop within 1% of the best.',
    })
  }

  if (r.ox.ringRadius > r.fuel.ringRadius) {
    out.push({
      key: 'ox-wall',
      severity: 'check',
      title: 'LOX is on the outer ring, next to the wall',
      detail: 'Common practice keeps the wall fuel-rich to protect it. The hole areas match LOX on the outer ring, so confirm the assignment with the CAD.',
    })
  }

  if (pess && nom) {
    out.push({
      key: 'sizing',
      severity: 'check',
      title: 'Sizing assumes 100% efficiency',
      detail: `Mass flow and throat come from ideal Isp and c*. To first order thrust scales with c*, so the engine makes roughly ${(100 * nom.eta).toFixed(0)}% of the target thrust at the nominal efficiency and ${(100 * pess.eta).toFixed(0)}% at the pessimistic one.`,
    })
  }

  return out
}

import type { Finding } from '../checks'
import type { Inputs05, Result05 } from './types'

const pct = (x: number, d = 0) => `${(100 * x).toFixed(d)}%`

export interface Driver {
  name: string
  spread: number
}

/** How much each uncertain input moves the efficiency at the chosen length, others held central. */
export function drivers(r: Result05, inp: Inputs05): Driver[] {
  const iMid = inp.mixI[Math.floor(inp.mixI.length / 2)]
  // The central case uses the chamber radius as the mixing length.
  const lamR = r.geom.Dc / 2
  const spread = (xs: number[]) => (xs.length ? Math.max(...xs) - Math.min(...xs) : 0)
  return [
    { name: 'turbulence intensity', spread: spread(r.sweep.filter((s) => s.drop === 1 && s.Lambda === lamR).map((s) => s.etaAt)) },
    { name: 'turbulent mixing length', spread: spread(r.sweep.filter((s) => s.drop === 1 && s.i === iMid).map((s) => s.etaAt)) },
    { name: 'drop size', spread: spread(r.sweep.filter((s) => s.i === iMid && s.Lambda === lamR).map((s) => s.etaAt)) },
  ].sort((a, b) => b.spread - a.spread)
}

export function findings05(r: Result05, inp: Inputs05): Finding[] {
  const out: Finding[] = []
  const Lc = r.geom.Lcyl
  const width = r.eta.hi - r.eta.lo

  if (r.massError > 1e-9) {
    out.push({ key: 'mass', severity: 'stop', title: 'Internal error: the mixing solve lost mass', detail: `Largest relative error ${r.massError.toExponential(1)}. Report this with the downloaded JSON.` })
  }
  if (r.emRange[0] < -1e-9 || r.emRange[1] > 1 + 1e-9) {
    out.push({ key: 'em', severity: 'stop', title: 'Internal error: mixing efficiency outside 0 to 1', detail: `E_m ranges ${r.emRange.map((v) => v.toFixed(3)).join(' to ')}. Report this with the downloaded JSON.` })
  }
  if (r.etaMixMax > 1 + 1e-9) {
    out.push({
      key: 'etamix',
      severity: 'stop',
      title: 'Stream-tube sum above 100%',
      detail: `Largest value ${(100 * r.etaMixMax).toFixed(2)}%. With mass conserved this should only happen where c* curves upward over the spread of mixture ratios; check before trusting the band.`,
    })
  }
  if (r.gapMass > 0.01) {
    out.push({
      key: 'gap',
      severity: 'check',
      title: `Up to ${pct(r.gapMass)} of the vapor is nearly pure LOX or pure ethanol`,
      detail: `That share sits beyond the CEA table (O/F 0.02 to 50), so its c* is interpolated toward cold unreacted gas (judgment). It peaks in the weakest-mixing case and sets the low edge of the band; in the central case it is ${pct(r.gapMassCentral, 1)}.`,
    })
  }

  if (width > 0.05) {
    const d = drivers(r, inp)
    out.push({
      key: 'band',
      severity: 'stop',
      title: `Efficiency could be anywhere from ${pct(r.eta.lo)} to ${pct(r.eta.hi)}`,
      detail: `The model cannot narrow this until hot-fire data calibrate it. Largest effects at this length: ${d.map((x) => `${x.name} (${pct(x.spread)})`).join(', ')}.`,
    })
  }

  for (const s of [r.ox, r.fuel]) {
    const name = s.prop === 'ox' ? 'LOX' : 'Ethanol'
    if (s.jet.coreLength !== null && s.jet.coreLength > Lc) {
      out.push({
        key: `core-${s.prop}`,
        severity: 'stop',
        title: `${name} jets may stay intact past the end of the chamber`,
        detail: `Cold-flow correlations give an intact core of ${(s.jet.coreLength * 1000).toFixed(0)} mm against a ${(Lc * 1000).toFixed(0)} mm cylinder. The vaporization result assumes drops from the face, so it is optimistic.`,
      })
    } else if (s.jet.coreLength !== null && s.jet.coreLength > 0.5 * Lc) {
      out.push({
        key: `core-${s.prop}`,
        severity: 'check',
        title: `${name} jets keep an intact core for ${(s.jet.coreLength * 1000).toFixed(0)} mm`,
        detail: 'That is more than half the chamber. The vaporization result assumes drops from the face.',
      })
    }
  }

  const endWall = r.wall.vaporOF[r.wall.vaporOF.length - 1]
  if (r.wall.outerProp !== 'ox' && endWall && endWall.of > r.of && !inp.wallProtected) {
    out.push({
      key: 'wall',
      severity: 'check',
      title: 'The wall zone ends up richer in oxidizer than the engine average',
      detail: `Vapor O/F next to the wall at the chamber end ${endWall.of.toFixed(2)} against ${r.of.toFixed(2)} overall (central case).`,
    })
  }
  if (r.wall.outerProp === 'ox' && !inp.wallProtected) {
    const v = r.wall.vaporOF.map((w) => `${(w.x * 1000).toFixed(0)} mm: ${Number.isNaN(w.of) ? 'no vapor' : Number.isFinite(w.of) ? w.of.toFixed(1) : 'all LOX'}`).join(', ')
    out.push({
      key: 'wall',
      severity: 'stop',
      title: 'The wall sees oxidizer-rich gas',
      detail: `LOX is on the outer ring, so the wall zone starts above the stoichiometric O/F of 2.08. Vapor O/F next to the wall (central case): ${v}. Put ethanol on the outer ring, or confirm film cooling or an ablative liner.`,
    })
  }

  const chug = [r.chug.ox, r.chug.fuel].map((c) => c.tauCrit / r.chug.tau)
  const worst = Math.min(...chug)
  const feedCoupled = r.chug.ox.k > 1 || r.chug.fuel.k > 1
  if (!feedCoupled) {
    // k <= 1 on both sides: the single-delay screen has no delay-driven instability.
  } else if (!Number.isFinite(r.chug.tau)) {
    out.push({
      key: 'chug',
      severity: 'stop',
      title: 'Chugging screen cannot be evaluated',
      detail: 'Half of the slower propellant does not vaporize inside the chamber, so the combustion delay is longer than the chamber can show.',
    })
  } else if (Number.isFinite(worst) && worst < 2) {
    out.push({
      key: 'chug',
      severity: worst < 1 ? 'stop' : 'check',
      title: worst < 1 ? 'Chugging screen fails' : 'Chugging screen has little margin',
      detail: `The critical combustion delay is ${(Math.min(r.chug.ox.tauCrit, r.chug.fuel.tauCrit) * 1000).toFixed(2)} ms; half the slower propellant takes ${(r.chug.tau * 1000).toFixed(2)} ms to vaporize. Ratio ${worst.toFixed(2)}, screen wants 2 or more. A single-delay model, not a stability analysis.`,
    })
  }

  for (const s of [r.ox, r.fuel]) {
    const f = s.dp / (r.pcBar * 1e5)
    if (f < 0.2) {
      out.push({
        key: `stiff-${s.prop}`,
        severity: f < 0.15 ? 'stop' : 'check',
        title: `${s.prop === 'ox' ? 'LOX' : 'Ethanol'} pressure drop is ${pct(f)} of chamber pressure`,
        detail: 'Rule of thumb: at least 15%, better 20% (Huzel & Huang, SP-125 p. 128).',
      })
    }
  }

  if (r.mode === 'design' && !r.targetMet) {
    out.push({
      key: 'target',
      severity: 'check',
      title: `The low edge of the band stays below ${pct(inp.etaTarget)} up to L* ${inp.lStarMaxM.toFixed(2)} m`,
      detail: 'Results are shown at the longest chamber. Build the chamber with a removable spool so length can be tested.',
    })
  }

  const ext: string[] = []
  for (const s of [r.ox, r.fuel]) {
    const name = s.prop === 'ox' ? 'LOX' : 'ethanol'
    if (s.drops.flags.length) ext.push(`${name} drop size (${s.drops.flags.join('; ')})`)
    if (s.reRange[1] > 400) ext.push(`${name} drag law (drop Re up to ${s.reRange[1].toFixed(0)}, fitted to 400)`)
    if (s.jet.coreFlags.length) ext.push(`${name} core length (${s.jet.coreFlags.join('; ')})`)
    if (s.bTMax > 20) ext.push(`${name} film theory (transfer number B_T up to ${s.bTMax.toFixed(0)}, checked to 20)`)
  }
  if (r.of < 0.8 || r.of > 4) ext.push(`film properties (O/F ${r.of.toFixed(2)} clamped to the 0.8-4.0 table)`)
  if (ext.length) {
    out.push({ key: 'extrapolated', severity: 'check', title: 'Some correlations run outside their data', detail: `${ext.join('. ')}.` })
  }

  const br = [r.ox, r.fuel].filter((s) => s.breakup)
  if (br.length) {
    out.push({
      key: 'breakup',
      severity: 'check',
      title: 'Drops meet the secondary breakup criterion',
      detail: `Weber number reaches ${br.map((s) => `${s.maxWe.toFixed(0)} (${s.prop === 'ox' ? 'LOX' : 'ethanol'})`).join(' and ')} against 12. The drop sizes come from hot-fire data that already include breakup, so the model only flags it.`,
    })
  }

  const nc = Math.max(r.nearCritical.lox, r.nearCritical.ethanol)
  if (nc >= 0.8) {
    out.push({
      key: 'critical',
      severity: 'check',
      title: `Chamber pressure is ${pct(nc)} of a propellant's critical pressure`,
      detail: 'Surface tension and latent heat collapse near the critical point; drop physics loses meaning there.',
    })
  }

  if (inp.mode05 === 'design' && (inp.contractionRatio < 3 || inp.contractionRatio > 8)) {
    out.push({ key: 'cr', severity: 'check', title: `Contraction ratio ${inp.contractionRatio} is outside 3 to 8`, detail: 'Small chambers lose c* below about 3 (Hersch TN D-129); the face-pressure rule of thumb covers about 2 to 8.' })
  }

  out.push({
    key: 'heat',
    severity: 'check',
    title: `Throat heat flux about ${(r.throat.q.mid / 1e6).toFixed(0)} MW/m²`,
    detail: `Bartz with a ×0.4 to ×1.7 band: ${(r.throat.q.lo / 1e6).toFixed(0)} to ${(r.throat.q.hi / 1e6).toFixed(0)} MW/m² at a ${inp.wallTempK} K wall. No limit is checked because cooling method and burn time are not inputs.`,
  })

  return out
}

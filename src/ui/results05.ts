import { FRACTIONAL_DRILLS, METRIC_DRILLS, NUMBER_DRILLS, nearest } from '../physics'
import { liquidAt } from '../physics/liquids'
import { holeFlow } from '../physics/orifice'
import { drivers, findings05 } from '../physics/v05/findings'
import type { Inputs05, Result05, Side05 } from '../physics/v05/types'
import { esc, fix, pct, sci } from './format'

function row(label: string, ...cells: string[]): string {
  return `<tr><th scope="row">${label}</th>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`
}

const propHead = `<thead><tr><th></th><th scope="col"><i class="swatch lox"></i>LOX</th><th scope="col"><i class="swatch fuel"></i>Ethanol</th></tr></thead>`

function drill(s: Side05, inp: Inputs05): string {
  const cands = [nearest(NUMBER_DRILLS, s.d), nearest(METRIC_DRILLS, s.d), nearest(FRACTIONAL_DRILLS, s.d)]
  const best = cands.reduce((a, b) => (Math.abs(b.d - s.d) < Math.abs(a.d - s.d) ? b : a))
  const liq = liquidAt(s.prop === 'ox' ? 'lox' : 'ethanol', inp[s.prop].tempK)
  const f = holeFlow(best.d, s.L, s.dp, liq.rho, liq.mu, inp.roughnessUm * 1e-6).mdot / holeFlow(s.d, s.L, s.dp, liq.rho, liq.mu, inp.roughnessUm * 1e-6).mdot
  return `${best.name}, flow ${f >= 1 ? '+' : ''}${fix(100 * (f - 1), 1)}%`
}

export function results05Html(r: Result05, inp: Inputs05): { summary: string; details: string } {
  const found = findings05(r, inp)
  const stops = found.filter((f) => f.severity === 'stop')
  const checks = found.filter((f) => f.severity === 'check')
  const list = (items: typeof found, cls: string) =>
    `<ul class="findings ${cls}">${items.map((f) => `<li><p class="f-title">${esc(f.title)}</p><p class="f-detail">${esc(f.detail)}</p></li>`).join('')}</ul>`
  const pc = r.pcBar * 1e5
  const g = r.geom

  let outcome: string
  if (r.mode === 'design') {
    outcome = r.targetMet
      ? `Shortest chamber whose low edge reaches ${pct(inp.etaTarget)}: L* ${fix(g.lStar, 2)} m, cylinder ${fix(g.Lcyl * 1000, 0)} mm.`
      : `The low edge stays below ${pct(inp.etaTarget)} up to L* ${fix(g.lStar, 2)} m. Results below are at that length.`
  } else {
    outcome = `This hardware runs near ${fix(r.pcBar, 1)} bar and O/F ${fix(r.of, 2)} at ${pct(inp.etaDesign)} c* efficiency.`
  }

  const summary = `
  <section class="block" aria-labelledby="h-out">
    <h3 id="h-out">Result</h3>
    <p class="outcome">${outcome}</p>
    <p class="range-note">c* efficiency at ${fix(g.Lcyl * 1000, 0)} mm from the face. The band is the spread of the uncertainty sweep, not a confidence interval.</p>
  </section>
  <section class="block" aria-labelledby="h-isp">
    <h3 id="h-isp">Delivered Isp</h3>
    <p class="isp"><span class="isp-range">${fix(r.isp.lo, 0)} to ${fix(r.isp.hi, 0)} s</span>
    <span class="isp-note">${fix(r.comb.IspSL / 9.80665, 1)} s ideal at sea level; nozzle and kinetic losses ${pct(1 - r.etaCf, 1)}</span></p>
  </section>
  ${stops.length ? `<section class="block" aria-labelledby="h-stop"><h3 id="h-stop" class="h-stop">Not supported by the model</h3>${list(stops, 'stop')}</section>` : ''}
  ${checks.length ? `<section class="block" aria-labelledby="h-check"><h3 id="h-check">Check before relying on it</h3>${list(checks, 'check')}</section>` : ''}`

  const sides = [r.ox, r.fuel] as const
  const both = (f: (s: Side05) => string) => sides.map(f)
  const d = drivers(r, inp)
  const centerFree = Math.max(0, 2 * Math.min(r.ox.ringRadius - r.ox.d / 2, r.fuel.ringRadius - r.fuel.d / 2))
  const failed = r.checks.filter((c) => !c.ok)

  const details = `
  ${!r.feasible ? `<section class="block"><h3 class="h-stop">Fails ${failed.length} limit${failed.length > 1 ? 's' : ''}</h3><ul class="findings stop">${failed.map((c) => `<li><p class="f-title">${esc(c.label)}: ${fix(c.value, 2)} ${esc(c.unit)} against ${fix(c.limit, 2)}</p></li>`).join('')}</ul></section>` : ''}
  <section class="block" aria-labelledby="h-engine">
    <h3 id="h-engine">Engine</h3>
    <table class="data">
      ${row('Chamber pressure', `${fix(r.pcBar, 2)} bar (face ${fix(r.pFaceBar, 2)} bar)`)}
      ${row('Mixture ratio O/F', fix(r.of, 3))}
      ${row('Mass flow', `${fix(r.mdot, 4)} kg/s`)}
      ${row('Throat diameter', `${fix(g.Dt * 1000, 2)} mm`)}
      ${row('Chamber diameter', `${fix(g.Dc * 1000, 2)} mm`)}
      ${row('Cylinder length', `${fix(g.Lcyl * 1000, 1)} mm`)}
      ${row('Convergent length', `${fix(g.Lconv * 1000, 1)} mm at ${fix(inp.convergentDeg, 0)}°`)}
      ${row('L* (face to throat)', `${fix(g.lStar, 2)} m`)}
      ${row('Sized for c* efficiency', pct(inp.etaDesign))}
      ${row('Cf efficiency', `${pct(r.etaCf, 1)} (${fix(inp.nozzleExitDeg, 0)}° cone, kinetic and boundary layer ${pct(inp.etaKinBL)})`)}
      ${row('c* ideal', `${fix(r.comb.cstar, 0)} m/s`)}
      ${row('Chamber temperature', `${fix(r.comb.Tc, 0)} K`)}
      ${row('Gas speed at full vaporization', `${fix(r.uFin, 1)} m/s`)}
      ${row('Gas residence time', `${fix(r.thetaG * 1000, 2)} ms`)}
    </table>
  </section>

  <section class="block" aria-labelledby="h-op">
    <h3 id="h-op">${r.mode === 'design' ? 'The built engine across the band' : 'This hardware across the band'}</h3>
    <table class="data op">
      <thead><tr><th scope="col">c* eff.</th><th scope="col">Pc</th><th scope="col">Thrust</th><th scope="col">O/F</th><th scope="col">Isp</th></tr></thead>
      <tbody>${r.operating.map((o) => `<tr><td>${pct(o.eta)}</td><td>${fix(o.pcBar, 1)} bar</td><td>${fix(o.thrustN, 0)} N</td><td>${fix(o.of, 2)}</td><td>${fix(o.ispS, 0)} s</td></tr>`).join('')}</tbody>
    </table>
    <p class="note">${r.mode === 'design' ? 'Same holes and throat, feed set to the pressures this design needs; constant Cf.' : 'Same holes, throat and inlet pressures; constant Cf.'}</p>
  </section>

  <section class="block" aria-labelledby="h-inj">
    <h3 id="h-inj">Injector</h3>
    <table class="data two">
      ${propHead}
      <tbody>
      ${row('Holes', ...both((s) => `${s.holes} × ${fix(s.d * 1000, 3)} mm`))}
      ${row('Nearest drill', ...both((s) => drill(s, inp)))}
      ${row('Mass flow', ...both((s) => `${fix(s.mdot, 4)} kg/s`))}
      ${row('Jet velocity', ...both((s) => `${fix(s.U, 2)} m/s`))}
      ${row('Discharge coefficient', ...both((s) => fix(s.cd, 3)))}
      ${row('Pressure drop', ...both((s) => `${fix(s.dp / 1e5, 2)} bar (${pct(s.dp / pc)})`))}
      ${row('Inlet pressure needed', ...both((s) => `${fix(s.inletRequired / 1e5, 2)} bar`))}
      ${row('Feed bore', ...both((s) => `${fix(s.boreD * 1000, 2)} mm`))}
      ${row('Ring radius', ...both((s) => `${fix(s.ringRadius * 1000, 2)} mm`))}
      ${row('Hole pitch', ...both((s) => `${fix(s.pitch * 1000, 2)} mm`))}
      </tbody>
    </table>
  </section>

  <section class="block" aria-labelledby="h-jet">
    <h3 id="h-jet">Jets and drops</h3>
    <table class="data two">
      ${propHead}
      <tbody>
      ${row('Breakup regime', ...both((s) => s.jet.regime.replace('-', ' ')))}
      ${row('Gas Weber number', ...both((s) => fix(s.jet.weG, 0)))}
      ${row('Intact core length', ...both((s) => (s.jet.coreLength === null ? 'no correlation' : `${fix(s.jet.coreLength * 1000, 0)} mm`)))}
      ${row('Mass-median drop radius', ...both((s) => `${fix(s.drops.rm * 1e6, 0)} µm`))}
      ${row('Drop radii in the sweep', ...both((s) => `${fix(s.drops.rm * inp.dropLo * 1e6, 0)} to ${fix(s.drops.rm * inp.dropHi * 1e6, 0)} µm`))}
      ${row('Half vaporized after', ...both((s) => (Number.isFinite(s.t50) ? `${fix(s.t50 * 1000, 2)} ms` : 'not reached')))}
      ${row('Vaporized at the chamber end', pct(r.curve.vapOx[r.at]!, 1), pct(r.curve.vapFuel[r.at]!, 1))}
      ${row('Largest drop Weber number', ...both((s) => fix(s.maxWe, 0)))}
      ${row('Largest transfer number B_T', ...both((s) => fix(s.bTMax, 0)))}
      ${row('Drop Reynolds number', ...both((s) => `${fix(s.reRange[0], 0)} to ${sci(s.reRange[1], 1)}`))}
      </tbody>
    </table>
    <p class="note">Median-size drops. Drop sizes: Priem-Heidmann parallel-jet line, by-eye fit pending digitizing.</p>
  </section>

  <section class="block" aria-labelledby="h-mix">
    <h3 id="h-mix">Mixing at the chamber end</h3>
    <table class="data">
      ${row('c* efficiency band', `${pct(r.eta.lo, 1)} to ${pct(r.eta.hi, 1)}`)}
      ${row('Central case', `${pct(r.eta.mid, 1)} (intensity ${pct(inp.mixI[1]!)}, length = chamber radius, median drops)`)}
      ${row('Rupe mixing efficiency E_m', Number.isFinite(r.curve.Em[r.at]!) ? pct(r.curve.Em[r.at]!, 1) : 'one propellant only')}
      ${r.wall.vaporOF.map((w) => row(`Wall-zone O/F at ${fix(w.x * 1000, 0)} mm`, Number.isNaN(w.of) ? 'no vapor' : Number.isFinite(w.of) ? fix(w.of, 2) : 'all LOX')).join('')}
    </table>
    <table class="data">
      <thead><tr><th scope="col">Uncertain input</th><th scope="col">Moves efficiency by</th></tr></thead>
      <tbody>${d.map((x) => `<tr><td style="text-align:left">${x.name}</td><td>${pct(x.spread, 1)}</td></tr>`).join('')}</tbody>
    </table>
  </section>

  <section class="block" aria-labelledby="h-stab">
    <h3 id="h-stab">Chugging screen</h3>
    <table class="data two">
      ${propHead}
      <tbody>
      ${row('Feed gain k = Pc / 2ΔP', fix(r.chug.ox.k, 2), fix(r.chug.fuel.k, 2))}
      ${row('Critical delay', ...[r.chug.ox, r.chug.fuel].map((c) => (Number.isFinite(c.tauCrit) ? `${fix(c.tauCrit * 1000, 2)} ms` : 'none')))}
      </tbody>
    </table>
    <p class="note">Combustion delay taken as the time for half the slower propellant to vaporize: ${Number.isFinite(r.chug.tau) ? `${fix(r.chug.tau * 1000, 2)} ms` : 'not reached'}. Single dead time, no feed dynamics.</p>
  </section>

  <section class="block" aria-labelledby="h-heat">
    <h3 id="h-heat">Throat heat flux</h3>
    <table class="data">
      ${row('Gas-side coefficient (Bartz)', `${fix(r.throat.h, 0)} W/(m²·K)`)}
      ${row('Heat flux band', `${fix(r.throat.q.lo / 1e6, 0)} to ${fix(r.throat.q.hi / 1e6, 0)} MW/m²`)}
      ${row('Adiabatic wall temperature', `${fix(r.throat.Taw, 0)} K`)}
    </table>
  </section>

  <section class="block" aria-labelledby="h-lim">
    <h3 id="h-lim">Limits</h3>
    <ul class="limits">${r.checks
      .map(
        (c) =>
          `<li class="${c.ok ? 'ok' : 'fail'}"><span class="mark" aria-hidden="true">${c.ok ? '✓' : '✕'}</span><span>${esc(c.label)}</span><span class="lim-val">${fix(c.value, 2)} / ${fix(c.limit, 2)} ${esc(c.unit)}</span><span class="sr">${c.ok ? 'within the limit' : 'outside the limit'}</span></li>`,
      )
      .join('')}</ul>
  </section>

  <section class="block" aria-labelledby="h-ign">
    <h3 id="h-ign">Ignition</h3>
    <p class="note">Not modeled. A start needs:</p>
    <ul class="plain">
      <li>a flame running and confirmed before propellants arrive</li>
      <li>the flame reaching both rings near the face; ethanol gives little vapor at chamber start</li>
      <li>no liquid jet hitting the torch exit or spark gap</li>
      <li>little unburned propellant collected before ignition</li>
      <li>a purge keeping hot gas out of the igniter port</li>
    </ul>
    <p class="note">Free diameter at the face centre for a torch port: ${fix(centerFree * 1000, 1)} mm, before clearance.</p>
  </section>

  <details class="block table-view">
    <summary>All ${r.sweep.length} sweep cases</summary>
    <table class="data">
      <thead><tr><th scope="col">Drop size</th><th scope="col">Intensity</th><th scope="col">Length</th><th scope="col">c* eff.</th></tr></thead>
      <tbody>${r.sweep.map((s) => `<tr><td>×${fix(s.drop, 2)}</td><td>${pct(s.i)}</td><td>${fix(s.Lambda * 1000, 1)} mm</td><td>${pct(s.etaAt, 1)}</td></tr>`).join('')}</tbody>
    </table>
  </details>`
  return { summary, details }
}

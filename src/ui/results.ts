import {
  FRACTIONAL_DRILLS,
  METRIC_DRILLS,
  NUMBER_DRILLS,
  findings,
  nearest,
  type PointResult,
  type PropSide,
  type Scenario,
  type SearchResult,
  type WallMode,
} from '../physics'
import { holeFlow } from '../physics/orifice'
import { igniter } from './section'
import { esc, fix, G0, pct, sci } from './format'

const NAME = { ox: 'LOX', fuel: 'Ethanol' } as const
const SCEN = { pessimistic: 'Pessimistic', nominal: 'Nominal', optimistic: 'Optimistic' } as const

function row(label: string, ...cells: string[]): string {
  return `<tr><th scope="row">${label}</th>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`
}

function head(...cols: string[]): string {
  return `<thead><tr><th></th>${cols.map((c) => `<th scope="col">${c}</th>`).join('')}</tr></thead>`
}

function propHead(): string {
  return head('<i class="swatch lox"></i>LOX', '<i class="swatch fuel"></i>Ethanol')
}

interface Snap {
  drill: string
  d: number
  flowRatio: number
}

function snap(side: PropSide, roughness: number): Snap {
  const cands = [nearest(NUMBER_DRILLS, side.hole.d), nearest(METRIC_DRILLS, side.hole.d), nearest(FRACTIONAL_DRILLS, side.hole.d)]
  const best = cands.reduce((a, b) => (Math.abs(b.d - side.hole.d) < Math.abs(a.d - side.hole.d) ? b : a))
  const f = holeFlow(best.d, side.hole.L, side.dp, side.liquid.rho, side.liquid.mu, roughness)
  return { drill: best.name, d: best.d, flowRatio: f.mdot / side.hole.mdot }
}

export function resultsHtml(
  r: PointResult,
  search: SearchResult | null,
  scenario: Scenario,
  wall: WallMode,
  roughnessUm: number,
): { summary: string; details: string } {
  const e = r.engine
  const s = r.scenarios[scenario]!
  const found = findings(r, search ?? undefined)
  const stops = found.filter((f) => f.severity === 'stop')
  const checks = found.filter((f) => f.severity === 'check')
  const sOx = snap(r.ox, roughnessUm * 1e-6)
  const sFuel = snap(r.fuel, roughnessUm * 1e-6)
  const ofSnapped = (e.comb.of * sOx.flowRatio) / sFuel.flowRatio
  const ign = igniter(r, scenario, wall)
  const pess = r.scenarios.pessimistic!
  const opt = r.scenarios.optimistic!

  const list = (items: typeof found, cls: string) =>
    items.length
      ? `<ul class="findings ${cls}">${items
          .map((f) => `<li><p class="f-title">${esc(f.title)}</p><p class="f-detail">${esc(f.detail)}</p></li>`)
          .join('')}</ul>`
      : ''

  const ox = r.ox
  const fu = r.fuel
  const failed = r.constraints.filter((c) => !c.ok)

  const summary = `
  <section class="block" aria-labelledby="h-isp">
    <h3 id="h-isp">Delivered Isp</h3>
    <p class="isp"><span class="isp-range">${fix(pess.ispDelivered / G0, 0)} to ${fix(opt.ispDelivered / G0, 0)} s</span>
    <span class="isp-note">${fix(r.scenarios.nominal!.ispDelivered / G0, 0)} s nominal, ${fix(e.comb.IspSL / G0, 1)} s ideal at sea level</span></p>
  </section>

  ${stops.length ? `<section class="block" aria-labelledby="h-stop"><h3 id="h-stop" class="h-stop">Not supported by the model</h3>${list(stops, 'stop')}</section>` : ''}
  ${!r.feasible ? `<section class="block"><h3 class="h-stop">Fails ${failed.length} limit${failed.length > 1 ? 's' : ''}</h3><ul class="findings stop">${failed.map((c) => `<li><p class="f-title">${esc(c.label)}: ${fix(c.value, 2)} ${esc(c.unit)} against ${fix(c.limit, 2)}</p></li>`).join('')}</ul></section>` : ''}
  ${checks.length ? `<section class="block" aria-labelledby="h-check"><h3 id="h-check">Rests on a rule of thumb</h3>${list(checks, 'check')}</section>` : ''}`

  const details = `

  <section class="block" aria-labelledby="h-engine">
    <h3 id="h-engine">Engine</h3>
    <table class="data">
      ${row('Chamber pressure', `${fix(e.comb.pcBar, 1)} bar`)}
      ${row('Mixture ratio O/F', fix(e.comb.of, 2))}
      ${row('Mass flow', `${fix(e.mdot, 4)} kg/s`)}
      ${row('Throat diameter', `${fix(e.Dt * 1000, 2)} mm`)}
      ${row('Chamber diameter', `${fix(e.Dc * 1000, 2)} mm`)}
      ${row('Chamber length', `${fix(e.Lc * 1000, 1)} mm (L* ${fix(r.point.lStarM, 2)} m)`)}
      ${row('c* ideal', `${fix(e.comb.cstar, 0)} m/s`)}
      ${row('Chamber temperature', `${fix(e.comb.Tc, 0)} K`)}
      ${row('Gas speed at chamber end', `${fix(e.uGas, 1)} m/s`)}
      ${row('Gas residence time', `${fix(e.tRes * 1000, 2)} ms`)}
      ${row('Nozzle exit area ratio', `${fix(e.comb.eps, 2)} (sea level)`)}
    </table>
  </section>

  <section class="block" aria-labelledby="h-inj">
    <h3 id="h-inj">Injector</h3>
    <table class="data two">
      ${propHead()}
      <tbody>
      ${row('Holes', `${ox.holes} × ${fix(ox.hole.d * 1000, 3)} mm`, `${fu.holes} × ${fix(fu.hole.d * 1000, 3)} mm`)}
      ${row('Nearest drill', `${sOx.drill}, flow ${sOx.flowRatio >= 1 ? '+' : ''}${fix(100 * (sOx.flowRatio - 1), 1)}%`, `${sFuel.drill}, flow ${sFuel.flowRatio >= 1 ? '+' : ''}${fix(100 * (sFuel.flowRatio - 1), 1)}%`)}
      ${row('Mass flow', `${fix(ox.mdot, 4)} kg/s`, `${fix(fu.mdot, 4)} kg/s`)}
      ${row('Jet velocity', `${fix(ox.hole.v, 2)} m/s`, `${fix(fu.hole.v, 2)} m/s`)}
      ${row('Discharge coefficient', fix(ox.hole.cd, 3), fix(fu.hole.cd, 3))}
      ${row('Reynolds number', sci(ox.hole.re), sci(fu.hole.re))}
      ${row('Hole length', `${fix(ox.hole.L * 1000, 1)} mm (L/d ${fix(ox.hole.L / ox.hole.d, 1)})`, `${fix(fu.hole.L * 1000, 1)} mm (L/d ${fix(fu.hole.L / fu.hole.d, 1)})`)}
      ${row('Pressure drop', `${fix(ox.dp / 1e5, 2)} bar`, `${fix(fu.dp / 1e5, 2)} bar`)}
      ${row('Inlet pressure needed', `${fix(ox.inletRequired / 1e5, 2)} bar`, `${fix(fu.inletRequired / 1e5, 2)} bar`)}
      ${row('Feed bore', `${fix(ox.boreD * 1000, 2)} mm`, `${fix(fu.boreD * 1000, 2)} mm`)}
      ${row('Ring radius', `${fix(ox.ringRadius * 1000, 2)} mm`, `${fix(fu.ringRadius * 1000, 2)} mm`)}
      ${row('Hole pitch', `${fix(ox.pitch * 1000, 2)} mm`, `${fix(fu.pitch * 1000, 2)} mm`)}
      ${row('Liquid density', `${fix(ox.liquid.rho, 1)} kg/m³`, `${fix(fu.liquid.rho, 1)} kg/m³`)}
      </tbody>
    </table>
    <p class="note">With both drills, O/F becomes ${fix(ofSnapped, 3)}. Injector mass estimate ${fix(r.injectorMassKg, 2)} kg (solid body, port assumption).</p>
  </section>

  <section class="block" aria-labelledby="h-spray">
    <h3 id="h-spray">Sprays, ${SCEN[scenario].toLowerCase()} case</h3>
    <table class="data two">
      ${propHead()}
      <tbody>
      ${row('Gas speed that breaks up drops', `${fix(s.ox.vRel, 1)} m/s`, `${fix(s.fuel.vRel, 1)} m/s`)}
      ${row('Drop size (SMD)', `${fix(s.ox.drop.smd * 1e6, 0)} µm`, `${fix(s.fuel.drop.smd * 1e6, 0)} µm`)}
      ${row('Size set by', s.ox.drop.capActive ? 'breakup limit' : s.ox.drop.regime, s.fuel.drop.capActive ? 'breakup limit' : s.fuel.drop.regime)}
      ${row('Drop lifetime', `${fix(s.ox.tau * 1000, 2)} ms`, `${fix(s.fuel.tau * 1000, 2)} ms`)}
      ${row('Vaporized at chamber end', pct(s.ox.vaporized, 1), pct(s.fuel.vaporized, 1))}
      ${row('Spray half-angle', `${fix(s.ox.drop.halfAngleDeg, 2)}°`, `${fix(s.fuel.drop.halfAngleDeg, 2)}°`)}
      ${row('Weber number', sci(s.ox.drop.we), sci(s.fuel.drop.we))}
      ${row('Laplace number', sci(s.ox.drop.lp), sci(s.fuel.drop.lp))}
      </tbody>
    </table>
    <table class="data">
      ${row('Vaporization efficiency', pct(s.etaVap, 1))}
      ${row('Mixing efficiency (stream tube)', `${pct(s.mixing.etaMix, 1)}${s.mixing.etaMixRaw > s.mixing.etaMix + 1e-9 ? ` (raw ${pct(s.mixing.etaMixRaw, 2)})` : ''}`)}
      ${row('Mixing index', fix(s.mixing.mixingIndex, 3))}
      ${row('Propellant inside the wall', `LOX ${pct(s.mixing.capturedOx)}, ethanol ${pct(s.mixing.capturedFuel)}`)}
      ${row('O/F of what is inside', fix(s.mixing.ofInside, 2))}
      ${row('c* efficiency', `<strong>${pct(s.eta, 1)}</strong>`)}
    </table>
  </section>

  <section class="block" aria-labelledby="h-lim">
    <h3 id="h-lim">Limits</h3>
    <ul class="limits">${r.constraints
      .map(
        (c) =>
          `<li class="${c.ok ? 'ok' : 'fail'}"><span class="mark" aria-hidden="true">${c.ok ? '✓' : '✕'}</span><span>${esc(c.label)}</span><span class="lim-val">${fix(c.value, 2)} / ${fix(c.limit, 2)} ${esc(c.unit)}</span><span class="sr">${c.ok ? 'passes' : 'fails'}</span></li>`,
      )
      .join('')}</ul>
  </section>

  <section class="block" aria-labelledby="h-ign">
    <h3 id="h-ign">Igniter spot (v0.4 heuristic)</h3>
    <p class="note">Steady-state flow, scored by closeness to stoichiometric O/F times flux. Startup ignition is not modeled.</p>
    <table class="data">
      ${ign.interior ? row('Best interior', `${fix(ign.interior.x * 1000, 0)} mm from the face, r ${fix(ign.interior.r * 1000, 1)} mm, O/F ${fix(ign.interior.of, 2)}`) : ''}
      ${ign.wall ? row('Best near the wall', `${fix(ign.wall.x * 1000, 0)} mm from the face, r ${fix(ign.wall.r * 1000, 1)} mm, O/F ${fix(ign.wall.of, 2)}`) : ''}
    </table>
  </section>`
  return { summary, details }
}

export { NAME, SCEN }

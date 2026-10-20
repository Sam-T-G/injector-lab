import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow-semi-condensed/500.css'
import '@fontsource/barlow-semi-condensed/600.css'
import '@fontsource/barlow-semi-condensed/700.css'
import './styles.css'

import { MODEL, spraySigma, type DesignPoint, type PointResult, type Scenario, type SearchResult } from './physics'
import type { Result05 } from './physics/v05/types'
import { liquidSigma } from './physics/v05/vapormix'
import { InjectorView, sprayStations, type DrawingSpec, type ViewPreset } from './render/scene'
import { clone, decodeState, DEFAULT_STATE, encodeState, hashInputs, type AppState } from './state'
import { EfficiencyBand } from './ui/band'
import { LengthChart } from './ui/chart'
import { buildForm } from './ui/form'
import { FeasibilityMap, SectionMap } from './ui/maps'
import { resultsHtml } from './ui/results'
import { results05Html } from './ui/results05'
import { fieldPixels, sectionAt } from './ui/section'
import type { WorkerRequest } from './worker'

declare const __COMMIT__: string

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

let state: AppState = decodeState(location.hash) ?? clone(DEFAULT_STATE)
// Browsers restore radio state on reload, so read the case from the page.
let scenario: Scenario = (document.querySelector<HTMLInputElement>('#scenario input:checked')?.value as Scenario) ?? 'nominal'
let current: PointResult | null = null
let currentSearch: SearchResult | null = null
let current05: Result05 | null = null
let runAt: Date | null = null

const statusEl = $('status')
const band = new EfficiencyBand()
$('band').append(band.el)
const view = new InjectorView($('view'))
const section = new SectionMap($('section-map'), $('section-legend'))
const feas = new FeasibilityMap($('feas-map'), $('feas-controls'), $('feas-legend'), $('feas-table'), (p) => openPoint(p))
const lengthChart = new LengthChart($('length-chart'), $('length-legend'))
const station = $<HTMLInputElement>('station')
const stationOut = $<HTMLOutputElement>('station-out')

$('tb-build').textContent = __COMMIT__

const form = buildForm($('form'), state, (s) => {
  state = s
  schedule()
})

// A newer request replaces the worker, so a long run never blocks a fresh one.
let worker: Worker | null = null
let reqId = 0
let timer = 0

type Reply =
  | { id: number; kind: 'progress'; done: number; total: number }
  | { id: number; kind: 'search'; result: SearchResult }
  | { id: number; kind: 'point'; result: PointResult }
  | { id: number; kind: 'v05'; result: Result05 }
  | { id: number; kind: 'error'; message: string }

function startWorker(): Worker {
  const w = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  w.onmessage = (e: MessageEvent<Reply>) => {
    const m = e.data
    if (m.id !== reqId) return
    if (m.kind === 'progress') return setStatus(`Searching ${m.done} of ${m.total} design points`)
    if (m.kind === 'error') return setStatus(`The model stopped: ${m.message}`, true)
    runAt = new Date()
    if (m.kind === 'v05') {
      current05 = m.result
      setStatus('')
      return render05()
    }
    if (m.kind === 'search') {
      currentSearch = m.result
      if (!m.result.chosen) {
        current = null
        const counts = new Map<string, number>()
        for (const c of m.result.cells) for (const f of c.failed) counts.set(f, (counts.get(f) ?? 0) + 1)
        const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
        return setStatus(`No design in the search range passes every limit.${top ? ` Most common failure: ${top[0]}.` : ''}`, true)
      }
      current = m.result.chosen
    } else {
      currentSearch = null
      current = m.result
    }
    setStatus('')
    render04()
  }
  w.onerror = (e) => setStatus(`The model stopped: ${e.message}`, true)
  return w
}

function setStatus(text: string, error = false): void {
  statusEl.textContent = text
  statusEl.classList.toggle('error', error)
}

function schedule(): void {
  clearTimeout(timer)
  timer = window.setTimeout(run, 300)
  history.replaceState(null, '', encodeState(state))
  $('tb-inputs').textContent = hashInputs(state)
}

function run(): void {
  if (!form.valid()) return
  worker?.terminate()
  worker = startWorker()
  const id = ++reqId
  const inputs = clone(state.inputs)
  let req: WorkerRequest
  if (inputs.model === 'v0.5') {
    req = { id, kind: 'v05', inputs }
    setStatus(inputs.mode05 === 'analyze' ? 'Checking the hardware' : 'Sizing and sweeping the uncertain inputs')
  } else {
    req = state.mode === 'search' ? { id, kind: 'search', inputs } : { id, kind: 'point', inputs, point: clone(state.point) }
    setStatus(state.mode === 'search' ? 'Searching' : 'Evaluating')
  }
  worker.postMessage(req)
}

function openPoint(p: DesignPoint): void {
  state.mode = 'point'
  state.point = clone(p)
  form.refresh(state)
  schedule()
}

function setModelChrome(model: 'v0.5' | 'v0.4'): void {
  $('scenario').hidden = model !== 'v0.4'
  $('length-fig').hidden = model !== 'v0.5'
  $('feas-fig').hidden = model !== 'v0.4' || !currentSearch
  $('tb-model').textContent = model === 'v0.5' ? 'v0.5 (from the reviews)' : MODEL
  $('section-caption').textContent =
    model === 'v0.5' ? 'Vapor mixture ratio at the section plane, central case, seen from the nozzle end' : 'Mixture ratio at the section plane, seen from the nozzle end'
  $('view-legend').innerHTML =
    model === 'v0.5'
      ? '<li><i class="swatch lox"></i>LOX</li><li><i class="swatch fuel"></i>Ethanol</li><li>Solid columns: intact liquid cores. Clouds: vapor spread (2σ), central case. Conical nozzle sketch. Dimensions in mm.</li>'
      : '<li><i class="swatch lox"></i>LOX spray edge (2σ)</li><li><i class="swatch fuel"></i>Ethanol spray edge (2σ)</li><li>Conical nozzle sketch, 30° in and 15° out. Dimensions in mm.</li>'
}

// ---------- v0.4 ----------

function spec04(r: PointResult): DrawingSpec {
  return {
    Dc: r.engine.Dc,
    Dt: r.engine.Dt,
    eps: r.engine.comb.eps,
    Lc: r.engine.Lc,
    convergentDeg: 30,
    bodyThicknessMm: state.inputs.injectorThicknessMm,
    bodyMarginMm: state.inputs.bodyMarginMm,
    rings: [r.ox, r.fuel].map((s) => ({ prop: s.prop, ringRadius: s.ringRadius, clockDeg: s.clockDeg, holes: s.holes, d: s.hole.d })),
  }
}

function sprays04(r: PointResult, s: Scenario) {
  const xs = sprayStations(r.engine.Lc)
  const sc = r.scenarios[s]!
  const radii = (side: 'ox' | 'fuel') => Float64Array.from(xs, (x) => 2 * spraySigma(x, r[side].hole.d, sc[side].drop.tanHalfAngle, sc[side].xv))
  return { ox: radii('ox'), fuel: radii('fuel') }
}

function render04(): void {
  const r = current
  if (!r) return
  setModelChrome('v0.4')
  const s = r.scenarios
  band.set({ pess: s.pessimistic!.eta, nom: s.nominal!.eta, opt: s.optimistic!.eta })
  showResults04(r)
  $('tb-run').textContent = runAt ? runAt.toLocaleString() : ''
  view.setGeometry(spec04(r))
  view.setSprays(sprays04(r, scenario), false)
  const LcMm = r.engine.Lc * 1000
  station.step = '1'
  station.max = String(Math.round(LcMm))
  if (Number(station.value) > LcMm || !station.dataset.touched) station.value = String(Math.round(LcMm))
  updateSection()
  if (currentSearch) feas.set(currentSearch)
}

function showResults04(r: PointResult): void {
  const html = resultsHtml(r, currentSearch, scenario, state.inputs.wallMode, state.inputs.roughnessUm)
  $('results').innerHTML = html.summary
  $('details').innerHTML = html.details
}

// ---------- v0.5 ----------

function spec05(r: Result05): DrawingSpec {
  return {
    Dc: r.geom.Dc,
    Dt: r.geom.Dt,
    eps: r.comb.eps,
    Lc: r.geom.Lcyl,
    convergentDeg: state.inputs.convergentDeg,
    bodyThicknessMm: state.inputs.injectorThicknessMm,
    bodyMarginMm: state.inputs.bodyMarginMm,
    rings: [r.ox, r.fuel].map((s) => ({ prop: s.prop, ringRadius: s.ringRadius, clockDeg: state.inputs[s.prop].clockDeg, holes: s.holes, d: s.d })),
    cores: { ox: r.ox.jet.coreLength, fuel: r.fuel.jet.coreLength },
  }
}

/** 2-sigma envelope of the central case: liquid width plus Taylor dispersion, in quadrature. */
function sprays05(r: Result05) {
  const i = state.inputs.mixI[1]!
  const L = r.geom.Dc / 2
  const xs = sprayStations(r.geom.Lcyl)
  const radii = (s: Result05['ox']) =>
    Float64Array.from(xs, (x) => {
      const st2 = 2 * i * i * L * L * (x / L - 1 + Math.exp(-x / L))
      const sl = liquidSigma({ prop: s.prop, x: 0, y: 0, mdot: 0, d: s.d, coreLength: s.jet.coreLength, halfAngle: s.jet.halfAngle }, x)
      return 2 * Math.sqrt(sl * sl + st2)
    })
  return { ox: radii(r.ox), fuel: radii(r.fuel) }
}

function render05(): void {
  const r = current05
  if (!r) return
  setModelChrome('v0.5')
  band.set({ pess: r.eta.lo, nom: r.eta.mid, opt: r.eta.hi }, r.eta.hi - r.eta.lo > 0.05)
  const html = results05Html(r, state.inputs)
  $('results').innerHTML = html.summary
  $('details').innerHTML = html.details
  $('tb-run').textContent = runAt ? runAt.toLocaleString() : ''
  view.setGeometry(spec05(r))
  view.setSprays(sprays05(r), false)
  lengthChart.set(r, state.inputs.etaTarget)
  const last = r.fields[r.fields.length - 1]
  const LcMm = (last?.x ?? r.geom.Lcyl) * 1000
  station.max = String(Math.round(LcMm))
  station.step = 'any'
  if (Number(station.value) > LcMm || !station.dataset.touched) station.value = String(Math.round(LcMm))
  updateSection()
}

function updateSection(): void {
  const x = Number(station.value)
  if (state.inputs.model === 'v0.5') {
    const r = current05
    if (!r || !r.fields.length) return
    let f = r.fields[0]!
    for (const g of r.fields) if (Math.abs(g.x * 1000 - x) < Math.abs(f.x * 1000 - x)) f = g
    const xmm = f.x * 1000
    stationOut.textContent = `${xmm.toFixed(0)} mm from the face`
    section.set(f, r.holes, r.of)
    view.setSection(xmm, fieldPixels(f, r.of), f.n)
    return
  }
  const r = current
  if (!r) return
  stationOut.textContent = `${x} mm from the face`
  const f = sectionAt(r, scenario, x / 1000, 121, state.inputs.wallMode)
  const holes = [r.ox, r.fuel].flatMap((s) =>
    Array.from({ length: s.holes }, (_, k) => {
      const a = ((s.clockDeg + (360 * k) / s.holes) * Math.PI) / 180
      return { prop: s.prop, x: s.ringRadius * Math.cos(a), y: s.ringRadius * Math.sin(a) }
    }),
  )
  section.set(f, holes, r.engine.comb.of)
  view.setSection(x, fieldPixels(f, r.engine.comb.of), f.n)
}

station.addEventListener('input', () => {
  station.dataset.touched = '1'
  updateSection()
})

for (const input of document.querySelectorAll<HTMLInputElement>('#scenario input')) {
  input.addEventListener('change', () => {
    scenario = input.value as Scenario
    if (!current || state.inputs.model !== 'v0.4') return
    view.setSprays(sprays04(current, scenario))
    showResults04(current)
    updateSection()
  })
}

for (const b of document.querySelectorAll<HTMLButtonElement>('[data-view]')) {
  b.addEventListener('click', () => view.view(b.dataset.view as ViewPreset))
}

$('copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(location.href)
    setStatus('Link copied')
  } catch {
    setStatus('Copy the address bar to share these inputs')
  }
})

$('download').addEventListener('click', () => {
  const v05 = state.inputs.model === 'v0.5'
  if (v05 ? !current05 : !current) return
  const doc = {
    model: v05 ? 'v0.5' : MODEL,
    build: __COMMIT__,
    inputsHash: hashInputs(state),
    run: runAt?.toISOString() ?? null,
    status: 'Not validated against hot-fire data',
    permissibleUse: 'Preliminary sizing and planning of cold-flow test articles. Not for hot-fire hardware without independent analysis.',
    notChecked: ['structure and pressure rating', 'thermal', 'ignition', 'combustion stability beyond the chug screen', 'oxygen compatibility and cleanliness', 'feed system'],
    data: { combustion: 'NASA CEA 3.3.4, equilibrium', liquids: 'CoolProp 8.0.0, saturated' },
    state,
    result: v05 ? { ...current05!, fields: `${current05!.fields.length} section fields omitted` } : current,
    search: !v05 && currentSearch ? { axes: currentSearch.axes, onEdge: currentSearch.onEdge, bestIsp: currentSearch.bestIsp, cells: currentSearch.cells } : null,
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' }))
  a.download = `injector-${hashInputs(state)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
})

$('reset').addEventListener('click', () => {
  state = clone(DEFAULT_STATE)
  form.refresh(state)
  delete station.dataset.touched
  schedule()
})

$('feas-table').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-pc]')
  if (b) openPoint({ pcBar: Number(b.dataset.pc), lStarM: Number(b.dataset.ls), dpFrac: Number(b.dataset.dp) })
})

window.addEventListener('hashchange', () => {
  const s = decodeState(location.hash)
  if (!s) return
  state = s
  form.refresh(state)
  schedule()
})

$('tb-inputs').textContent = hashInputs(state)
setModelChrome(state.inputs.model)
run()

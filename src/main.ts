import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow-semi-condensed/500.css'
import '@fontsource/barlow-semi-condensed/600.css'
import '@fontsource/barlow-semi-condensed/700.css'
import './styles.css'

import { MODEL, type DesignPoint, type PointResult, type Scenario, type SearchResult } from './physics'
import { InjectorView, type ViewPreset } from './render/scene'
import { clone, decodeState, DEFAULT_STATE, encodeState, hashInputs, type AppState } from './state'
import { EfficiencyBand } from './ui/band'
import { buildForm } from './ui/form'
import { FeasibilityMap, SectionMap } from './ui/maps'
import { resultsHtml } from './ui/results'
import { fieldPixels, sectionAt } from './ui/section'
import type { WorkerRequest } from './worker'

declare const __COMMIT__: string

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

let state: AppState = decodeState(location.hash) ?? clone(DEFAULT_STATE)
// Browsers restore radio state on reload, so read the case from the page.
let scenario: Scenario = (document.querySelector<HTMLInputElement>('#scenario input:checked')?.value as Scenario) ?? 'nominal'
let current: PointResult | null = null
let currentSearch: SearchResult | null = null
let runAt: Date | null = null

const statusEl = $('status')
const band = new EfficiencyBand()
$('band').append(band.el)
const view = new InjectorView($('view'))
const section = new SectionMap($('section-map'), $('section-legend'))
const feas = new FeasibilityMap($('feas-map'), $('feas-controls'), $('feas-legend'), $('feas-table'), (p) => openPoint(p))
const station = $<HTMLInputElement>('station')
const stationOut = $<HTMLOutputElement>('station-out')

$('tb-build').textContent = __COMMIT__
$('tb-model').textContent = MODEL

const form = buildForm($('form'), state, (s) => {
  state = s
  schedule()
})

// The worker is replaced when a newer request arrives, so a long search never blocks a fresh one.
let worker: Worker | null = null
let reqId = 0
let timer = 0

function startWorker(): Worker {
  const w = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  w.onmessage = (e: MessageEvent) => {
    const m = e.data as
      | { id: number; kind: 'progress'; done: number; total: number }
      | { id: number; kind: 'search'; result: SearchResult }
      | { id: number; kind: 'point'; result: PointResult }
      | { id: number; kind: 'error'; message: string }
    if (m.id !== reqId) return
    if (m.kind === 'progress') return setStatus(`Searching ${m.done} of ${m.total} design points`)
    if (m.kind === 'error') return setStatus(`The model stopped: ${m.message}`, true)
    runAt = new Date()
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
    render()
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
  timer = window.setTimeout(run, 250)
  history.replaceState(null, '', encodeState(state))
  $('tb-inputs').textContent = hashInputs(state)
}

function run(): void {
  if (!form.valid()) return
  worker?.terminate()
  worker = startWorker()
  const id = ++reqId
  const inputs = clone(state.inputs)
  const req: WorkerRequest = state.mode === 'search' ? { id, kind: 'search', inputs } : { id, kind: 'point', inputs, point: clone(state.point) }
  setStatus(state.mode === 'search' ? 'Searching' : 'Evaluating')
  worker.postMessage(req)
}

function openPoint(p: DesignPoint): void {
  state.mode = 'point'
  state.point = clone(p)
  form.refresh(state)
  schedule()
}

function render(): void {
  const r = current
  if (!r) return
  const s = r.scenarios
  band.set({ pess: s.pessimistic!.eta, nom: s.nominal!.eta, opt: s.optimistic!.eta })
  showResults(r)
  $('tb-run').textContent = runAt ? runAt.toLocaleString() : ''
  view.setResult(r, scenario, { thicknessMm: state.inputs.injectorThicknessMm, bodyMarginMm: state.inputs.bodyMarginMm })
  const LcMm = r.engine.Lc * 1000
  station.max = String(Math.round(LcMm))
  if (Number(station.value) > LcMm || !station.dataset.touched) station.value = String(Math.round(LcMm))
  updateSection()
  $('feas-fig').hidden = !currentSearch
  if (currentSearch) feas.set(currentSearch)
}

function showResults(r: PointResult): void {
  const html = resultsHtml(r, currentSearch, scenario, state.inputs.wallMode, state.inputs.roughnessUm)
  $('results').innerHTML = html.summary
  $('details').innerHTML = html.details
}

function updateSection(): void {
  const r = current
  if (!r) return
  const x = Number(station.value)
  stationOut.textContent = `${x} mm from the face`
  const f = sectionAt(r, scenario, x / 1000, 121, state.inputs.wallMode)
  section.set(f, r)
  view.setSection(x, fieldPixels(f, r.engine.comb.of), f.n)
}

station.addEventListener('input', () => {
  station.dataset.touched = '1'
  updateSection()
})

for (const input of document.querySelectorAll<HTMLInputElement>('#scenario input')) {
  input.addEventListener('change', () => {
    scenario = input.value as Scenario
    if (!current) return
    view.setScenario(scenario)
    showResults(current)
    updateSection()
  })
}

for (const b of document.querySelectorAll<HTMLButtonElement>('[data-view]')) {
  b.addEventListener('click', () => view.view(b.dataset.view as ViewPreset))
}

$('copy').addEventListener('click', async () => {
  const url = location.href
  try {
    await navigator.clipboard.writeText(url)
    setStatus('Link copied')
  } catch {
    setStatus('Copy the address bar to share these inputs')
  }
})

$('download').addEventListener('click', () => {
  if (!current) return
  const doc = {
    model: MODEL,
    build: __COMMIT__,
    inputsHash: hashInputs(state),
    run: runAt?.toISOString() ?? null,
    status: 'Not validated against hot-fire data',
    state,
    result: current,
    search: currentSearch && { axes: currentSearch.axes, onEdge: currentSearch.onEdge, bestIsp: currentSearch.bestIsp, cells: currentSearch.cells },
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
run()

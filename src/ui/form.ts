import { liquidRange } from '../physics'
import { getPath, setPath, type AppState } from '../state'

type When = (s: AppState) => boolean

interface NumField {
  kind: 'number'
  showIf?: When
  path: string
  label: string
  unit: string
  min: number
  max: number
  step: number
  /** Display value = stored value x scale. */
  scale?: number
  integer?: boolean
}

interface SelectField {
  kind: 'select'
  showIf?: When
  path: string
  label: string
  options: { value: string; label: string }[]
}

interface CheckField {
  kind: 'check'
  showIf?: When
  path: string
  label: string
}

type Field = NumField | SelectField | CheckField

interface PairRow {
  label: string
  unit: string
  key: 'tempK' | 'inletMaxBar' | 'holes' | 'ringRatio' | 'clockDeg'
  min: [number, number]
  max: [number, number]
  step: number
  integer?: boolean
}

interface Group {
  id: string
  title: string
  open: boolean
  tag?: string
  fields?: Field[]
  pair?: PairRow[]
  showIf?: When
}

const v05 = (s: AppState) => s.inputs.model === 'v0.5'
const v04 = (s: AppState) => s.inputs.model === 'v0.4'
const sizing = (s: AppState) => !(v05(s) && s.inputs.mode05 === 'analyze')

const [loxLo, loxHi] = liquidRange('lox')
const [ethLo, ethHi] = liquidRange('ethanol')

const num = (path: string, label: string, unit: string, min: number, max: number, step: number, extra: Partial<NumField> = {}): NumField => ({
  kind: 'number',
  path,
  label,
  unit,
  min,
  max,
  step,
  ...extra,
})

export const GROUPS: Group[] = [
  {
    id: 'model',
    title: 'Model',
    open: true,
    fields: [
      {
        kind: 'select',
        path: 'inputs.model',
        label: 'Physics model',
        options: [
          { value: 'v0.5', label: 'v0.5, rebuilt from the reviews' },
          { value: 'v0.4', label: 'v0.4, the original method' },
        ],
      },
      {
        kind: 'select',
        path: 'inputs.mode05',
        label: 'What to do',
        showIf: v05,
        options: [
          { value: 'design', label: 'Size an engine for this thrust' },
          { value: 'analyze', label: 'Check given hardware' },
        ],
      },
    ],
  },
  {
    id: 'engine',
    title: 'Engine',
    open: true,
    fields: [
      num('inputs.thrustN', 'Thrust', 'N', 100, 20000, 10, { showIf: sizing }),
      num('inputs.pcBar', 'Chamber pressure', 'bar', 5, 45, 0.5, { showIf: (s) => v05(s) && sizing(s) }),
      num('inputs.of', 'Mixture ratio O/F', '', 0.5, 4, 0.01, { showIf: sizing }),
      num('inputs.contractionRatio', 'Contraction ratio Ac/At', '', 1.5, 20, 0.1, { showIf: sizing }),
      num('inputs.maxDiameterMm', 'Max body diameter', 'mm', 20, 1000, 1),
      num('inputs.wallMm', 'Chamber wall allowance', 'mm', 0, 50, 0.5),
    ],
  },
  {
    id: 'hardware',
    title: 'Hardware to check',
    open: true,
    showIf: (s) => v05(s) && s.inputs.mode05 === 'analyze',
    fields: [
      num('inputs.analyze.dOxMm', 'LOX hole diameter', 'mm', 0.2, 10, 0.001),
      num('inputs.analyze.dFuelMm', 'Ethanol hole diameter', 'mm', 0.2, 10, 0.001),
      num('inputs.analyze.DtMm', 'Throat diameter', 'mm', 3, 300, 0.01),
      num('inputs.analyze.DcMm', 'Chamber diameter', 'mm', 5, 600, 0.01),
      num('inputs.analyze.LcylMm', 'Cylinder length', 'mm', 5, 2000, 1),
    ],
  },
  {
    id: 'efficiency',
    title: 'Efficiency',
    open: true,
    showIf: v05,
    fields: [
      num('inputs.etaDesign', 'c* efficiency to size for', '%', 30, 100, 0.5, { scale: 100 }),
      num('inputs.etaTarget', 'Low edge of the band must reach', '%', 10, 100, 0.5, { scale: 100, showIf: sizing }),
      num('inputs.lStarMinM', 'Shortest L* to consider', 'm', 0.2, 5, 0.05, { showIf: sizing }),
      num('inputs.lStarMaxM', 'Longest L* to consider', 'm', 0.3, 6, 0.05, { showIf: sizing }),
    ],
  },
  {
    id: 'propellants',
    title: 'Propellants',
    open: true,
    pair: [
      { label: 'Temperature', unit: 'K', key: 'tempK', min: [Math.max(66, loxLo), Math.max(170, ethLo)], max: [Math.min(130, loxHi), Math.min(350, ethHi)], step: 0.01 },
      { label: 'Max inlet pressure', unit: 'bar', key: 'inletMaxBar', min: [2, 2], max: [200, 200], step: 0.5 },
      { label: 'Holes', unit: '', key: 'holes', min: [1, 1], max: [120, 120], step: 1, integer: true },
      { label: 'Ring radius / chamber radius', unit: '', key: 'ringRatio', min: [0.05, 0.05], max: [0.95, 0.95], step: 0.01 },
      { label: 'First hole angle', unit: 'deg', key: 'clockDeg', min: [0, 0], max: [359, 359], step: 1 },
    ],
  },
  {
    id: 'injector',
    title: 'Injector body',
    open: false,
    fields: [
      num('inputs.injectorThicknessMm', 'Injector thickness', 'mm', 2, 300, 0.1),
      num('inputs.manifoldDepthMm', 'Manifold depth', 'mm', 0, 299, 0.1),
      num('inputs.roughnessUm', 'Hole wall roughness', 'µm', 0, 100, 0.1),
      num('inputs.minPitchDiameters', 'Min hole spacing', 'hole dia', 1, 10, 0.1),
      num('inputs.maxInjectorMassKg', 'Max injector mass', 'kg', 0.01, 100, 0.01),
      num('inputs.bodyDensity', 'Body material density', 'kg/m³', 500, 20000, 10),
      num('inputs.bodyMarginMm', 'Body margin past chamber', 'mm', 0, 100, 0.5),
    ],
  },
  {
    id: 'feed',
    title: 'Feed',
    open: false,
    tag: 'Assumptions',
    fields: [
      num('inputs.dpCap', 'Largest pressure drop to use', '% of Pc', 15, 100, 0.5, { scale: 100, showIf: (s) => v05(s) && sizing(s) }),
      num('inputs.feedMarginBar', 'Feed pressure margin', 'bar', 0, 20, 0.1, { showIf: v05 }),
      num('inputs.manifoldVelocity', 'Feed bore velocity', 'm/s', 1, 30, 0.5),
      num('inputs.manifoldLossHeads', 'Feed loss', 'dynamic heads', 0, 10, 0.1),
      num('inputs.contractionCoeff', 'Vena contracta coefficient', '', 0.5, 1, 0.01),
    ],
  },
  {
    id: 'nozzle',
    title: 'Nozzle and wall',
    open: false,
    tag: 'Assumptions',
    showIf: v05,
    fields: [
      num('inputs.convergentDeg', 'Convergent half-angle', 'deg', 10, 60, 0.5),
      num('inputs.nozzleExitDeg', 'Nozzle exit half-angle', 'deg', 0, 30, 0.5),
      num('inputs.etaKinBL', 'Kinetic and boundary-layer factor', '%', 80, 100, 0.1, { scale: 100 }),
      num('inputs.throatCurvature', 'Throat curvature / throat radius', '', 0.2, 5, 0.05),
      num('inputs.wallTempK', 'Hot wall temperature', 'K', 250, 1500, 10),
      { kind: 'check', path: 'inputs.wallProtected', label: 'Wall has film cooling or an ablative liner' },
    ],
  },
  {
    id: 'uncertainty',
    title: 'Uncertainty sweep',
    open: false,
    tag: 'Guesses',
    showIf: v05,
    fields: [
      num('inputs.mixI.0', 'Turbulence intensity, low', '%', 1, 20, 0.5, { scale: 100 }),
      num('inputs.mixI.1', 'Turbulence intensity, middle', '%', 1, 20, 0.5, { scale: 100 }),
      num('inputs.mixI.2', 'Turbulence intensity, high', '%', 1, 20, 0.5, { scale: 100 }),
      num('inputs.dropLo', 'Smallest drop size factor', '×', 0.1, 1, 0.05),
      num('inputs.dropHi', 'Largest drop size factor', '×', 1, 5, 0.05),
    ],
  },
  {
    id: 'model04',
    title: 'v0.4 constants',
    open: false,
    tag: 'Guesses',
    showIf: v04,
    fields: [
      num('inputs.vaporizationK', 'Evaporation constant K', 'mm²/s', 0.1, 50, 0.1, { scale: 1e6 }),
      {
        kind: 'select',
        path: 'inputs.wallMode',
        label: 'Spray at the chamber wall',
        options: [
          { value: 'truncate', label: 'Drop tails past the wall (v0.4)' },
          { value: 'mirror', label: 'Reflect tails back inside' },
        ],
      },
      { kind: 'check', path: 'inputs.capEtaMix', label: 'Cap mixing efficiency at 100% (v0.4)' },
      { kind: 'check', path: 'inputs.clampLegacyOF', label: 'Clamp local O/F to 0.3–4.0 (v0.4)' },
    ],
  },
  {
    id: 'search',
    title: 'Design point',
    open: true,
    showIf: v04,
    fields: [
      {
        kind: 'select',
        path: 'mode',
        label: 'How to pick Pc, L* and pressure drop',
        options: [
          { value: 'search', label: 'Search a range' },
          { value: 'point', label: 'Enter one point' },
        ],
      },
    ],
  },
  {
    id: 'grid',
    title: 'Search range',
    open: false,
    showIf: (s) => v04(s) && s.mode === 'search',
    fields: [
      num('inputs.grid.pcBar.min', 'Chamber pressure from', 'bar', 5, 60, 0.5),
      num('inputs.grid.pcBar.max', 'to', 'bar', 5, 60, 0.5),
      num('inputs.grid.pcBar.step', 'in steps of', 'bar', 0.5, 20, 0.5),
      num('inputs.grid.lStarM.min', 'L* from', 'm', 0.2, 5, 0.05),
      num('inputs.grid.lStarM.max', 'to', 'm', 0.2, 5, 0.05),
      num('inputs.grid.lStarM.step', 'in steps of', 'm', 0.05, 2, 0.05),
      num('inputs.grid.dpFrac.min', 'Pressure drop from', '% of Pc', 5, 100, 0.5, { scale: 100 }),
      num('inputs.grid.dpFrac.max', 'to', '% of Pc', 5, 100, 0.5, { scale: 100 }),
      num('inputs.grid.dpFrac.step', 'in steps of', '% of Pc', 0.5, 50, 0.5, { scale: 100 }),
      num('inputs.tieWindow', 'Tie-break window', '% of best Isp', 0, 10, 0.1, { scale: 100 }),
    ],
  },
  {
    id: 'point',
    title: 'Point',
    open: true,
    showIf: (s) => v04(s) && s.mode === 'point',
    fields: [
      num('point.pcBar', 'Chamber pressure', 'bar', 5, 60, 0.5),
      num('point.lStarM', 'L*', 'm', 0.2, 5, 0.05),
      num('point.dpFrac', 'Injector pressure drop', '% of Pc', 5, 100, 0.5, { scale: 100 }),
    ],
  },
]

const round = (x: number) => Math.round(x * 1e9) / 1e9

function numInput(f: { min: number; max: number; step: number }, id: string, value: number): HTMLInputElement {
  const el = document.createElement('input')
  el.type = 'number'
  el.id = id
  el.inputMode = 'decimal'
  el.min = String(f.min)
  el.max = String(f.max)
  el.step = 'any'
  el.value = String(round(value))
  return el
}

function checkNumber(raw: string, f: { min: number; max: number; integer?: boolean }, unit: string): string | null {
  if (raw.trim() === '') return 'Enter a value.'
  const v = Number(raw)
  if (!Number.isFinite(v)) return 'Enter a number.'
  if (v < f.min || v > f.max) return `Enter a value from ${f.min} to ${f.max}${unit ? ` ${unit}` : ''}.`
  if (f.integer && !Number.isInteger(v)) return 'Enter a whole number.'
  return null
}

/** Checks that need more than one field. Returns messages keyed by the field path they attach to. */
export function crossChecks(s: AppState): Record<string, string> {
  const out: Record<string, string> = {}
  const i = s.inputs
  if (i.manifoldDepthMm >= i.injectorThicknessMm) out['inputs.manifoldDepthMm'] = 'Manifold depth must be less than the injector thickness.'
  if (i.model === 'v0.5') {
    if (i.lStarMinM >= i.lStarMaxM) out['inputs.lStarMaxM'] = 'The longest L* must be above the shortest.'
    if (i.mode05 === 'analyze' && i.analyze.DtMm >= i.analyze.DcMm) out['inputs.analyze.DcMm'] = 'The chamber must be wider than the throat.'
    if (!(i.mixI[0]! <= i.mixI[1]! && i.mixI[1]! <= i.mixI[2]!)) out['inputs.mixI.2'] = 'List the intensities from low to high.'
  }
  if (i.model === 'v0.4' && s.mode === 'search') {
    const g = i.grid
    for (const k of ['pcBar', 'lStarM', 'dpFrac'] as const) {
      if (g[k].min > g[k].max) out[`inputs.grid.${k}.max`] = 'The upper end must not be below the lower end.'
    }
    const n = (r: { min: number; max: number; step: number }) => Math.floor((r.max - r.min) / r.step + 1e-9) + 1
    const cells = n(g.pcBar) * n(g.lStarM) * n(g.dpFrac)
    if (cells > 20000) out['inputs.grid.dpFrac.step'] = `This range has ${cells} points. Keep it under 20,000.`
  }
  return out
}

export interface FormHandle {
  refresh(s: AppState): void
  valid(): boolean
}

export function buildForm(root: HTMLElement, state: AppState, onChange: (s: AppState) => void): FormHandle {
  const errors = new Map<string, string>()
  const errorEls = new Map<string, HTMLElement>()
  const groupEls = new Map<string, HTMLElement>()
  const fieldEls: { el: HTMLElement; when: When }[] = []
  const applyVisibility = (st: AppState) => {
    for (const g of GROUPS) {
      const el = groupEls.get(g.id)
      if (el) el.hidden = g.showIf ? !g.showIf(st) : false
    }
    for (const f of fieldEls) f.el.hidden = !f.when(st)
  }

  const setError = (path: string, msg: string | null) => {
    if (msg) errors.set(path, msg)
    else errors.delete(path)
    const el = errorEls.get(path)
    if (el) {
      el.textContent = msg ?? ''
      el.hidden = !msg
      el.previousElementSibling?.querySelector('input')?.setAttribute('aria-invalid', msg ? 'true' : 'false')
    }
  }

  const emit = () => {
    const cross = crossChecks(state)
    for (const [p, el] of errorEls) {
      const own = errors.get(p)
      if (own) continue
      el.textContent = cross[p] ?? ''
      el.hidden = !cross[p]
    }
    applyVisibility(state)
    if (!errors.size && !Object.keys(cross).length) onChange(state)
  }

  for (const g of GROUPS) {
    const details = document.createElement('details')
    details.className = 'group'
    details.open = g.open
    const summary = document.createElement('summary')
    summary.innerHTML = `<span>${g.title}</span>${g.tag ? `<span class="tag">${g.tag}</span>` : ''}`
    details.append(summary)
    const body = document.createElement('div')
    body.className = 'group-body'
    details.append(body)
    groupEls.set(g.id, details)

    if (g.pair) {
      const table = document.createElement('div')
      table.className = 'pair'
      table.innerHTML = `<span></span><span class="col-head"><i class="swatch lox"></i>LOX</span><span class="col-head"><i class="swatch fuel"></i>Ethanol</span>`
      for (const row of g.pair) {
        const lab = document.createElement('span')
        lab.className = 'pair-label'
        lab.textContent = row.unit ? `${row.label} (${row.unit})` : row.label
        table.append(lab)
        ;(['ox', 'fuel'] as const).forEach((prop, k) => {
          const path = `inputs.${prop}.${row.key}`
          const id = `f-${path.replace(/\./g, '-')}`
          const spec = { min: row.min[k]!, max: row.max[k]!, step: row.step, integer: row.integer }
          const input = numInput(spec, id, getPath(state, path) as number)
          input.setAttribute('aria-label', `${prop === 'ox' ? 'LOX' : 'Ethanol'} ${row.label.toLowerCase()}`)
          const cellWrap = document.createElement('span')
          cellWrap.className = 'pair-cell'
          cellWrap.append(input)
          const err = document.createElement('span')
          err.className = 'err'
          err.hidden = true
          err.setAttribute('role', 'alert')
          cellWrap.append(err)
          errorEls.set(path, err)
          input.addEventListener('input', () => {
            const msg = checkNumber(input.value, spec, row.unit)
            err.textContent = msg ?? ''
            err.hidden = !msg
            input.setAttribute('aria-invalid', msg ? 'true' : 'false')
            if (msg) errors.set(path, msg)
            else {
              errors.delete(path)
              setPath(state, path, Number(input.value))
            }
            emit()
          })
          table.append(cellWrap)
        })
      }
      body.append(table)
    }

    for (const f of g.fields ?? []) {
      const id = `f-${f.path.replace(/\./g, '-')}`
      const wrap = document.createElement('div')
      wrap.className = `field field-${f.kind}`
      if (f.showIf) fieldEls.push({ el: wrap, when: f.showIf })
      if (f.kind === 'number') {
        const scale = f.scale ?? 1
        const label = document.createElement('label')
        label.htmlFor = id
        label.innerHTML = `<span class="label">${f.label}</span>`
        const input = numInput(f, id, (getPath(state, f.path) as number) * scale)
        const unit = document.createElement('span')
        unit.className = 'unit'
        unit.textContent = f.unit
        const line = document.createElement('div')
        line.className = 'field-line'
        line.append(label, input, unit)
        const err = document.createElement('p')
        err.className = 'err'
        err.hidden = true
        err.setAttribute('role', 'alert')
        errorEls.set(f.path, err)
        wrap.append(line, err)
        input.addEventListener('input', () => {
          const msg = checkNumber(input.value, f, f.unit)
          setError(f.path, msg)
          if (!msg) setPath(state, f.path, Number(input.value) / scale)
          emit()
        })
      } else if (f.kind === 'select') {
        const label = document.createElement('label')
        label.htmlFor = id
        label.className = 'label'
        label.textContent = f.label
        const sel = document.createElement('select')
        sel.id = id
        for (const o of f.options) sel.add(new Option(o.label, o.value))
        sel.value = String(getPath(state, f.path))
        sel.addEventListener('change', () => {
          setPath(state, f.path, sel.value)
          emit()
        })
        wrap.append(label, sel)
      } else {
        const label = document.createElement('label')
        label.className = 'check'
        const box = document.createElement('input')
        box.type = 'checkbox'
        box.id = id
        box.checked = Boolean(getPath(state, f.path))
        box.addEventListener('change', () => {
          setPath(state, f.path, box.checked)
          emit()
        })
        label.append(box, document.createTextNode(f.label))
        wrap.append(label)
      }
      body.append(wrap)
    }
    root.append(details)
  }

  const refresh = (s: AppState) => {
    state = s
    errors.clear()
    for (const el of root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')) {
      const path = el.id.replace(/^f-/, '').replace(/-/g, '.')
      const v = getPath(s, path)
      const field = GROUPS.flatMap((g) => g.fields ?? []).find((f) => f.path === path)
      if (el instanceof HTMLInputElement && el.type === 'checkbox') el.checked = Boolean(v)
      else if (el instanceof HTMLInputElement) el.value = String(round((v as number) * (field?.kind === 'number' ? (field.scale ?? 1) : 1)))
      else el.value = String(v)
      el.setAttribute('aria-invalid', 'false')
    }
    for (const el of errorEls.values()) el.hidden = true
    applyVisibility(s)
  }
  refresh(state)
  return { refresh, valid: () => !errors.size && !Object.keys(crossChecks(state)).length }

}

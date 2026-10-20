import type { DesignPoint, SearchResult } from '../physics'
import { fieldPixels, RAMP_CSS, type SectionField } from './section'
import { esc, fix, G0 } from './format'

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

function fitCanvas(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D {
  const dpr = Math.min(2, devicePixelRatio || 1)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

function tooltip(host: HTMLElement): { show(x: number, y: number, html: string): void; hide(): void } {
  const tip = document.createElement('div')
  tip.className = 'tip'
  tip.hidden = true
  host.append(tip)
  return {
    show(x, y, html) {
      tip.innerHTML = html
      tip.hidden = false
      const w = host.clientWidth
      tip.style.left = `${Math.min(w - tip.offsetWidth - 4, Math.max(4, x + 12))}px`
      tip.style.top = `${Math.max(4, y - tip.offsetHeight - 10)}px`
    },
    hide() {
      tip.hidden = true
    },
  }
}

/** Mixture ratio across the chamber at one station, seen from the nozzle end. */
export class SectionMap {
  private canvas = document.createElement('canvas')
  private off = document.createElement('canvas')
  private field: SectionField | null = null
  private holes: { prop: 'ox' | 'fuel'; x: number; y: number }[] = []
  private tip: ReturnType<typeof tooltip>
  private size = 0

  constructor(private host: HTMLElement, private legend: HTMLElement) {
    host.append(this.canvas)
    this.tip = tooltip(host)
    new ResizeObserver(() => this.draw()).observe(host)
    this.canvas.addEventListener('pointermove', (e) => this.hover(e))
    this.canvas.addEventListener('pointerleave', () => this.tip.hide())
  }

  set(field: SectionField, holes: { prop: 'ox' | 'fuel'; x: number; y: number }[], of: number): void {
    this.field = field
    this.holes = holes
    const px = fieldPixels(field, of)
    this.off.width = field.n
    this.off.height = field.n
    const img = new ImageData(field.n, field.n)
    // Field rows run with y upward; canvas rows run downward.
    for (let j = 0; j < field.n; j++) img.data.set(px.subarray(j * field.n * 4, (j + 1) * field.n * 4), (field.n - 1 - j) * field.n * 4)
    this.off.getContext('2d')!.putImageData(img, 0, 0)
    this.legend.innerHTML = `<div class="ramp" style="background:${RAMP_CSS}"></div>
      <div class="ramp-ticks"><span>${fix(of / 4, 2)}</span><span>${fix(of / 2, 2)}</span><span>${fix(of, 2)}</span><span>${fix(of * 2, 2)}</span><span>${fix(of * 4, 2)}</span></div>
      <div class="ramp-ends"><span>Fuel-rich</span><span>Design O/F</span><span>Oxidizer-rich</span></div>
      <p class="note">Fainter means less propellant flux.</p>`
    this.draw()
  }

  private draw(): void {
    const w = Math.min(this.host.clientWidth, 420)
    if (!w || !this.field) return
    this.size = w
    const ctx = fitCanvas(this.canvas, w, w)
    const c = w / 2
    const rad = w / 2 - 6
    ctx.clearRect(0, 0, w, w)
    ctx.save()
    ctx.beginPath()
    ctx.arc(c, c, rad, 0, 2 * Math.PI)
    ctx.fillStyle = css('--sheet')
    ctx.fill()
    ctx.clip()
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(this.off, c - rad, c - rad, 2 * rad, 2 * rad)
    ctx.restore()
    ctx.beginPath()
    ctx.arc(c, c, rad, 0, 2 * Math.PI)
    ctx.strokeStyle = css('--ink')
    ctx.lineWidth = 1.5
    ctx.stroke()
    const R = this.field.R
    ctx.strokeStyle = css('--ink')
    ctx.lineWidth = 1
    for (const h of this.holes) {
      ctx.fillStyle = css(h.prop === 'ox' ? '--lox' : '--fuel')
      ctx.beginPath()
      ctx.arc(c + (h.x / R) * rad, c - (h.y / R) * rad, 3, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
    }
  }

  private hover(e: PointerEvent): void {
    const f = this.field
    if (!f || !this.size) return
    const rect = this.canvas.getBoundingClientRect()
    const rad = this.size / 2 - 6
    const u = (e.clientX - rect.left - this.size / 2) / rad
    const v = -(e.clientY - rect.top - this.size / 2) / rad
    if (u * u + v * v > 1) return this.tip.hide()
    const i = Math.min(f.n - 1, Math.max(0, Math.floor(((u + 1) / 2) * f.n)))
    const j = Math.min(f.n - 1, Math.max(0, Math.floor(((v + 1) / 2) * f.n)))
    const k = j * f.n + i
    const fo = f.ox[k]!
    const ff = f.fuel[k]!
    const of = ff > 0 ? fo / ff : Infinity
    this.tip.show(
      e.clientX - rect.left,
      e.clientY - rect.top,
      `r ${fix(Math.hypot(u, v) * f.R * 1000, 1)} mm<br>O/F ${Number.isFinite(of) ? fix(of, 2) : 'no fuel'}<br>Flux ${fix(fo + ff, 0)} kg/(m²·s)`,
    )
  }
}

const SEQ = ['#E3E8EA', '#BFCBD1', '#93A6B1', '#677F8D', '#3F5868', '#1C2830']

function seqColor(t: number): string {
  const pos = Math.max(0, Math.min(1, t)) * (SEQ.length - 1)
  const i = Math.min(SEQ.length - 2, Math.floor(pos))
  const u = pos - i
  const a = SEQ[i]!.match(/\w\w/g)!.map((h) => parseInt(h, 16))
  const b = SEQ[i + 1]!.match(/\w\w/g)!.map((h) => parseInt(h, 16))
  return `rgb(${a.map((x, k) => Math.round(x + u * (b[k]! - x))).join(',')})`
}

const LIMIT_NAMES: Record<string, string> = {
  'inlet-ox': 'LOX inlet pressure',
  'inlet-fuel': 'ethanol inlet pressure',
  'pitch-ox': 'LOX hole spacing',
  'pitch-fuel': 'ethanol hole spacing',
  'cavitation-ox': 'LOX cavitation',
  'cavitation-fuel': 'ethanol cavitation',
  'ring-gap': 'gap between rings',
  body: 'body diameter',
  mass: 'injector mass',
}

/** Nominal delivered Isp over Pc and L* at one pressure drop; hatched cells fail a limit. */
export class FeasibilityMap {
  private canvas = document.createElement('canvas')
  private search: SearchResult | null = null
  private dp = 0
  private tip: ReturnType<typeof tooltip>
  private geom = { x0: 0, y0: 0, cw: 0, ch: 0 }
  private picker: HTMLSelectElement

  constructor(
    private host: HTMLElement,
    private controls: HTMLElement,
    private legend: HTMLElement,
    private table: HTMLElement,
    private onPick: (p: DesignPoint) => void,
  ) {
    this.picker = document.createElement('select')
    this.picker.id = 'dp-pick'
    const label = document.createElement('label')
    label.htmlFor = 'dp-pick'
    label.textContent = 'Pressure drop'
    controls.append(label, this.picker)
    this.picker.addEventListener('change', () => {
      this.dp = Number(this.picker.value)
      this.draw()
    })
    host.append(this.canvas)
    this.tip = tooltip(host)
    new ResizeObserver(() => this.draw()).observe(host)
    this.canvas.addEventListener('pointermove', (e) => this.hover(e))
    this.canvas.addEventListener('pointerleave', () => this.tip.hide())
    this.canvas.addEventListener('click', (e) => {
      const c = this.cellAt(e)
      if (c?.feasible) this.onPick(c.point)
    })
  }

  set(s: SearchResult): void {
    this.search = s
    const chosen = s.chosen?.point.dpFrac ?? s.axes.dpFrac[0]!
    this.dp = chosen
    this.picker.innerHTML = s.axes.dpFrac.map((d) => `<option value="${d}">${fix(100 * d, 1)}% of Pc</option>`).join('')
    this.picker.value = String(chosen)
    this.draw()
  }

  private range(): [number, number] {
    const v = this.search!.cells.filter((c) => c.ispNominal != null).map((c) => c.ispNominal!)
    return v.length ? [Math.min(...v), Math.max(...v)] : [0, 1]
  }

  private draw(): void {
    const s = this.search
    const w = this.host.clientWidth
    if (!s || !w) return
    const { pcBar, lStarM } = s.axes
    const h = Math.max(200, Math.min(320, 26 * lStarM.length + 60))
    const ctx = fitCanvas(this.canvas, w, h)
    const x0 = 46
    const y0 = 10
    const cw = (w - x0 - 8) / pcBar.length
    const ch = (h - y0 - 40) / lStarM.length
    this.geom = { x0, y0, cw, ch }
    const [lo, hi] = this.range()
    ctx.clearRect(0, 0, w, h)
    const hatch = document.createElement('canvas')
    hatch.width = hatch.height = 8
    const hc = hatch.getContext('2d')!
    hc.fillStyle = css('--wash')
    hc.fillRect(0, 0, 8, 8)
    hc.strokeStyle = css('--rule')
    hc.lineWidth = 1
    hc.beginPath()
    hc.moveTo(0, 8)
    hc.lineTo(8, 0)
    hc.stroke()
    const pattern = ctx.createPattern(hatch, 'repeat')!
    for (const c of s.cells) {
      if (c.point.dpFrac !== this.dp) continue
      const i = pcBar.indexOf(c.point.pcBar)
      const j = lStarM.indexOf(c.point.lStarM)
      const x = x0 + i * cw
      const y = y0 + (lStarM.length - 1 - j) * ch
      ctx.fillStyle = c.ispNominal != null ? seqColor(hi > lo ? (c.ispNominal - lo) / (hi - lo) : 1) : pattern
      ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2)
    }
    const ch0 = s.chosen?.point
    if (ch0 && ch0.dpFrac === this.dp) {
      const i = pcBar.indexOf(ch0.pcBar)
      const j = lStarM.indexOf(ch0.lStarM)
      ctx.strokeStyle = css('--sheet')
      ctx.lineWidth = 4
      ctx.strokeRect(x0 + i * cw + 2, y0 + (lStarM.length - 1 - j) * ch + 2, cw - 4, ch - 4)
      ctx.strokeStyle = css('--ink')
      ctx.lineWidth = 2
      ctx.strokeRect(x0 + i * cw + 2, y0 + (lStarM.length - 1 - j) * ch + 2, cw - 4, ch - 4)
    }
    ctx.fillStyle = css('--ink-2')
    ctx.font = `13px ${css('--font-ui')}`
    ctx.textAlign = 'center'
    const every = Math.ceil(pcBar.length / Math.max(1, Math.floor((w - x0) / 44)))
    pcBar.forEach((p, i) => {
      if (i % every === 0) ctx.fillText(fix(p, p % 1 ? 1 : 0), x0 + (i + 0.5) * cw, y0 + lStarM.length * ch + 16)
    })
    ctx.fillText('Chamber pressure (bar)', x0 + (pcBar.length * cw) / 2, h - 4)
    ctx.textAlign = 'right'
    lStarM.forEach((l, j) => ctx.fillText(fix(l, 2), x0 - 6, y0 + (lStarM.length - 1 - j + 0.5) * ch + 4))
    ctx.save()
    ctx.translate(11, y0 + (lStarM.length * ch) / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillText('L* (m)', 0, 0)
    ctx.restore()

    this.legend.innerHTML = `<div class="ramp" style="background:linear-gradient(90deg, ${SEQ.join(', ')})"></div>
      <div class="ramp-ends"><span>${fix(lo / G0, 1)} s</span><span>${fix(hi / G0, 1)} s</span></div>
      <p class="note">Nominal delivered Isp. Hatched: fails a limit. Select a cell to open that point.</p>`
    const rows = s.cells
      .filter((c) => c.point.dpFrac === this.dp)
      .map(
        (c) =>
          `<tr><td>${fix(c.point.pcBar, 1)}</td><td>${fix(c.point.lStarM, 2)}</td><td>${c.ispNominal != null ? `${fix(c.ispNominal / G0, 1)} <button type="button" class="open" data-pc="${c.point.pcBar}" data-ls="${c.point.lStarM}" data-dp="${c.point.dpFrac}">Open</button>` : esc(c.failed.map((k) => LIMIT_NAMES[k] ?? k).join(', '))}</td></tr>`,
      )
      .join('')
    this.table.innerHTML = `<table class="data"><thead><tr><th scope="col">Pc (bar)</th><th scope="col">L* (m)</th><th scope="col">Isp (s) or failed limits</th></tr></thead><tbody>${rows}</tbody></table>`
  }

  private cellAt(e: MouseEvent) {
    const s = this.search
    if (!s) return null
    const rect = this.canvas.getBoundingClientRect()
    const { x0, y0, cw, ch } = this.geom
    const i = Math.floor((e.clientX - rect.left - x0) / cw)
    const jr = Math.floor((e.clientY - rect.top - y0) / ch)
    const { pcBar, lStarM } = s.axes
    if (i < 0 || i >= pcBar.length || jr < 0 || jr >= lStarM.length) return null
    const pc = pcBar[i]!
    const ls = lStarM[lStarM.length - 1 - jr]!
    return s.cells.find((c) => c.point.pcBar === pc && c.point.lStarM === ls && c.point.dpFrac === this.dp) ?? null
  }

  private hover(e: PointerEvent): void {
    const c = this.cellAt(e)
    if (!c) return this.tip.hide()
    const rect = this.canvas.getBoundingClientRect()
    const head = `${fix(c.point.pcBar, 1)} bar, L* ${fix(c.point.lStarM, 2)} m`
    const body = c.ispNominal != null ? `${fix(c.ispNominal / G0, 1)} s nominal` : `Fails: ${esc(c.failed.map((k) => LIMIT_NAMES[k] ?? k).join(', '))}`
    this.canvas.style.cursor = c.feasible ? 'pointer' : 'default'
    this.tip.show(e.clientX - rect.left, e.clientY - rect.top, `${head}<br>${body}`)
  }
}

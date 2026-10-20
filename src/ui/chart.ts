import type { Result05 } from '../physics/v05/types'
import { fix } from './format'

const NS = 'http://www.w3.org/2000/svg'

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  parent?.append(e)
  return e
}

/** c* efficiency band, central case and vaporized fractions along the chamber, all in percent. */
export class LengthChart {
  private svg = el('svg', { class: 'lchart', role: 'img' })
  private tip = document.createElement('div')
  private result: Result05 | null = null
  private target = NaN
  private geom = { x0: 44, x1: 0, y0: 12, y1: 0, xMax: 1 }

  constructor(private host: HTMLElement, private legend: HTMLElement) {
    host.classList.add('canvas-host')
    host.append(this.svg)
    this.tip.className = 'tip'
    this.tip.hidden = true
    host.append(this.tip)
    new ResizeObserver(() => this.draw()).observe(host)
    this.svg.addEventListener('pointermove', (e) => this.hover(e))
    this.svg.addEventListener('pointerleave', () => {
      this.tip.hidden = true
      this.svg.querySelector('.cross')?.setAttribute('visibility', 'hidden')
    })
  }

  set(r: Result05, target: number): void {
    this.result = r
    this.target = target
    this.draw()
    this.legend.innerHTML = `<ul class="chart-legend">
      <li><i class="key band"></i>c* efficiency, low to high edge</li>
      <li><i class="key central"></i>central case</li>
      <li><i class="key lox"></i>LOX vaporized</li>
      <li><i class="key fuel"></i>Ethanol vaporized</li>
      <li><i class="key near"></i>near the face, mixing not modeled</li>
      ${r.mode === 'design' ? '<li><i class="key target"></i>target for the low edge</li>' : ''}
    </ul>`
  }

  private draw(): void {
    const r = this.result
    const w = this.host.clientWidth
    if (!r || !w) return
    const h = 260
    this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
    this.svg.setAttribute('width', String(w))
    this.svg.setAttribute('height', String(h))
    this.svg.replaceChildren()
    const g = this.geom
    g.x1 = w - 12
    g.y1 = h - 34
    g.xMax = r.curve.x[r.curve.x.length - 1]!
    const X = (x: number) => g.x0 + (x / g.xMax) * (g.x1 - g.x0)
    const Y = (v: number) => g.y1 - Math.max(0, Math.min(1, v)) * (g.y1 - g.y0)

    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      el('line', { x1: g.x0, x2: g.x1, y1: Y(t), y2: Y(t), class: 'grid' }, this.svg)
      el('text', { x: g.x0 - 6, y: Y(t) + 4, class: 'axis', 'text-anchor': 'end' }, this.svg).textContent = `${t * 100}%`
    }
    const stepMm = niceStep((g.xMax * 1000) / 5)
    for (let mm = 0; mm <= g.xMax * 1000 + 1e-6; mm += stepMm) {
      el('text', { x: X(mm / 1000), y: g.y1 + 16, class: 'axis', 'text-anchor': 'middle' }, this.svg).textContent = fix(mm, 0)
    }
    el('text', { x: (g.x0 + g.x1) / 2, y: h - 2, class: 'axis', 'text-anchor': 'middle' }, this.svg).textContent = 'Distance from the injector face (mm)'

    // Review C M4: the field is not modeled closer to the face than twice the smallest unlike spacing.
    const xn = X(Math.min(r.xNear, g.xMax))
    el('rect', { x: g.x0, y: g.y0, width: Math.max(0, xn - g.x0), height: g.y1 - g.y0, class: 'near' }, this.svg)
    const c = r.curve
    const pts = (ys: number[]) => c.x.map((x, k) => `${X(x).toFixed(1)},${Y(ys[k]!).toFixed(1)}`)
    const area = [...pts(c.hi), ...pts(c.lo).reverse()].join(' ')
    el('polygon', { points: area, class: 'band-area' }, this.svg)
    el('polyline', { points: pts(c.vapOx).join(' '), class: 'line lox' }, this.svg)
    el('polyline', { points: pts(c.vapFuel).join(' '), class: 'line fuel' }, this.svg)
    el('polyline', { points: pts(c.lo).join(' '), class: 'line edge' }, this.svg)
    el('polyline', { points: pts(c.hi).join(' '), class: 'line edge' }, this.svg)
    el('polyline', { points: pts(c.mid).join(' '), class: 'line central' }, this.svg)
    if (r.mode === 'design' && Number.isFinite(this.target)) {
      el('line', { x1: g.x0, x2: g.x1, y1: Y(this.target), y2: Y(this.target), class: 'target' }, this.svg)
    }
    const xa = X(c.x[r.at]!)
    el('line', { x1: xa, x2: xa, y1: g.y0, y2: g.y1, class: 'chosen' }, this.svg)
    el('text', { x: Math.min(xa + 4, g.x1 - 4), y: g.y0 + 10, class: 'axis chosen-label', 'text-anchor': xa > g.x1 - 90 ? 'end' : 'start' }, this.svg).textContent =
      r.mode === 'design' ? `L* ${fix(r.geom.lStar, 2)} m` : 'chamber end'
    el('line', { x1: 0, x2: 0, y1: g.y0, y2: g.y1, class: 'cross', visibility: 'hidden' }, this.svg)
    this.svg.setAttribute(
      'aria-label',
      `c* efficiency along the chamber. At ${fix(c.x[r.at]! * 1000, 0)} mm the band is ${fix(100 * c.lo[r.at]!, 0)}% to ${fix(100 * c.hi[r.at]!, 0)}%.`,
    )
  }

  private hover(e: PointerEvent): void {
    const r = this.result
    if (!r) return
    const rect = this.svg.getBoundingClientRect()
    const px = e.clientX - rect.left
    const g = this.geom
    if (px < g.x0 || px > g.x1) {
      this.tip.hidden = true
      return
    }
    const x = ((px - g.x0) / (g.x1 - g.x0)) * g.xMax
    const c = r.curve
    let k = 0
    for (let j = 1; j < c.x.length; j++) if (Math.abs(c.x[j]! - x) < Math.abs(c.x[k]! - x)) k = j
    const cross = this.svg.querySelector('.cross')
    const xc = g.x0 + (c.x[k]! / g.xMax) * (g.x1 - g.x0)
    cross?.setAttribute('x1', String(xc))
    cross?.setAttribute('x2', String(xc))
    cross?.setAttribute('visibility', 'visible')
    this.tip.innerHTML = `${fix(c.x[k]! * 1000, 0)} mm from the face<br>c* efficiency ${fix(100 * c.lo[k]!, 0)}% to ${fix(100 * c.hi[k]!, 0)}%<br>central ${fix(100 * c.mid[k]!, 1)}%<br>vaporized: LOX ${fix(100 * c.vapOx[k]!, 0)}%, ethanol ${fix(100 * c.vapFuel[k]!, 0)}%`
    this.tip.hidden = false
    const w = this.host.clientWidth
    this.tip.style.left = `${Math.min(w - this.tip.offsetWidth - 4, Math.max(4, xc + 12))}px`
    this.tip.style.top = `${g.y0}px`
  }
}

function niceStep(raw: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= raw) return m * p
  return 10 * p
}

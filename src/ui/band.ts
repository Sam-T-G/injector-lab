import { animate } from 'motion'
import { fix } from './format'

export interface BandValues {
  pess: number
  nom: number
  opt: number
}

const W = 320
const PAD = 14
const x = (v: number) => PAD + Math.max(0, Math.min(1, v)) * (W - 2 * PAD)

/** Efficiency band on a 0-100% scale: the shaded span is pessimistic to optimistic, the tick is nominal. */
export class EfficiencyBand {
  readonly el: SVGSVGElement
  private cur: BandValues = { pess: 0, nom: 0, opt: 0 }
  private span: SVGRectElement
  private tick: SVGLineElement
  private lo: SVGTextElement
  private hi: SVGTextElement
  private nomLabel: SVGTextElement
  private reduce = matchMedia('(prefers-reduced-motion: reduce)')

  constructor() {
    const ns = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('viewBox', `0 0 ${W} 86`)
    svg.setAttribute('class', 'band')
    svg.setAttribute('role', 'img')
    const mk = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) => {
      const e = document.createElementNS(ns, tag)
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
      svg.append(e)
      return e
    }
    mk('rect', { x: PAD, y: 30, width: W - 2 * PAD, height: 12, rx: 2, class: 'band-track' })
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      mk('line', { x1: x(t), x2: x(t), y1: 44, y2: 48, class: 'band-grid' })
      const lab = mk('text', { x: x(t), y: 84, class: 'band-axis', 'text-anchor': 'middle' })
      lab.textContent = `${t * 100}%`
    }
    this.span = mk('rect', { x: PAD, y: 30, width: 0, height: 12, rx: 2, class: 'band-span' })
    this.tick = mk('line', { x1: PAD, x2: PAD, y1: 22, y2: 46, class: 'band-tick' })
    this.nomLabel = mk('text', { x: PAD, y: 16, class: 'band-nom', 'text-anchor': 'middle' })
    this.lo = mk('text', { x: PAD, y: 60, class: 'band-end', 'text-anchor': 'end' })
    this.hi = mk('text', { x: PAD, y: 60, class: 'band-end', 'text-anchor': 'start' })
    this.el = svg
  }

  set(v: BandValues): void {
    this.el.setAttribute('aria-label', `c* efficiency ${fix(100 * v.pess)}% to ${fix(100 * v.opt)}%, nominal ${fix(100 * v.nom)}%`)
    const from = { ...this.cur }
    this.cur = v
    if (this.reduce.matches) return this.draw(v)
    animate(0, 1, {
      duration: 0.5,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate: (u) =>
        this.draw({
          pess: from.pess + u * (v.pess - from.pess),
          nom: from.nom + u * (v.nom - from.nom),
          opt: from.opt + u * (v.opt - from.opt),
        }),
    })
  }

  private draw(v: BandValues): void {
    const a = x(v.pess)
    const b = x(v.opt)
    this.span.setAttribute('x', String(a))
    this.span.setAttribute('width', String(Math.max(2, b - a)))
    this.tick.setAttribute('x1', String(x(v.nom)))
    this.tick.setAttribute('x2', String(x(v.nom)))
    const xn = x(v.nom)
    const edge = xn > W - 70 ? 'end' : xn < 70 ? 'start' : 'middle'
    this.nomLabel.setAttribute('text-anchor', edge)
    this.nomLabel.setAttribute('x', String(edge === 'end' ? xn + 1 : edge === 'start' ? xn - 1 : xn))
    this.nomLabel.textContent = `${fix(100 * v.nom)}% nominal`
    this.lo.setAttribute('x', String(a - 4))
    this.lo.textContent = `${fix(100 * v.pess)}%`
    this.hi.setAttribute('x', String(b + 4))
    this.hi.textContent = `${fix(100 * v.opt)}%`
    // A narrow span gets one label; otherwise keep end labels inside the box.
    if (b - a < 70) {
      const mid = Math.min(W - 44, Math.max(44, (a + b) / 2))
      this.lo.setAttribute('text-anchor', 'middle')
      this.lo.setAttribute('x', String(mid))
      this.lo.textContent = `${fix(100 * v.pess)}% to ${fix(100 * v.opt)}%`
      this.hi.textContent = ''
      return
    }
    if (a - 4 < 34) {
      this.lo.setAttribute('text-anchor', 'start')
      this.lo.setAttribute('x', String(PAD))
    } else this.lo.setAttribute('text-anchor', 'end')
    if (b + 4 > W - 34) {
      this.hi.setAttribute('text-anchor', 'end')
      this.hi.setAttribute('x', String(W - PAD))
    } else this.hi.setAttribute('text-anchor', 'start')
  }
}

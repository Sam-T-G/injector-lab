import { critical, liquid, productProps, R_U, tSat, vaporCp, vaporMW } from './tables'

// Priem's one-dimensional droplet vaporization march (NACA TN 3985 Eqs 1-12), as specified in
// review B, S4-S5 (mode A, consistent with the Priem-Heidmann drop sizes):
//  - drag: Ingebo C_D = 27 Re^-0.84, Re clamped to 6-400 [TN 3762, sourced]
//  - heat and mass transfer: Ranz-Marshall Nu and Sh, Stefan factor on mass, blowing factor on heat
//  - film properties at the 1/3 reference temperature; unit Lewis number
//  - gas speed proportional to the total mass vaporized so far (both propellants: judgment)
// Simplification: film transport properties are those of the combustion products at the reference
// temperature; the vapor enters only through its molar mass and heat capacity.

export type PropKey = 'lox' | 'ethanol'

export interface MarchStream {
  key: PropKey
  /** Mass flow of this propellant, kg/s. */
  mdot: number
  /** Injection velocity, m/s. */
  U0: number
  /** Injection temperature, K. */
  T0: number
  /** Initial radii of equal-mass drop groups, m. */
  radii: number[]
}

export interface MarchIn {
  streams: MarchStream[]
  pcBar: number
  /** O/F used for the film (products) properties. */
  of: number
  /** Gas temperature far from the drop, K. */
  Tinf: number
  /** Gas speed when everything has vaporized, m/s. */
  uFin: number
  /** Mass flow that makes uFin, kg/s (usually the sum of the streams). */
  mdotGas: number
  /** Distance to march, m. */
  length: number
  /** Station spacing for the output, m. */
  sample: number
  /** Largest step, m. */
  dxMax?: number
}

export interface GroupTrace {
  r0: number
  r: Float64Array
  v: Float64Array
  T: Float64Array
  t: Float64Array
}

export interface StreamTrace {
  key: PropKey
  /** Vaporized mass fraction at each station. */
  F: Float64Array
  groups: GroupTrace[]
  /** Time for half the stream to vaporize, s, along the median group; NaN if not reached. */
  t50: number
  maxWe: number
  /** Breakup criterion (We > 12 for longer than the breakup time) met by some group. */
  breakupFlag: boolean
  reMin: number
  reMax: number
  /** Running maxima from the face to each station, so flags can be read at any chamber length. */
  weMaxAt: Float64Array
  reMaxAt: Float64Array
  /** Largest Spalding transfer number B_T = cp_v (T_inf - T_l) / h_fg seen by a live drop. */
  bTMaxAt: Float64Array
  /** First station where the breakup criterion was met; Infinity if never. */
  breakupStation: number
}

/** Time for half the stream to vaporize, read along the median group, within the first k stations. */
export function t50Within(tr: StreamTrace, k: number): number {
  for (let j = 1; j <= k && j < tr.F.length; j++) {
    if (tr.F[j - 1]! < 0.5 && tr.F[j]! >= 0.5) {
      const a = (0.5 - tr.F[j - 1]!) / (tr.F[j]! - tr.F[j - 1]!)
      const mid = tr.groups[Math.floor(tr.groups.length / 2)]!
      return mid.t[j - 1]! + a * (mid.t[j]! - mid.t[j - 1]!)
    }
  }
  return NaN
}

export interface MarchOut {
  x: Float64Array
  u: Float64Array
  streams: StreamTrace[]
  steps: number
}

const DEAD = 1e-6 // fraction of initial mass below which a group counts as vaporized

interface Group {
  s: number // stream index
  m0: number
  nDot: number // drops per second
  key: PropKey
  Tcap: number
}

interface Rates {
  dv: number
  dT: number
  dm: number
  dt: number
  tauV: number
  tauM: number
  tauT: number
  re: number
  we: number
  bT: number
  tb: number
}

const sphereMass = (r: number, rho: number) => (4 / 3) * Math.PI * r * r * r * rho

export interface DropEnv {
  /** Chamber pressure, Pa. */
  P: number
  pcBar: number
  of: number
  Tinf: number
  /** Far-field gas density for the Weber number, kg/m^3. */
  rhoFar: number
}

export interface DropRates {
  r: number
  mdotE: number
  dTdt: number
  dvdt: number
  re: number
  we: number
  bT: number
  /** Drag, heat-up time scales and breakup time, s. */
  tauV: number
  tauT: number
  tb: number
}

/** Time rates for one drop of mass m (kg) at liquid temperature T (K) and slip w = u - v (m/s). */
export function dropRates(key: PropKey, m: number, T: number, w: number, Tcap: number, e: DropEnv): DropRates {
  const Tl = Math.min(T, Tcap)
  const liq = liquid(key, Tl)
  const r = Math.cbrt((3 * m) / (4 * Math.PI * liq.rho))
  const Tref = Tl + (e.Tinf - Tl) / 3
  const film = productProps(e.pcBar, e.of, Tref)
  const rhoRef = (e.P * (film.MW / 1000)) / (R_U * Tref)
  const reRaw = (2 * r * rhoRef * Math.abs(w)) / film.mu
  const cd = 27 * Math.pow(Math.min(400, Math.max(6, reRaw)), -0.84)
  const pr = (film.cp * film.mu) / film.k
  const nu = 2 + 0.6 * Math.cbrt(pr) * Math.sqrt(reRaw)
  const sh = nu // unit Lewis number: Sc = Pr
  const D = film.k / (film.cp * rhoRef)
  const rhoV = (e.P * (vaporMW(key) / 1000)) / (R_U * Tref)
  const h = (film.k * nu) / (2 * r)
  const area = 4 * Math.PI * r * r
  const cpv = vaporCp(key, Tref)
  const heat = (mdotE: number) => {
    const zeta = (mdotE * cpv) / (area * h)
    const Z = zeta < 1e-8 ? 1 - zeta / 2 : zeta / Math.expm1(zeta)
    return area * h * (e.Tinf - Tl) * Z
  }
  let mdotE: number
  let dTdt: number
  if (T >= Tcap) {
    // Boiling: the heat that arrives goes into vaporization at the saturation temperature.
    // m = q(m)/h_fg with the blowing factor has the closed form m = (A h / cp_v) ln(1 + B_T);
    // fixed-point iteration diverges for the large B_T of LOX in hot gas.
    mdotE = ((area * h) / cpv) * Math.log1p((cpv * (e.Tinf - Tl)) / Math.max(liq.hvap, 1))
    dTdt = 0
  } else {
    const ps = Math.min(liq.psat, 0.999 * e.P)
    mdotE = 2 * Math.PI * r * sh * D * rhoV * Math.log(e.P / (e.P - ps))
    dTdt = (heat(mdotE) - mdotE * liq.hvap) / (m * liq.cp)
  }
  return {
    r,
    mdotE,
    dTdt,
    dvdt: (0.375 * cd * (rhoRef / liq.rho) * w * Math.abs(w)) / r,
    re: reRaw,
    we: liq.sigma > 0 ? (e.rhoFar * w * w * 2 * r) / liq.sigma : Infinity,
    bT: (cpv * (e.Tinf - Tl)) / Math.max(liq.hvap, 1),
    tauV: (r * liq.rho) / (0.75 * cd * rhoRef * Math.abs(w) + 1e-30),
    tauT: (m * liq.cp) / (area * h),
    tb: ((5 * (2 * r)) / (Math.abs(w) + 1e-30)) * Math.sqrt(liq.rho / e.rhoFar),
  }
}

export function march(p: MarchIn): MarchOut {
  const P = p.pcBar * 1e5
  for (const s of p.streams) {
    if (P >= critical(s.key).p) throw new RangeError(`chamber pressure is above the critical pressure of ${s.key}`)
  }
  const groups: Group[] = []
  const state: number[] = [] // per group: v, T, m, t
  p.streams.forEach((s, si) => {
    const rho0 = liquid(s.key, s.T0).rho
    const share = s.mdot / s.radii.length
    for (const r of s.radii) {
      const m0 = sphereMass(r, rho0)
      groups.push({ s: si, m0, nDot: share / m0, key: s.key, Tcap: tSat(s.key, 0.99 * P) })
      state.push(s.U0, s.T0, m0, 0)
    }
  })
  const nG = groups.length
  const vMin = p.streams.map((s) => 0.05 * s.U0)
  const gasSpeed = (y: ArrayLike<number>) => {
    let vap = 0
    for (let g = 0; g < nG; g++) vap += groups[g]!.nDot * (groups[g]!.m0 - Math.max(0, y[4 * g + 2]!))
    return (p.uFin * vap) / p.mdotGas
  }

  // Chamber gas density for the Weber number uses the products at Tinf.
  const far = productProps(p.pcBar, p.of, p.Tinf)
  const rhoFar = (P * (far.MW / 1000)) / (R_U * p.Tinf)

  const env: DropEnv = { P, pcBar: p.pcBar, of: p.of, Tinf: p.Tinf, rhoFar }
  const rates = (g: Group, v: number, T: number, m: number, u: number, out: Rates) => {
    if (m <= DEAD * g.m0) {
      out.dv = out.dT = out.dm = 0
      out.dt = 1 / Math.max(v, 1e-9)
      out.tauV = out.tauM = out.tauT = Infinity
      out.re = out.we = out.bT = 0
      out.tb = Infinity
      return
    }
    const d = dropRates(g.key, m, T, u - v, g.Tcap, env)
    const vv = Math.max(v, vMin[g.s]!)
    out.dt = 1 / vv
    out.dv = d.dvdt / vv
    out.dT = d.dTdt / vv
    out.dm = -d.mdotE / vv
    out.tauV = d.tauV
    out.tauM = m / (d.mdotE + 1e-30)
    out.tauT = d.tauT
    out.re = d.re
    out.we = d.we
    out.bT = d.bT
    out.tb = d.tb
  }

  const nS = Math.floor(p.length / p.sample + 1e-9) + 1
  const xs = new Float64Array(nS)
  const us = new Float64Array(nS)
  const traces: StreamTrace[] = p.streams.map((s) => ({
    key: s.key,
    F: new Float64Array(nS),
    groups: s.radii.map((r0) => ({ r0, r: new Float64Array(nS), v: new Float64Array(nS), T: new Float64Array(nS), t: new Float64Array(nS) })),
    t50: NaN,
    maxWe: 0,
    breakupFlag: false,
    reMin: Infinity,
    reMax: 0,
    weMaxAt: new Float64Array(nS),
    reMaxAt: new Float64Array(nS),
    bTMaxAt: new Float64Array(nS),
    breakupStation: Infinity,
  }))
  const bTMax = new Float64Array(p.streams.length)
  const weTime = new Float64Array(nG)

  const record = (k: number, x: number, y: number[]) => {
    xs[k] = x
    us[k] = gasSpeed(y)
    const groupIndex = new Array(p.streams.length).fill(0)
    const vapBy = new Array(p.streams.length).fill(0)
    for (let g = 0; g < nG; g++) {
      const G = groups[g]!
      const m = Math.max(0, y[4 * g + 2]!)
      vapBy[G.s] += G.nDot * (G.m0 - m)
      const tr = traces[G.s]!.groups[groupIndex[G.s]++]!
      const T = Math.min(y[4 * g + 1]!, G.Tcap)
      tr.r[k] = m > DEAD * G.m0 ? Math.cbrt((3 * m) / (4 * Math.PI * liquid(G.key, T).rho)) : 0
      tr.v[k] = y[4 * g]!
      tr.T[k] = T
      tr.t[k] = y[4 * g + 3]!
    }
    p.streams.forEach((s, si) => {
      const tr = traces[si]!
      tr.F[k] = Math.min(1, vapBy[si] / s.mdot)
      tr.weMaxAt[k] = tr.maxWe
      tr.reMaxAt[k] = tr.reMax
      tr.bTMaxAt[k] = bTMax[si]!
    })
  }

  const y = state.slice()
  const k1 = new Array(4 * nG).fill(0)
  const k2 = k1.slice()
  const k3 = k1.slice()
  const k4 = k1.slice()
  const tmp = k1.slice()
  const r = { dv: 0, dT: 0, dm: 0, dt: 0, tauV: 0, tauM: 0, tauT: 0, re: 0, we: 0, bT: 0, tb: 0 }
  const r2 = { ...r }

  const deriv = (yy: ArrayLike<number>, out: number[]) => {
    const u = gasSpeed(yy)
    for (let g = 0; g < nG; g++) {
      rates(groups[g]!, yy[4 * g]!, yy[4 * g + 1]!, Math.max(0, yy[4 * g + 2]!), u, r)
      out[4 * g] = r.dv
      out[4 * g + 1] = r.dT
      out[4 * g + 2] = r.dm
      out[4 * g + 3] = r.dt
    }
  }

  let x = 0
  let k = 0
  let steps = 0
  record(0, 0, y)
  const dxMax = p.dxMax ?? 2.5e-4
  while (k < nS - 1) {
    const target = (k + 1) * p.sample
    // Step limit from the fastest drag, mass and heat time scales of the live groups.
    const u = gasSpeed(y)
    let lim = dxMax
    for (let g = 0; g < nG; g++) {
      const G = groups[g]!
      const m = y[4 * g + 2]!
      if (m <= DEAD * G.m0) continue
      rates(G, y[4 * g]!, y[4 * g + 1]!, m, u, r)
      const v = Math.max(y[4 * g]!, vMin[G.s]!)
      lim = Math.min(lim, 0.3 * v * Math.min(r.tauV, r.tauT), 0.2 * v * r.tauM)
      // Temperature stiffness: near saturation the vapor pressure makes dT/dt very steep in T.
      const Tg = y[4 * g + 1]!
      if (Tg + 0.05 < G.Tcap) {
        rates(G, y[4 * g]!, Tg + 0.05, m, u, r2)
        const J = Math.abs((r2.dT - r.dT) / 0.05) // per metre
        if (J > 0) lim = Math.min(lim, 0.5 / J)
      }
      bTMax[G.s] = Math.max(bTMax[G.s]!, r.bT)
      const tr = traces[G.s]!
      tr.reMin = Math.min(tr.reMin, r.re)
      tr.reMax = Math.max(tr.reMax, r.re)
      if (r.we > tr.maxWe) tr.maxWe = r.we
    }
    const hStep = Math.max(2e-6, Math.min(lim, target - x))
    deriv(y, k1)
    for (let i = 0; i < y.length; i++) tmp[i] = y[i]! + 0.5 * hStep * k1[i]!
    deriv(tmp, k2)
    for (let i = 0; i < y.length; i++) tmp[i] = y[i]! + 0.5 * hStep * k2[i]!
    deriv(tmp, k3)
    for (let i = 0; i < y.length; i++) tmp[i] = y[i]! + hStep * k3[i]!
    deriv(tmp, k4)
    for (let i = 0; i < y.length; i++) y[i] = y[i]! + (hStep / 6) * (k1[i]! + 2 * k2[i]! + 2 * k3[i]! + k4[i]!)
    for (let g = 0; g < nG; g++) {
      const G = groups[g]!
      if (y[4 * g + 2]! <= DEAD * G.m0) y[4 * g + 2] = 0
      if (y[4 * g + 1]! > G.Tcap) y[4 * g + 1] = G.Tcap
      if (y[4 * g]! < vMin[G.s]!) y[4 * g] = vMin[G.s]!
      // Breakup bookkeeping (flag only in mode A).
      if (y[4 * g + 2]! > 0) {
        rates(G, y[4 * g]!, y[4 * g + 1]!, y[4 * g + 2]!, gasSpeed(y), r)
        if (r.we > 12) {
          weTime[g] = weTime[g]! + hStep / Math.max(y[4 * g]!, 1e-9)
          if (weTime[g]! > r.tb && !traces[G.s]!.breakupFlag) {
            traces[G.s]!.breakupFlag = true
            traces[G.s]!.breakupStation = k + 1
          }
        } else weTime[g] = 0
      }
    }
    x += hStep
    steps++
    if (x >= target - 1e-12) {
      k++
      x = target
      record(k, x, y)
    }
  }

  // Time to half vaporized, read along the median group.
  traces.forEach((tr) => (tr.t50 = t50Within(tr, nS - 1)))
  return { x: xs, u: us, streams: traces, steps }
}

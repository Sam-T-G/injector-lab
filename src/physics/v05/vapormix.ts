// Vapor mixing across the chamber section (review C, M2-M6).
// Each propellant's vapor mass flux g(x, y, z) obeys dg/dx = kappa(x) lap(g) + sources, solved by
// explicit finite volumes on a square grid clipped to the chamber circle, with zero flux through
// the wall. kappa(x) = i^2 Lambda (1 - exp(-x/Lambda)) from Taylor (1922) dispersion [derived;
// values of i and Lambda are a sweep, not calibrated]. Sources come from the droplet march.

export interface VaporHole {
  prop: 'ox' | 'fuel'
  x: number
  y: number
  mdot: number
  d: number
  /** Intact-core length, m; null treated as longer than the chamber. */
  coreLength: number | null
  /** Spray half-angle after breakup, rad. */
  halfAngle: number
}

export interface MixIn {
  holes: VaporHole[]
  /** Fuel-fraction range covered by CEA; outside it c* is interpolated to the cold-gas ends. */
  ceaRange?: [number, number]
  R: number
  /** Cells across the diameter. */
  n: number
  /** Turbulence intensity u'/U. */
  i: number
  /** Lagrangian length scale, m. */
  Lambda: number
  /** Stations from the march (uniform spacing, starting at 0). */
  x: Float64Array
  F: { ox: Float64Array; fuel: Float64Array }
  /** c* over fuel mass fraction, for the stream-tube sums. */
  cstar: { f: Float64Array; cstar: Float64Array }
  /** Injected fuel mass fraction 1/(1 + O/F). */
  fInj: number
  /** Width of the wall annulus for the wall-zone O/F, m. */
  wallBand: number
  /** Station indices whose fields are kept for drawing. */
  keep?: number[]
}

export interface MixOut {
  x: Float64Array
  etaVap: Float64Array
  /** Stream-tube mixing efficiency on the vapor, against c* at the vapor's own mean f. */
  etaMix: Float64Array
  /** eta_vap times the stream-tube sum against c* at the injected f (ROCCID Eqs 2.7-2.9). */
  etaCstar: Float64Array
  /** Rupe mixing efficiency E_m. */
  Em: Float64Array
  /** Danckwerts intensity of segregation. */
  Is: Float64Array
  /** O/F of the vapor in the wall annulus. */
  ofWall: Float64Array
  /** Largest relative mass-balance error over all stations and both propellants. */
  massError: number
  /** Largest error between the field's mean fuel fraction and the vaporized-fuel ratio (C M9). */
  compositionError: number
  /** Share of vapor mass in cells whose fuel fraction lies outside the CEA table (c* interpolated to the cold-gas ends). */
  gapMass: Float64Array
  fields: { index: number; ox: Float32Array; fuel: Float32Array }[]
  n: number
}

// Abramowitz & Stegun 7.1.26, |error| < 1.5e-7.
function erf(x: number): number {
  const s = Math.sign(x)
  const a = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * a)
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)
  return s * y
}
const Phi = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2))

function cstarAt(c: { f: Float64Array; cstar: Float64Array }, f: number): number {
  const n = c.f.length
  if (f <= c.f[0]!) return c.cstar[0]!
  if (f >= c.f[n - 1]!) return c.cstar[n - 1]!
  let lo = 0
  let hi = n - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (c.f[mid]! <= f) lo = mid
    else hi = mid
  }
  const t = (f - c.f[lo]!) / (c.f[lo + 1]! - c.f[lo]!)
  return c.cstar[lo]! + t * (c.cstar[lo + 1]! - c.cstar[lo]!)
}

/** Lateral width of the liquid/drop cloud of one hole at distance x (review C, M2). */
export function liquidSigma(h: VaporHole, x: number): number {
  const s0 = h.d / 4
  if (h.coreLength === null || x <= h.coreLength) return s0
  return s0 + 0.5 * (x - h.coreLength) * Math.tan(h.halfAngle)
}

export function mixVapor(p: MixIn): MixOut {
  const { n, R } = p
  const h = (2 * R) / n
  const N = n * n
  const centers = new Float64Array(n)
  for (let k = 0; k < n; k++) centers[k] = -R + (k + 0.5) * h
  const active = new Uint8Array(N)
  const index = new Int32Array(N).fill(-1)
  const cells: number[] = []
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++)
      if (centers[i]! * centers[i]! + centers[j]! * centers[j]! <= R * R) {
        active[j * n + i] = 1
        index[j * n + i] = cells.length
        cells.push(j * n + i)
      }
  const M = cells.length
  // Neighbor lists in active-cell numbering; inactive neighbors carry no flux.
  const nbStart = new Int32Array(M + 1)
  const nb: number[] = []
  for (let c = 0; c < M; c++) {
    nbStart[c] = nb.length
    const k = cells[c]!
    const i = k % n
    const j = (k - i) / n
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const ii = i + di
      const jj = j + dj
      if (ii < 0 || jj < 0 || ii >= n || jj >= n) continue
      const q = index[jj * n + ii]!
      if (q >= 0) nb.push(q)
    }
  }
  nbStart[M] = nb.length
  const nbArr = Int32Array.from(nb)
  const rCell = new Float64Array(M)
  for (let c = 0; c < M; c++) {
    const k = cells[c]!
    rCell[c] = Math.hypot(centers[k % n]!, centers[(k - (k % n)) / n]!)
  }

  // Source weights per hole, erf-integrated over cells and renormalized over active cells.
  const weights = (hole: VaporHole, sigma: number) => {
    const idx: number[] = []
    const w: number[] = []
    const span = 5 * sigma + h
    let sum = 0
    for (let c = 0; c < M; c++) {
      const k = cells[c]!
      const cx = centers[k % n]!
      const cy = centers[(k - (k % n)) / n]!
      if (Math.abs(cx - hole.x) > span || Math.abs(cy - hole.y) > span) continue
      const wx = Phi((cx + h / 2 - hole.x) / sigma) - Phi((cx - h / 2 - hole.x) / sigma)
      const wy = Phi((cy + h / 2 - hole.y) / sigma) - Phi((cy - h / 2 - hole.y) / sigma)
      const v = wx * wy
      if (v > 0) {
        idx.push(c)
        w.push(v)
        sum += v
      }
    }
    if (sum <= 0) {
      // The hole sits outside every active cell center's reach: put it in the nearest active cell.
      let best = 0
      let bd = Infinity
      for (let c = 0; c < M; c++) {
        const k = cells[c]!
        const d2 = (centers[k % n]! - hole.x) ** 2 + (centers[(k - (k % n)) / n]! - hole.y) ** 2
        if (d2 < bd) {
          bd = d2
          best = c
        }
      }
      return { idx: Int32Array.from([best]), w: Float64Array.from([1]) }
    }
    return { idx: Int32Array.from(idx), w: Float64Array.from(w, (v) => v / sum) }
  }

  const holesBy = { ox: p.holes.filter((q) => q.prop === 'ox'), fuel: p.holes.filter((q) => q.prop === 'fuel') }
  const mdotBy = { ox: holesBy.ox.reduce((s, q) => s + q.mdot, 0), fuel: holesBy.fuel.reduce((s, q) => s + q.mdot, 0) }
  const g = { ox: new Float64Array(M), fuel: new Float64Array(M) }
  const lap = new Float64Array(M)
  const S = p.x.length
  const out: MixOut = {
    x: p.x,
    etaVap: new Float64Array(S),
    etaMix: new Float64Array(S).fill(NaN),
    etaCstar: new Float64Array(S),
    Em: new Float64Array(S).fill(NaN),
    Is: new Float64Array(S).fill(NaN),
    ofWall: new Float64Array(S).fill(NaN),
    massError: 0,
    compositionError: 0,
    gapMass: new Float64Array(S),
    fields: [],
    n,
  }
  const keep = new Set(p.keep ?? [])
  const kappa = (x: number) => p.i * p.i * p.Lambda * (1 - Math.exp(-x / p.Lambda))
  const cInj = cstarAt(p.cstar, p.fInj)
  const srcW = new Map<VaporHole, { idx: Int32Array; w: Float64Array }>()
  const srcSigma = new Map<VaporHole, number>()

  const metrics = (j: number) => {
    const Fo = p.F.ox[j]!
    const Ff = p.F.fuel[j]!
    out.etaVap[j] = (mdotBy.ox * Fo + mdotBy.fuel * Ff) / (mdotBy.ox + mdotBy.fuel)
    let tot = 0
    let fsum = 0
    let mo = 0
    let mf = 0
    for (let c = 0; c < M; c++) {
      const G = g.ox[c]! + g.fuel[c]!
      tot += G
      fsum += g.fuel[c]!
      mo += g.ox[c]!
      mf += g.fuel[c]!
    }
    const A = h * h
    for (const [prop, mass] of [['ox', mo], ['fuel', mf]] as const) {
      const want = mdotBy[prop] * p.F[prop][j]!
      if (want > 1e-12) out.massError = Math.max(out.massError, Math.abs(mass * A - want) / want)
    }
    if (tot <= 0) return
    const fBar = fsum / tot
    const vapF = mdotBy.fuel * Ff
    const vapO = mdotBy.ox * Fo
    if (vapF + vapO > 0) out.compositionError = Math.max(out.compositionError, Math.abs(fBar - vapF / (vapF + vapO)))
    const RBar = 1 - fBar
    let em = 0
    let is = 0
    let cs = 0
    let wo = 0
    let wf = 0
    let gap = 0
    const [fLo, fHi] = p.ceaRange ?? [0, 1]
    for (let c = 0; c < M; c++) {
      const G = g.ox[c]! + g.fuel[c]!
      if (G <= 0) continue
      const w = G / tot
      const f = g.fuel[c]! / G
      const r = 1 - f
      em += r < RBar ? (w * (RBar - r)) / RBar : (w * (r - RBar)) / (1 - RBar)
      is += w * (f - fBar) * (f - fBar)
      cs += w * cstarAt(p.cstar, f)
      if (f < fLo || f > fHi) gap += w
      if (rCell[c]! > R - p.wallBand) {
        wo += g.ox[c]!
        wf += g.fuel[c]!
      }
    }
    // With only one propellant present, E_m and I_s have no meaning.
    out.Em[j] = fBar > 0 && fBar < 1 ? 1 - em : NaN
    out.Is[j] = fBar > 0 && fBar < 1 ? is / (fBar * (1 - fBar)) : NaN
    out.etaMix[j] = cs / cstarAt(p.cstar, fBar)
    out.etaCstar[j] = (out.etaVap[j]! * cs) / cInj
    out.ofWall[j] = wf > 0 ? wo / wf : wo > 0 ? Infinity : NaN
    out.gapMass[j] = gap
  }

  const snapshot = (j: number) => {
    const ox = new Float32Array(N)
    const fuel = new Float32Array(N)
    for (let c = 0; c < M; c++) {
      ox[cells[c]!] = g.ox[c]!
      fuel[cells[c]!] = g.fuel[c]!
    }
    out.fields.push({ index: j, ox, fuel })
  }

  metrics(0)
  if (keep.has(0)) snapshot(0)
  for (let j = 1; j < S; j++) {
    const x0 = p.x[j - 1]!
    const x1 = p.x[j]!
    const span = x1 - x0
    // Refresh source weights where a hole's cloud width has changed by more than 10%.
    for (const hole of p.holes) {
      const sig = Math.max(liquidSigma(hole, 0.5 * (x0 + x1)), 1e-6)
      const old = srcSigma.get(hole)
      if (old === undefined || Math.abs(sig - old) > 0.1 * old) {
        srcW.set(hole, weights(hole, sig))
        srcSigma.set(hole, sig)
      }
    }
    const kMax = Math.max(kappa(x1), 1e-12)
    const sub = Math.max(1, Math.ceil(span / ((0.9 * h * h) / (4 * kMax))))
    const dxs = span / sub
    for (let s = 0; s < sub; s++) {
      const kh = (kappa(x0 + (s + 0.5) * dxs) * dxs) / (h * h)
      for (const prop of ['ox', 'fuel'] as const) {
        const fld = g[prop]
        for (let c = 0; c < M; c++) {
          let acc = 0
          const v = fld[c]!
          for (let q = nbStart[c]!; q < nbStart[c + 1]!; q++) acc += fld[nbArr[q]!]! - v
          lap[c] = acc
        }
        for (let c = 0; c < M; c++) fld[c] = fld[c]! + kh * lap[c]!
        // Vapor released over this substep, spread evenly through the interval.
        const dm = (p.F[prop][j]! - p.F[prop][j - 1]!) / sub
        if (dm > 0) {
          for (const hole of holesBy[prop]) {
            const sw = srcW.get(hole)!
            const add = (hole.mdot * dm) / (h * h)
            for (let q = 0; q < sw.idx.length; q++) fld[sw.idx[q]!] = fld[sw.idx[q]!]! + add * sw.w[q]!
          }
        }
      }
    }
    metrics(j)
    if (keep.has(j)) snapshot(j)
  }
  return out
}

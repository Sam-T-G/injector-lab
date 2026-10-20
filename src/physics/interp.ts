/** Index i and weight t such that x lies between xs[i] and xs[i+1]; clamps at the ends. */
export function bracket(xs: ArrayLike<number>, x: number): { i: number; t: number; clamped: boolean } {
  const n = xs.length
  if (n < 2) throw new RangeError('need at least two grid points')
  if (x <= xs[0]!) return { i: 0, t: 0, clamped: x < xs[0]! }
  if (x >= xs[n - 1]!) return { i: n - 2, t: 1, clamped: x > xs[n - 1]! }
  let lo = 0
  let hi = n - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (xs[mid]! <= x) lo = mid
    else hi = mid
  }
  return { i: lo, t: (x - xs[lo]!) / (xs[lo + 1]! - xs[lo]!), clamped: false }
}

export function lerp1(xs: ArrayLike<number>, ys: ArrayLike<number>, x: number): number {
  const { i, t } = bracket(xs, x)
  return ys[i]! + t * (ys[i + 1]! - ys[i]!)
}

/** Values of a range, inclusive of max within floating-point slack. */
export function steps(min: number, max: number, step: number): number[] {
  const out: number[] = []
  const n = Math.floor((max - min) / step + 1e-9)
  for (let k = 0; k <= n; k++) out.push(Math.round((min + k * step) * 1e9) / 1e9)
  return out
}

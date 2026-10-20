// Number gauge drills #1-#80 in inches (ANSI/ASME B94.11M, as listed on
// Wikipedia "Drill bit sizes", checked 2026-10-19).
const NUMBER_IN = [
  0.228, 0.221, 0.213, 0.209, 0.2055, 0.204, 0.201, 0.199, 0.196, 0.1935, 0.191, 0.189, 0.185, 0.182, 0.18, 0.177,
  0.173, 0.1695, 0.166, 0.161, 0.159, 0.157, 0.154, 0.152, 0.1495, 0.147, 0.144, 0.1405, 0.136, 0.1285, 0.12, 0.116,
  0.113, 0.111, 0.11, 0.1065, 0.104, 0.1015, 0.0995, 0.098, 0.096, 0.0935, 0.089, 0.086, 0.082, 0.081, 0.0785, 0.076,
  0.073, 0.07, 0.067, 0.0635, 0.0595, 0.055, 0.052, 0.0465, 0.043, 0.042, 0.041, 0.04, 0.039, 0.038, 0.037, 0.036,
  0.035, 0.033, 0.032, 0.031, 0.0292, 0.028, 0.026, 0.025, 0.024, 0.0225, 0.021, 0.02, 0.018, 0.016, 0.0145, 0.0135,
]

export interface Drill {
  name: string
  d: number
}

export const NUMBER_DRILLS: Drill[] = NUMBER_IN.map((inch, k) => ({ name: `#${k + 1}`, d: inch * 0.0254 }))

export const FRACTIONAL_DRILLS: Drill[] = Array.from({ length: 16 }, (_, k) => {
  const n = k + 1
  const g = gcd(n, 64)
  return { name: `${n / g}/${64 / g} in`, d: (n / 64) * 0.0254 }
})

export const METRIC_DRILLS: Drill[] = Array.from({ length: 115 }, (_, k) => {
  const mm = Math.round((0.3 + k * 0.05) * 100) / 100
  return { name: `${mm.toFixed(2)} mm`, d: mm / 1000 }
})

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a
}

export function nearest(list: readonly Drill[], d: number): Drill {
  let best = list[0]!
  for (const x of list) if (Math.abs(x.d - d) < Math.abs(best.d - d)) best = x
  return best
}

export const G0 = 9.80665

export function fix(x: number, d = 1): string {
  return Number.isFinite(x) ? x.toFixed(d) : '–'
}

export function pct(x: number, d = 0): string {
  return `${fix(100 * x, d)}%`
}

export function sci(x: number, d = 1): string {
  if (!Number.isFinite(x)) return '–'
  const [m, e] = x.toExponential(d).split('e')
  return `${m} × 10<sup>${Number(e)}</sup>`
}

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

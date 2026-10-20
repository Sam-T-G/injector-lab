import type { DesignPoint } from './physics'
import { DEFAULT_INPUTS05, type Inputs05 } from './physics/v05/types'

export type Mode = 'search' | 'point'

export interface AppState {
  inputs: Inputs05
  mode: Mode
  point: DesignPoint
}

export const DEFAULT_STATE: AppState = {
  inputs: DEFAULT_INPUTS05,
  mode: 'search',
  point: { pcBar: 27.5, lStarM: 1.25, dpFrac: 0.15 },
}

export function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T
}

/** JSON with object keys sorted, so equal states give equal strings. */
export function canonical(x: unknown): string {
  if (Array.isArray(x)) return `[${x.map(canonical).join(',')}]`
  if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>
    return `{${Object.keys(o)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`)
      .join(',')}}`
  }
  return JSON.stringify(x)
}

/** FNV-1a, 32 bit, as 8 hex digits. Identifies an input set in the title block. */
export function hashInputs(s: AppState): string {
  const str = canonical(s)
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): string {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

export function encodeState(s: AppState): string {
  return `#s=${toBase64Url(JSON.stringify(s))}`
}

/** Copy only keys the defaults have, with matching types, so a stale or edited link cannot inject shape changes. */
function mergeKnown<T>(base: T, patch: unknown): T {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return base
  const out = clone(base) as Record<string, unknown>
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    if (!(k in out)) continue
    const cur = out[k]
    if (cur && typeof cur === 'object' && !Array.isArray(cur)) out[k] = mergeKnown(cur, v)
    else if (Array.isArray(cur)) {
      if (Array.isArray(v) && v.length && v.every((x) => typeof x === 'number' && Number.isFinite(x))) out[k] = v
    } else if (typeof v === typeof cur && (typeof v !== 'number' || Number.isFinite(v))) out[k] = v
  }
  return out as T
}

export function decodeState(hash: string): AppState | null {
  const m = /^#s=([A-Za-z0-9_-]+)$/.exec(hash)
  if (!m) return null
  try {
    return mergeKnown(DEFAULT_STATE, JSON.parse(fromBase64Url(m[1]!)))
  } catch {
    return null
  }
}

export function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], obj)
}

export function setPath(obj: unknown, path: string, value: unknown): void {
  const keys = path.split('.')
  const last = keys.pop()!
  const target = keys.reduce<Record<string, unknown>>((o, k) => o[k] as Record<string, unknown>, obj as Record<string, unknown>)
  target[last] = value
}

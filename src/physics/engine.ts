import { combustion, type CeaTable } from './cea'
import { R_UNIVERSAL } from './defaults'
import type { EngineSize } from './types'

/**
 * v0.4 sizing: mdot = F / Isp_ideal(sea level), At = mdot c* / Pc, Ac = CR At,
 * Lc = L* At / Ac (cylinder only, no convergent volume). Ideal values throughout,
 * so a real engine with eta < 1 falls short on thrust and Pc (audit finding 3).
 */
export function sizeEngine(t: CeaTable, thrustN: number, pcBar: number, of: number, lStarM: number, cr: number): EngineSize {
  const comb = combustion(t, pcBar, of)
  const pc = pcBar * 1e5
  const mdot = thrustN / comb.IspSL
  const At = (mdot * comb.cstar) / pc
  const Ac = cr * At
  const rhoGas = pc / ((R_UNIVERSAL / comb.MW) * comb.Tc)
  const uGas = mdot / (rhoGas * Ac)
  const Lc = (lStarM * At) / Ac
  return {
    comb,
    mdot,
    mdotOx: (mdot * of) / (1 + of),
    mdotFuel: mdot / (1 + of),
    At,
    Dt: Math.sqrt((4 * At) / Math.PI),
    Ac,
    Dc: Math.sqrt((4 * Ac) / Math.PI),
    Lc,
    rhoGas,
    uGas,
    tRes: Lc / uGas,
  }
}

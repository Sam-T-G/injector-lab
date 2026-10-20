import { DEFAULT_INPUTS } from '../defaults'
import type { DesignInputs, Prop } from '../types'
import type { JetOut } from './jet'
import type { DropOut } from './drops'

export type Model = 'v0.5' | 'v0.4'
export type Mode05 = 'design' | 'analyze'

/** v0.5 inputs extend the v0.4 set, so one state object feeds either model. */
export interface Inputs05 extends DesignInputs {
  model: Model
  mode05: Mode05
  pcBar: number
  /** c* efficiency the hardware is sized for (review A S6). */
  etaDesign: number
  /** Lower edge of the efficiency band the chamber length must reach. */
  etaTarget: number
  lStarMinM: number
  lStarMaxM: number
  convergentDeg: number
  nozzleExitDeg: number
  /** Kinetic and boundary-layer losses as one factor on Cf. */
  etaKinBL: number
  /** Upper cap on injector pressure drop as a fraction of Pc. */
  dpCap: number
  feedMarginBar: number
  /** Turbulence intensities swept by the mixing model. */
  mixI: number[]
  /** Drop-size band as factors on the mass-median radius. */
  dropLo: number
  dropHi: number
  /** Throat curvature radius over throat radius. */
  throatCurvature: number
  wallTempK: number
  /** Film cooling or an ablative liner protects the wall. */
  wallProtected: boolean
  analyze: { dOxMm: number; dFuelMm: number; DtMm: number; DcMm: number; LcylMm: number }
}

export const DEFAULT_INPUTS05: Inputs05 = {
  ...DEFAULT_INPUTS,
  model: 'v0.5',
  mode05: 'design',
  pcBar: 27.5,
  etaDesign: 0.85,
  etaTarget: 0.8,
  lStarMinM: 0.5,
  lStarMaxM: 3,
  convergentDeg: 30,
  nozzleExitDeg: 15,
  etaKinBL: 0.98,
  dpCap: 0.4,
  feedMarginBar: 0,
  mixI: [0.02, 0.05, 0.1],
  dropLo: 0.5,
  dropHi: 2,
  throatCurvature: 1,
  wallTempK: 600,
  wallProtected: false,
  // CAD hole sizes snapped to their drills (#54, #56) and the v0.4 chamber.
  analyze: { dOxMm: 1.397, dFuelMm: 1.181, DtMm: 23.0, DcMm: 51.4, LcylMm: 250 },
}

export interface Side05 {
  prop: Prop
  holes: number
  d: number
  L: number
  U: number
  cd: number
  re: number
  mdot: number
  dp: number
  dpMax: number
  inletRequired: number
  manifoldLoss: number
  boreD: number
  ringRadius: number
  pitch: number
  pVenaContracta: number
  cavitates: boolean
  rho: number
  jet: JetOut
  drops: DropOut
  t50: number
  maxWe: number
  breakup: boolean
  reRange: [number, number]
  bTMax: number
}

export interface OperatingPoint {
  eta: number
  pcBar: number
  mdotOx: number
  mdotFuel: number
  of: number
  thrustN: number
  ispS: number
  dpOverPcOx: number
  dpOverPcFuel: number
}

export interface Band {
  lo: number
  mid: number
  hi: number
}

export interface Curve {
  x: number[]
  lo: number[]
  mid: number[]
  hi: number[]
  vapOx: number[]
  vapFuel: number[]
  Em: number[]
  ofWall: number[]
}

export interface Field05 {
  x: number
  n: number
  R: number
  ox: Float32Array
  fuel: Float32Array
}

export interface Check05 {
  key: string
  label: string
  ok: boolean
  value: number
  limit: number
  unit: string
}

export interface Result05 {
  model: 'v0.5'
  mode: Mode05
  pcBar: number
  of: number
  comb: { cstar: number; Tc: number; gamma: number; MW: number; IspSL: number; eps: number; rho: number }
  etaCf: number
  geom: { At: number; Dt: number; Ac: number; Dc: number; Lconv: number; Vconv: number; LcylMax: number; Lcyl: number; lStar: number; Rface: number }
  mdot: number
  mdotOx: number
  mdotFuel: number
  pFaceBar: number
  uFin: number
  thetaG: number
  ox: Side05
  fuel: Side05
  curve: Curve
  /** Index in the curve where the chosen or given chamber ends. */
  at: number
  targetMet: boolean
  eta: Band
  isp: Band
  /** Built hardware at the band edges and centre (review A S7). */
  operating: OperatingPoint[]
  chug: { ox: { k: number; tauCrit: number }; fuel: { k: number; tauCrit: number }; tau: number }
  throat: { h: number; q: Band; Taw: number }
  wall: { outerProp: Prop; faceOF: number; vaporOF: { x: number; of: number }[] }
  nearCritical: { lox: number; ethanol: number }
  massError: number
  /** Largest share of vapor mass whose c* is interpolated beyond the CEA table, at the chosen length. */
  gapMass: number
  gapMassCentral: number
  /** Largest stream-tube mixing efficiency over the sweep at the chosen length; above 1 means a bug. */
  etaMixMax: number
  emRange: [number, number]
  /** Distance below which the near field is not modeled (C M4), m. */
  xNear: number
  checks: Check05[]
  feasible: boolean
  fields: Field05[]
  sweep: { drop: number; i: number; Lambda: number; etaAt: number }[]
  holes: { prop: Prop; x: number; y: number; d: number }[]
}

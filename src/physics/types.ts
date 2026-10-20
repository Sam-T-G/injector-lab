// The JSON contract between the physics library and everything else.
// The UI, the worker and the 3D scene read these shapes and nothing deeper.

export const SCHEMA_VERSION = 1

export type Prop = 'ox' | 'fuel'
export type Scenario = 'pessimistic' | 'nominal' | 'optimistic'
export const SCENARIOS: readonly Scenario[] = ['pessimistic', 'nominal', 'optimistic']

/** How the Gaussian spray tails that cross the chamber wall are handled. */
export type WallMode = 'truncate' | 'mirror'

export interface PropInputs {
  tempK: number
  inletMaxBar: number
  holes: number
  /** Ring radius as a fraction of the chamber radius. */
  ringRatio: number
  /** Angle of the first hole on the ring, degrees. */
  clockDeg: number
}

export interface Range3 {
  min: number
  max: number
  step: number
}

export interface DesignInputs {
  schema: typeof SCHEMA_VERSION
  pair: 'lox-ethanol'
  thrustN: number
  /** Mixture ratio O/F by mass. */
  of: number
  contractionRatio: number
  /** Largest body diameter the chamber and wall must fit in, mm. */
  maxDiameterMm: number
  /** Chamber wall allowance on each side, mm (port assumption). */
  wallMm: number
  /** Total injector thickness, mm. Hole length = thickness - manifold depth. */
  injectorThicknessMm: number
  manifoldDepthMm: number
  maxInjectorMassKg: number
  /** Injector body material density for the mass estimate, kg/m^3. */
  bodyDensity: number
  /** Radial margin of injector body beyond the chamber, mm (port assumption). */
  bodyMarginMm: number
  roughnessUm: number
  /** Feed bore design velocity, m/s. */
  manifoldVelocity: number
  /** Feed loss in dynamic heads. */
  manifoldLossHeads: number
  /** Contraction coefficient for the cavitation check. */
  contractionCoeff: number
  /** d^2-law evaporation constant, m^2/s. */
  vaporizationK: number
  /** Minimum hole pitch in hole diameters. */
  minPitchDiameters: number
  ox: PropInputs
  fuel: PropInputs
  grid: { pcBar: Range3; lStarM: Range3; dpFrac: Range3 }
  /** Delivered-Isp window for the tie-break, as a fraction of the best. */
  tieWindow: number
  wallMode: WallMode
  /** Clamp local O/F to the original 0.3-4.0 table range (v0.4 behavior). */
  clampLegacyOF: boolean
  /** Cap the stream-tube efficiency at 1 (v0.4 behavior). */
  capEtaMix: boolean
}

export interface DesignPoint {
  pcBar: number
  lStarM: number
  dpFrac: number
}

export interface Combustion {
  pcBar: number
  of: number
  cstar: number
  Tc: number
  MW: number
  gamma: number
  rho: number
  IspSL: number
  IspVac: number
  eps: number
  cp: number
  mu: number
}

export interface EngineSize {
  comb: Combustion
  mdot: number
  mdotOx: number
  mdotFuel: number
  At: number
  Dt: number
  Ac: number
  Dc: number
  Lc: number
  rhoGas: number
  uGas: number
  tRes: number
}

export interface LiquidState {
  key: string
  label: string
  T: number
  rho: number
  mu: number
  sigma: number
  psat: number
  cp: number
  k: number
  hvap: number
  Tcrit: number
  pcrit: number
}

export interface HoleFlow {
  d: number
  L: number
  v: number
  cd: number
  re: number
  mdot: number
}

export interface PropSide {
  prop: Prop
  liquid: LiquidState
  mdot: number
  holes: number
  hole: HoleFlow
  ringRadius: number
  clockDeg: number
  pitch: number
  boreD: number
  manifoldLoss: number
  dp: number
  inletRequired: number
  pVenaContracta: number
  cavitates: boolean
}

export interface Droplet {
  we: number
  lp: number
  m: number
  z: number
  threshold: number
  regime: 'atomization' | 'jet-breakup'
  primary: number
  cap: number
  capActive: boolean
  smd: number
  tanHalfAngle: number
  halfAngleDeg: number
  inFittedRange: boolean
}

export interface ScenarioProp {
  vRel: number
  drop: Droplet
  tau: number
  xv: number
  vaporized: number
  sigmaEnd: number
}

export interface MixingStats {
  capturedOx: number
  capturedFuel: number
  ofInside: number
  mixingIndex: number
  etaMixRaw: number
  etaMix: number
  bothPresentArea: number
  flammableArea: number
}

export interface ScenarioResult {
  scenario: Scenario
  ox: ScenarioProp
  fuel: ScenarioProp
  etaVap: number
  mixing: MixingStats
  eta: number
  ispDelivered: number
}

export interface Constraint {
  key: string
  label: string
  ok: boolean
  value: number
  limit: number
  unit: string
}

export interface PointResult {
  point: DesignPoint
  engine: EngineSize
  ox: PropSide
  fuel: PropSide
  injectorMassKg: number
  constraints: Constraint[]
  feasible: boolean
  scenarios: Partial<Record<Scenario, ScenarioResult>>
}

export interface SearchCell {
  point: DesignPoint
  feasible: boolean
  failed: string[]
  ispNominal: number | null
  etaNominal: number | null
}

export interface SearchResult {
  model: string
  axes: { pcBar: number[]; lStarM: number[]; dpFrac: number[] }
  cells: SearchCell[]
  bestIsp: number | null
  chosen: PointResult | null
  /** Search axes on which the chosen point sits at the scanned boundary. */
  onEdge: ('pcBar' | 'lStarM' | 'dpFrac')[]
}

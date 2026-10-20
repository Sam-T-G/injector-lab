import { SCHEMA_VERSION, type DesignInputs } from './types'

// The v0.4 default case as its author described it (1700 N, 35 bar inlets).
// Values marked "port assumption" are not in the description and were chosen
// so they do not bind at the default case.
export const DEFAULT_INPUTS: DesignInputs = {
  schema: SCHEMA_VERSION,
  pair: 'lox-ethanol',
  thrustN: 1700,
  of: 1.7,
  contractionRatio: 5,
  maxDiameterMm: 127,
  wallMm: 5, // port assumption
  injectorThicknessMm: 50.8,
  manifoldDepthMm: 29,
  maxInjectorMassKg: 3, // port assumption
  bodyDensity: 2700, // aluminum, port assumption
  bodyMarginMm: 15, // port assumption
  roughnessUm: 2,
  manifoldVelocity: 8,
  manifoldLossHeads: 1.5,
  contractionCoeff: 0.62,
  vaporizationK: 2e-6,
  minPitchDiameters: 3,
  ox: { tempK: 90.17, inletMaxBar: 35, holes: 12, ringRatio: 0.68, clockDeg: 15 },
  fuel: { tempK: 293.15, inletMaxBar: 35, holes: 12, ringRatio: 0.46, clockDeg: 0 },
  grid: {
    pcBar: { min: 10, max: 40, step: 2.5 },
    lStarM: { min: 0.5, max: 2.0, step: 0.25 },
    dpFrac: { min: 0.15, max: 0.4, step: 0.025 },
  },
  tieWindow: 0.01,
  wallMode: 'truncate',
  clampLegacyOF: true,
  capEtaMix: true,
}

export const G0 = 9.80665
export const R_UNIVERSAL = 8314.462618
export const OF_STOICH_LOX_ETHANOL = 96.0 / 46.069 // 3 O2 per C2H5OH by mass

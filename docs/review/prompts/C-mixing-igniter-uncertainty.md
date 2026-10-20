# Reviewer prompt C: mixing, igniter placement, uncertainty presentation

Follow `docs/review/prompts/_shared-rules.md`. Write to `docs/review/C-mixing-igniter-uncertainty.md`.

Scope: original items 4 and 8, plus item 9 within this scope. Pipeline steps 8-10 of the original prompt.

1. Critique the mixing model: Gaussian spray per hole, the sigma(x) spreading rule, the gas-jet spreading term after x_v, Danckwerts intensity of segregation, and the capped stream-tube c* efficiency. Confirm or refute finding 5 (mass leak through the wall, averaging in O/F instead of mixture fraction, "convex" vs concave).
2. Propose a better equation-level mixing model (no CFD) for a non-impinging two-ring showerhead: how sprays spread and merge, how to treat the chamber wall (for example mirror-image sources), how the mixing efficiency should be computed (Rupe's mixing efficiency E_m and its tie to c*, stream-tube in mixture-fraction space), and how mixing evolves with distance. Give equations and sources.
3. Igniter placement. Confirm or refute finding 8. What does a defensible, simple placement rule look like for a small LOX/ethanol engine (torch igniter through the face, spark plug in the wall, pyrotechnic)? What must be true at the igniter location during the start transient, and what can a steady-state model say, if anything?
4. Uncertainty and safety for a public web tool whose output may be used to build hardware: how should it show ranges, warnings and "not validated" labels? Which conditions should block a result outright, and which should only warn? What should every exported design carry (model version, assumptions, valid-range flags)?
5. Item 9 within this scope.

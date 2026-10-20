# Reviewer prompt A: efficiency method, search objective, validation

Follow `docs/review/prompts/_shared-rules.md`. Write to `docs/review/A-efficiency-objective-validation.md`.

Scope: original items 1, 3 and 7, plus item 9 within this scope.

1. Is "c* efficiency = vaporization efficiency x mixing efficiency" a defensible pre-hot-fire estimate? Name the standard methods (for example Priem-Heidmann vaporization-limited, Rupe mixing factor, stream-tube, the JANNAF energy-release split, NASA SP-8089, Huzel & Huang, Sutton). Give the equations and their valid ranges for LOX/ethanol or LOX/RP-1 showerhead, impinging and coaxial injectors. Say which one a 1700 N student engine tool should implement first.
2. Engine sizing: how should the sizing loop use an assumed efficiency (finding 3)? Give recommended L* and contraction-ratio ranges for LOX/ethanol and LOX/RP-1, with sources.
3. Search objective: is "maximize delivered Isp, then lowest Pc, shortest L*, smallest dP within 1%" a good objective? List missing constraints (injector stiffness or chugging margin, dP/Pc limits, heat flux, wall O/F, L*, contraction ratio, the efficiency vs chamber-length trade). Should Pc be a search output or an input? Propose a replacement (constraint set plus objective, or a feasibility map shown to the user).
4. Validation: list published hot-fire datasets with measured injector geometry, pressures and c* efficiency for small LOX/ethanol or LOX/RP-1 engines (NASA reports, theses, AIAA papers). Give the reference and what each one reports. Check that each exists online; drop any you cannot find. Explain how to calibrate the guessed constants (K, spreading factors) without overfitting: holdout cases, which constants to fit, and how many data points that takes.
5. Item 9 within this scope: anything else wrong, missing or misleading in the sizing, efficiency or search, ranked by effect on results.

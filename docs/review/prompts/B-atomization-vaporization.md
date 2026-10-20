# Reviewer prompt B: atomization, breakup and vaporization

Follow `docs/review/prompts/_shared-rules.md`. Write to `docs/review/B-atomization-vaporization.md`.

Scope: original item 2, plus item 9 within this scope. Pipeline steps 4-7 of the original prompt.

1. Primary breakup of low-speed (15-30 m/s) round LOX and ethanol jets from L/d 15-19 holes into chamber gas at 20-40 bar. Which regime are they in (Rayleigh, wind-induced, atomization; Ohnesorge and Weber maps such as Reitz 1978 or Lefebvre)? Which correlations for breakup length and initial drop size apply, and over what ranges? Are the Bayvel & Orzechowski correlations in steps 4-5 usable here at all?
2. Relative velocity for secondary breakup. Replace the pessimistic / nominal / optimistic guess. Specify a 1D droplet march down the chamber, equation by equation:
   - drag law: sphere drag coefficient versus Reynolds number, with source
   - evaporation: d²-law with a convective correction (for example Ranz-Marshall), Spalding transfer number, or a better model
   - gas velocity that grows with the vaporized fraction
   - secondary breakup criterion: critical Weber number and its source
   - the properties needed, and where gas-phase properties are evaluated (film temperature or reference-state rule)

   Say whether Priem & Heidmann (NASA TR R-67, 1960) is a better first implementation than a custom march, and what it needs as inputs.
3. Evaporation constants for LOX and ethanol droplets in combustion gas at 20-40 bar. Give values or ranges with sources, and note that both fluids are subcritical at these pressures (LOX Pc ~50 bar, ethanol Pc ~61 bar: check). What changes near or above the critical pressure?
4. Finding 1 (v_rel⁻⁴ sensitivity) and finding 2 (two clocks): confirm or refute with your own arithmetic at the default case (12 holes each, LOX 1.404 mm at 19.7 m/s, ethanol 1.210 mm at 22.6 m/s, Pc 27.5 bar, O/F 1.70, Lc 250 mm, chamber 51.5 mm).
5. Item 9 within this scope.

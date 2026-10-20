# Model v0.5: what changed from v0.4 and why

Built from the four reviews in `docs/review/`. Each line names the review section it implements. Labels follow the reviews: **sourced** (checked online by a reviewer), **rule of thumb**, **judgment**, **TBD**.

## Decisions where the reviews differ

- **Vaporization.** Review A prefers the Priem-Heidmann generalized-length chart (TR R-67), but the printed constants have unresolved unit and placement errors and the report is not online (A S3, B item 2). v0.5 uses Priem's published 1D droplet march (NACA TN 3985), as review B specifies. The R-67 chart stays a cross-check for when the report is in hand.
- **Mixing.** Review A says no showerhead mixing correlation exists and asks for a user band calibrated by hot fire (A S4). Review C gives a turbulent-diffusion model with a parameter sweep (C M4). v0.5 runs C's model across C's sweep and reports the band. The band, not a central value, is the output until hot-fire data calibrate it.

## Pipeline

1. **Sizing with Pc as an input** (A S6). A_t = F/(η_Cf C_F Pc), ṁ = Pc A_t/(η_c*,design c*). Default η_c*,design 0.85 [judgment, low]. L* counts the convergent volume (30° half-angle frustum). Face pressure Pc (1 + 0.54 CR^-2.2) [rule of thumb] enters the feed budget.
2. **Pressure drop** is the largest the feed budget allows, up to a user cap (A S12). Block ΔP/Pc < 0.15, warn < 0.20 [rule of thumb, SP-125 p. 128].
3. **Holes**: v0.4 orifice model, unchanged.
4. **Jet regime and core length** (B S2): Trettel 2020 Eqs 19, 24, 26 [sourced, medium]. Diagnostic only; warns when the core reaches past half the chamber.
5. **Drop sizes** (B S3): Priem-Heidmann parallel-jet mass-median radius, by-eye fit 93 µm (d/1 mm)^0.6 [TBD: digitize], Fang 1983 property correction [sourced], velocity correction (U/19.8)^-0.66 [judgment]. Five equal-mass groups, σ_g 2.3 [sourced]. Band: radius × 0.5 and × 2 [judgment].
6. **Vaporization march** (B S4, S5): Ingebo drag, Ranz-Marshall heat and mass transfer with Stefan and blowing corrections, gas speed proportional to vaporized mass, 1/3 reference state, unit Lewis number. Film properties from CEA equilibrium products at the reference temperature; vapor enters through its molar mass and heat capacity only [simplification].
7. **Vapor mixing** (C M2-M6): finite-volume turbulent diffusion of each propellant's vapor across the chamber section, zero flux at the wall, sources from the march. κ(x) = i² Λ (1 - e^(-x/Λ)) [Taylor 1922]. Sweep i ∈ {0.02, 0.05, 0.10}, Λ ∈ {smallest hole spacing, R_c} [judgment, low].
8. **Efficiency** (A S1, C M6): η_c* = η_vap Σ w c*(f)/c*(f_inj) on the vapor field, per station. No cap; mass balance asserted. Delivered Isp = η_c* η_Cf Isp_ideal, η_Cf = (1 + cos α)/2 × η_kin,BL (default 0.98) [sourced for the cone term].
9. **Band**: three drop sizes × six mixing settings. Shown as a range only.
10. **Chamber length**: one march and one mixing solve give efficiency along the whole chamber. The tool reports the shortest cylinder whose lower-band η_c* meets the user's target, and the curve.
11. **Checks**: chug screen (A S9), wall-zone O/F (A S10, C M6), throat heat flux band (A S11), near-critical guard (B S5), correlation ranges.
12. **Analyze mode** (A S7): fixed holes and throat, solve the operating point at the η band.

## Not modeled

Ignition (C M10: start requirements listed only), combustion instability beyond the chug screen, heat transfer to the injector, structure, manifold flow split, LOX boiling in a warm manifold.

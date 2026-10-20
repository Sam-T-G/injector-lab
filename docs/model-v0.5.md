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

## Verification so far

Tests in `tests/v05.test.ts`:

| Check | Source | Result |
|---|---|---|
| Five drop groups reproduce Priem's 25/48/75/120/225 µm | B S3, TN 3883 | within 4% |
| Property factor near 1 for n-heptane, the calibration fluid | B S3, Fang Eq 2 | 1.02 |
| Core length of the v0.4 LOX jet inside review B's 221-328 mm | B item 1 | 283 mm |
| d²-law reproduced in the boiling limit with no slip | B S7 | exact (1e-6) |
| LOX vaporized in 250 mm, TN 3883 oxygen curve as read by review B | B item 4 | 99.9 / 97.8 / 89.6% against about 99 / 96 / 85% for 79 / 110 / 200 µm |
| Mass closes in every mixing run | C M9 | below 1e-9 (about 1e-14) |
| E_m stays in 0-1 and rises with turbulence | C M6 | yes |
| Chug-screen ratios at ΔP/Pc 0.15-0.40 | A S9 table | 0.59 / 0.87 / 1.21 / 1.66 / 3.33 |
| Face-pressure rise at CR 5 and 3 | A S6 | 1.6% and 4.8% |
| Sized hardware at the design efficiency runs at the design Pc, thrust, O/F | A S6, S7 | within 0.5% |

| Mixing grid: 64 against 200 cells across the chamber, default case | review of the code, C M4 | band edges within 0.6 points; chosen length within 10 mm (2%) at a 30% target |
| Built engine at the design point when the pressure-drop cap binds | review of the code | within 0.5% |
| Vapor composition equals the vaporized-fuel ratio | C M9 | below 1e-9 |

Not yet done: the TN 3883 S8 case (300 psia, 243.8 m/s) against the digitized oxygen curve, the R-67 generalized-length cross-check, any comparison with hot-fire data (review A section 2.4 lists seven datasets).

## Known limits of the implementation

- The mixing grid is 64 cells across the chamber for the sweep, coarser than review C's h ≤ R_c/100, chosen for speed after the grid check above.
- κ(x) counts x from the face (C M4 as written). Vapor released far downstream gets the full eddy diffusivity at once; a Lagrangian picture would ramp from its release point. For the larger mixing length this likely makes the upper edge of the band optimistic.
- Drop sizes come from a by-eye fit to Fang 1983 Fig 27 (±20%) until the figure is digitized.
- Film transport properties are those of the combustion products; the vapor enters only through its molar mass and heat capacity.

## Default case (1700 N, 27.5 bar, O/F 1.70, 35 bar inlets)

- Sized for 85%: throat 23.42 mm, chamber 52.37 mm, mass flow 0.812 kg/s, holes 12 × 1.384 mm LOX and 12 × 1.183 mm ethanol, pressure drop 24% of Pc on both sides (the whole feed budget).
- c* efficiency band at L* 3.0 m: 32% to 99%. The low edge never reaches 80%, so the tool reports the longest chamber. Largest effects: turbulence intensity, then mixing length, then drop size.
- Ethanol limits vaporization: 78% vaporized at 250 mm, 90% at 586 mm. LOX is fully vaporized by about 230 mm.
- With LOX on the outer ring the wall sees oxidizer-rich vapor (O/F 4 to 150). Swapping the rings gives a fuel-rich wall (O/F 0.1 to 1.0) at no efficiency cost in this model.
- The CAD holes (#54, #56) in the v0.4 chamber run near 27.9 bar and O/F 1.74. The LOX cores outlast the 250 mm chamber and the chug screen fails (critical delay 1.61 ms against 1.7 ms for half the ethanol to vaporize).

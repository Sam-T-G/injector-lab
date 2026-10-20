# Review A: efficiency method, search objective, validation

Scope: original items 1, 3 and 7, plus item 9 within them. Audit findings 3, 4 and 7 are confirmed with numbers below; 1, 2 and 5 are confirmed where they touch efficiency; 6 and 10 are supported.

**Assumptions (hardware unknown).** Sea-level test stand; burns of 10 s or less in a heat-sink or ablative chamber; regulated pressure-fed tanks; "inlet pressure" is at the injector inlet ports; 15° conical nozzle; spark or torch igniter. [judgment]

**Source keys.** Opened online on 2026-10-19 unless marked.
- SP125: Huzel & Huang, *Design of Liquid Propellant Rocket Engines*, NASA SP-125, 2nd ed., 1971 (NTRS 19710019929). The 1992 AIAA revision was not checked.
- SP8089: Gill & Nurick, *Liquid Rocket Engine Injectors*, NASA SP-8089, 1976 (NTRS 19760023196).
- POW73: Powell, *Simplified Procedures for Correlation of Experimentally Measured and Predicted Thrust Chamber Performance*, JPL TM 33-548, 1973 (NTRS 19730012958); states the JANNAF reference methodology.
- TN4219: Heidmann & Priem, *Propellant Vaporization as a Criterion for Rocket Engine Design; Relation Between Percentage of Propellant Vaporized and Engine Performance*, NACA TN 4219, 1958.
- TRR67: Priem & Heidmann, *Propellant Vaporization as a Design Criterion for Rocket-Engine Combustion Chambers*, NASA TR R-67, 1960. Existence checked (library catalog, HathiTrust); text not read.
- FANG83: Fang, *LOX/Hydrocarbon Fuel Carbon Formation and Mixing Data Analysis*, NASA CR-168066, 1983, §V.A, App. F.
- CHP59: Clark, Hersch & Priem, NASA Memo 12-29-58E, 1959 (vaporization criterion; experimental performance with various propellant combinations).
- MICH83: Michel (Aerojet), *Combustion Performance and Heat Transfer Characterization of LOX/Hydrocarbon Type Propellants*, NASA CR-171713 (Vol. I) and CR-171712 (summary), 1983.
- FUK08: Fukuchi et al. (IHI Aerospace), *Non-Toxic Post Boost Stage Demonstration*, AJCPP 2008.
- BAI64: Bailey, *Performance and Stability of Rocket Engine Injectors Using LOX/RP-1 Propellants*, NASA TM X-53126, 1964.
- MAS88: Masters, Armstrong & Price, *High-Pressure Calorimeter Chamber Tests for LOX/RP-1 Rocket Combustion*, NASA TP-2862, 1988.
- ROB05: Robinson, Veith & Turpin, AIAA 2005-4457 (LOX/ethanol dual-thrust RCE).
- MAR25: Marchi et al., EUCASS 2025-402, doi 10.13009/EUCASS2025-402 (1 kN LOX/ethanol engine).
- HER61: Hersch, NASA TN D-129, 1961 (contraction ratio, GH2/LOX; abstract read).
- WS65: Wenzel & Szuch, *Analysis of Chugging in Liquid-Bipropellant Rocket Engines...*, NASA TN D-3080, 1965.
- RCEA: RocketCEA docs, "Finite Area Combustor".
- Existence only, via SP8089's reference list: Rupe, JPL PR 20-195 (1953) and 20-209 (1956); Pieper, CPIA 178 (1968); Combs, NASA CR-114462 (1972); Dickerson, Tate & Barsic, AFRPL-TR-68-147 (1968).

## 1. Three most serious problems

**1. The 99.5% figure comes from the guesses, and the formula behind it is incomplete.** The vaporization term rests on a guessed K, a guessed relative velocity and the gas residence time (audit findings 1 and 2 hold). It is not computed per propellant, yet the c* loss depends on which propellant stays liquid: for the four combinations analyzed, c* efficiency is 70-90% with half the fuel vaporized but about 60% with half the oxidizer vaporized (TN4219, summary) [checked online; high]. For a liquid/liquid showerhead no mixing correlation exists: mixing relies on combustion turbulence, the element "requires rather long chambers", and no design study relates injector variables to mixing (SP8089 §2.1.1.1.1, p. 16) [checked online; high]. Physically wrong: "delivered Isp = ideal Isp × efficiency" applies a c* efficiency to Isp and drops every nozzle loss; a 15° cone alone costs 1.7% (λ = 0.983, SP125 eq. 4-8) [checked online; high].

**2. The search rewards model artifacts and picks the least stable design.** Ideal sea-level Isp rises with Pc and the nominal efficiency saturates, so the search finds the highest Pc the inlet pressure allows at the smallest ΔP. 27.5 bar is the highest 2.5 bar grid point where 1.15·Pc plus the manifold loss (1.5 heads at 8 m/s: 0.55 bar for LOX) fits under 35 bar; 30 bar needs 35.05 bar [judgment: my arithmetic, assuming the budget is built this way; medium]. The grid and the inlet pressure set the answer, and the tie-break takes the scan-floor ΔP. SP-8089 says the opposite: make injection ΔP and orifice length "as large as possible within practical limits" to prevent low-frequency instability (§3.1.1.3, p. 82) [checked online; high]. In BAI64's coaxial gas-generator series, the one unstable run (1.51 MPa peak-to-peak chugging at 100 Hz) was the only one with low oxidizer ΔP [checked online; high]. Audit finding 4 holds. Wall mixture ratio is unconstrained, and LOX on the outer ring contradicts SP-8089's practice that a showerhead's outermost jets carry fuel (p. 82) [checked online; high]; audit finding 7 holds.

**3. Sizing uses ideal values, and nothing has been compared with hot-fire data.** At and ṁ come from ideal Isp and c* (audit finding 3 holds). At a true η_c* of 0.85 and fixed inlet pressure, the default hardware settles at Pc 26.4 bar, ṁ 0.751 kg/s (+13%), thrust about 1630 N (−4%) and Isp about 221 s instead of 260 s [judgment: my arithmetic, ideal orifices, constant Cf; medium]. No guessed constant has been fitted to a measurement.

## 2. Answers

### 2.1 Item 1: is η_c* = η_vap × η_mix defensible?

**The structure is; the v0.4 implementation is not.** JANNAF defines energy-release efficiency as the product of a vaporization efficiency and a mixture-ratio-distribution (stream-tube) efficiency (POW73 eqs. 18-20, p. 23) [checked online; high]. The product is exact when both use the same stream tubes. The full chain is Isp = [η_HL η_2D η_kin η_vap η_dist − Δη_BL]·Isp_ODE (POW73 eqs. 15-16) [checked online; high], meant for chambers where the boundary layer touches a small part of the flow (pp. 3-4); at a 23 mm throat, heat loss needs its own term. v0.4 uses one vaporized fraction, an uncalibrated mixing overlay, and no nozzle or heat-loss terms.

| Method | Gives | Status for LOX/ethanol at 1.7 kN |
|---|---|---|
| Correction factors (SP125 eqs. 1-39 to 1-41) | η_c* 0.87-1.03, η_Isp 0.85-0.98, η_Cf 0.92-1.00 | Production engines [checked online; high]; too wide to design with |
| Priem-Heidmann generalized length (TRR67; FANG83 eq. 1) | fraction vaporized per propellant | Same group's hot-fire data are ~890 N at 20.7 bar (CHP59), the right class; printed form has errors (S3) |
| TN4219 eqs. 3-5 | η_vap from vaporized fractions | Exact by definition [checked online; high] |
| Rupe E_m, stream tubes | η_dist, impinging elements | Reviewer D; not for showerheads |
| Showerhead mixing | none published | SP8089 p. 16 |
| DER code (Combs 1972), LISP (SP8089 ref. 98) | full spray combustion | SP8089 p. 76 says use JANNAF models before detailed design [checked online; high]; too heavy for v1 |

SP-8089 has no c* efficiency equation; Huzel & Huang give correction factors, L* and Bartz, not an injector model. Sutton & Biblarz (*Rocket Propulsion Elements*, ch. 3) cover the same correction factors [from memory: check; medium]. No published correlation covers a LOX/ethanol showerhead at 1.7 kN. Priem-Heidmann covers 1-99% vaporized and excludes flash vaporization (FANG83 §V) [checked online; high].

**Implement first:** the JANNAF chain (S1); per-propellant vaporization through TN4219 (S2); Priem-Heidmann for the fractions once verified against TR R-67 (S3); η_2D from nozzle geometry (S5); a user-set showerhead η_dist band that the first hot fires calibrate (S4). The Gaussian field stays as a wall diagnostic (S10). Reviewer B's droplet march replaces L_gen only after it reproduces the L_gen curve for the n-heptane reference.

### 2.2 Item 2: sizing with an assumed efficiency; L* and contraction ratio

**Sizing** takes a design efficiency as input, then reports what the built hardware does across the efficiency band (S6, S7). Default η_c*,design = 0.85 [judgment; low]. Nearby evidence: a 1 kN LOX/ethanol pintle was sized for 0.87 (MAR25) [checked online]; at 1.0 MPa a 36-element LOX/ethanol like-impinging injector beat a 12-element one by about 8% in c* efficiency (FUK08) [checked online; medium]. Replace the default with the first measured value.

**L*.** LOX/RP-1: 1.02-1.27 m (40-50 in) (SP125 Table 4-1, p. 87) [checked online; high]. L* of 0.38-3.0 m corresponds to stay times of 2-40 ms (p. 87) [checked online; high]. LOX/ethanol: no textbook value found; MAR25 chose 1.3 m as a design choice [checked online]. Since a showerhead needs long chambers (SP8089 p. 16), start at 1.25-2.0 m and build the chamber from a removable spool so L* is a test variable, as CHP59 and MICH83 did [judgment; low for the numbers, high for the spool]. Chamber volume runs from face to throat (SP125 p. 88) [checked online; high]; v0.4's Lc = L*·At/Ac counts the cylinder only, so with a 30° convergent the default chamber has L* = 1.32 m [judgment: my arithmetic; high].

**Contraction ratio.** Pressure-fed low-thrust engines have used 2-5 (SP125 p. 88) [checked online; high]. A small GH2/LOX chamber reached about 98% c* above CR 3 and lost c* sharply below it from poor mixing (HER61) [checked online; medium for liquids]. Face pressure exceeds Pc by P_face/Pc ≈ 1 + 0.54·CR^−2.2: 1.6% at CR 5, 4.8% at CR 3 (RCEA) [checked online; rule of thumb; medium]. Keep default 5; warn outside 3-8 [judgment; medium].

### 2.3 Item 3: search objective

**Not a good objective.** Maximizing ideal Isp × nominal η rewards where the model is most optimistic; the best of many noisy estimates is biased upward. Ideal Isp depends on Pc, so the search mostly chooses Pc. A 1% window is far narrower than the model's band (12.4-100%), so the tie-break ranks noise, and lowest Pc, shortest L* and smallest ΔP all reduce margin.

**Missing constraints:**
- Stiffness: ΔP_i/Pc ≥ 0.15 per propellant, warn below 0.20 (SP125 p. 128: 15-20% rule of thumb) [checked online; rule of thumb; medium], plus a chug screen (S9). At the default (ΔP/Pc 0.15, θ_g ≈ 1.85 ms) the screen tolerates a combustion dead time of only about 1.1 ms [judgment: my arithmetic; medium].
- Feed budget with face-pressure and manifold losses (S6).
- Wall-zone mixture ratio of the outer 10-15% of the mass, which "controls the heat-transfer rates to the wall" (SP8089 §3.1.1.1, p. 76) [checked online; high] (S10).
- Throat heat flux against a limit from cooling method and burn time (S11).
- L* and CR inside the efficiency model's calibrated range.
- The efficiency costs of chamber length and wall protection, shown as a trade: in LOX/RP-1 tests at 4.1-13.8 MPa, a fuel-rich outer zone cut throat heat flux 47% for a 4.5% c* efficiency loss (MAS88) [checked online; high].
- Scan-edge flags (audit finding 4).

**Pc is an input.** Its best value depends on tank mass, pressurant, cooling and structure, which the tool does not model, and maximizing Isp alone always pushes Pc to the inlet limit. Pc is an output only in Analyze mode, where fixed hardware and inlet pressures set it (S7; audit finding 6).

**Replacement (S12).** Given Pc, or a Pc range: enforce the constraints; take the largest ΔP/Pc the budget allows; take the shortest chamber whose lower-band η_c* meets the user's target; list designs within the η band width as ties. If none meets the target, say so and show two maps: (Pc, ΔP/Pc) shaded by binding constraint, and (L*, CR) with η band, throat heat flux and chamber length. Until calibration, that map plus a removable spool is the expected showerhead output.

### 2.4 Item 4: validation data and calibration

| Ref | Hardware | Reports | Use |
|---|---|---|---|
| CHP59 | 11 pairs incl. LOX/n-heptane; 890 N at 20.7 bar; CR 6.6; throat 20 mm; chambers 25, 76, 203 mm; fuel from two impinging 2.26 mm jets, other liquid from two rows of parallel 0.81 mm holes | c* vs length, flows, Pc; reproducibility about 2% | Best vaporization calibration case |
| MICH83 | LOX/ethanol, GOX/ethanol, LOX/propane; 4.45 kN at 20.7 bar; like doublet, OFO triplet, platelets; removable chamber section | Isp_vac (ε 1.94) vs O/F at 10.3 and 20.7 bar (CR-171712 Fig. 14); heat flux | Only LOX/ethanol set with element type and length varied; dimensions [TBD: confirm tables in CR-171713] |
| FUK08 | LOX/ethanol like-impinging, 12 vs 36 elements, 0.6-1.0 MPa, O/F 1.4-2.1 | c* efficiency vs O/F | Trend only; no dimensions |
| BAI64 | LOX/RP-1, 17.8 kN at 6.9 MPa; coaxial, micro-orifice, impinging; L* 0.86 and 1.22 m; tube sizes | c* efficiency, chugging | L* trend; Pc above range |
| MAS88 | LOX/RP-1 OFO triplets; 4.1-13.8 MPa; two lengths | c* efficiency, heat flux, zoned injector | Wall-zone trade; Pc above range |
| ROB05 | LOX/ethanol RCE, 3.87 kN class at 10.3 bar | Isp_vac; no dimensions | Isp check only |
| MAR25 | LOX/ethanol pintle, 1 kN, 10 bar, L* 1.3 m, cold-flow Cd 0.59/0.61 | Pc, thrust traces; cylinder h about 40% of Bartz; no c* efficiency | Partial |

All opened online. Dropped: Calvignac et al., AIAA 2003-4922 (reports the LOX/LH2 thruster only); Pieper, Dean & Valentine 1967 (not found). No LOX/ethanol showerhead data with dimensions and c* efficiency was found, so the first own hot fires calibrate η_dist.

**Calibration without overfitting:**
1. Measured c* = Pc·At/ṁ uses the geometric throat, so it reads high by 1/C_D,throat (RocketIsp docs, JANNAF page: η_ERE = η_c*·C_D) [checked online; medium]. Correct for throat C_D, Pc tap location (S6) and heat loss first.
2. Fit at most two global parameters: a vaporization-rate multiplier (on drop size or L_gen) and the showerhead η_dist. Fix K, v_rel and spreading to sourced values; c* data cannot separate them [judgment; high].
3. Separate vaporization from mixing with chamber-length series: η rising with length means vaporization-limited; a plateau below 1 means mixing-limited [judgment; medium].
4. Use at least 10 independent points per fitted parameter from at least two rigs [judgment; low]. Hold out whole rigs (leave-one-source-out), never random points, because one rig's points share its bias [judgment; high].
5. Accept when held-out RMS error is at most about twice measurement uncertainty (about 2% in CHP59) [judgment; low]. Freeze fitted values, with bootstrap intervals, in the model version.
6. A residual trend against L*, Pc, O/F or element type means missing physics; never absorb it with a new constant.
7. Record the tool's prediction band before each own hot fire; the comparison afterward is the validation record.

### 2.5 Item 5: other problems in this scope, by effect

1. Nozzle losses missing: at least 1.7% Isp for a 15° cone, plus kinetic and boundary-layer losses [checked online for 1.7%; judgment for the rest; medium].
2. η_vap not per propellant: tens of percent when one propellant lags (TN4219) [checked online; high].
3. Wall zone unconstrained (S10).
4. Feed budget omits face-pressure loss, 0.43 bar at 27.5 bar and CR 5, while the choice between 27.5 and 30 bar turns on 0.05 bar [judgment: my arithmetic; medium].
5. Heat loss absent: MAR25's 135 kW to cooling water at their 0.5 kg/s design flow is about 2.6% of ṁ·c_p·T_c, about 1.3% of c* [judgment: my arithmetic, c_p from their γ 1.13 and M 22.04; low].
6. Audit finding 5 confirmed: with mass conserved and averaging in fuel mass fraction, mass-weighted stream-tube c* cannot exceed c*(f̄) while the spread stays where c*(f) is concave. Remove the cap; assert mass balance (S4).

## 3. Implementable model spec

SI units unless stated. Thermochemistry from the stored CEA table (Pc 10-40 bar, O/F 0.3-4.0); outside it, refuse, except as S2 says.

**S1. Performance chain** (POW73 eqs. 15-16) [checked online; high]
- Isp_del = [η_HL·η_2D·η_kin·η_vap·η_dist − Δη_BL]·Isp_ODE(Pc, r, ε, Pa)
- c*_del = η_c*·c*_ODE(Pc, r); η_c* = η_HL,c·η_vap,c·η_dist,c [judgment: c* analog of POW73; high]
- Isp [s]; c* [m/s]; Pc nozzle stagnation pressure [Pa]; r = O/F; ε exit area ratio; Pa ambient [Pa]; each η in (0, 1].
- η_kin·(1 − Δη_BL): user input, default 0.98 [judgment; low] until a kinetics and boundary-layer estimate exists [TBD].

**S2. Vaporization efficiency** (TN4219 eqs. 3-5; POW73 eq. 18) [checked online; high]
- η_vap,c = Σ_i (θ_o,i·ṁ_o,i + θ_f,i·ṁ_f,i)·c*(r_v,i) / Σ_i (ṁ_o,i + ṁ_f,i)·c*(r_i)
- r_v,i = θ_o,i·ṁ_o,i/(θ_f,i·ṁ_f,i); r_i = ṁ_o,i/ṁ_f,i; θ = mass fraction vaporized at the throat [-]; ṁ [kg/s]; one tube if no field.
- r_v outside the table: extend the table in O/F, or extrapolate as TN4219 did (T_c proportional to percentage, c* ∝ √T_c) [checked online; medium]; flag `extrapolatedCstar`. Either θ < 0.01: return the band edge and flag.

**S3. Priem-Heidmann generalized length**, as printed in FANG83 eq. 1, p. 38 [checked online for the printed form; low as usable]
- L_gen = (L_c/CR^0.44 + 0.833·L_N/(CR^0.22·S^0.33))·(Pc/2068)^0.66·K_P·K_J
- K_P = (1 − T_r)^0.4·(H_v/325.64)^0.8·(M/100)^0.35; K_J = (r_m/76.20)^1.45·(V/328)^0.75; S = (1 + CR^−0.5 + CR^−1)/3
- Units (FANG83 App. F): L_gen, L_c (cylinder), L_N (convergent) [cm]; Pc [kPa]; T_r = T/T_crit; H_v [J/kg as printed]; M [g/mol]; r_m mass-median drop radius [µm]; V injection velocity [m/s].
- θ = G(L_gen) from FANG83 Fig. 26 [TBD: digitize from TR R-67]; valid 1-99%, dashed beyond [checked online; high].
- Resolve against TR R-67 before coding [TBD]: (a) as printed K_P and K_J multiply L_gen, but larger drops and higher latent heat must lower θ, so they should divide [judgment; high]; (b) 325.64 equals 140 Btu/lb in kJ/kg, so H_v is in kJ/kg [judgment: my arithmetic; medium]; (c) 328 is 100 m/s written in ft/s, so the reference could be 328, 100 or 30.48 m/s, which moves K_J by up to (328/30.48)^0.75 = 5.9 [judgment: my arithmetic; high that it must be checked].
- FANG83 says the drop-size correlation was backed out of LOX/heptane hot fires at 19.8 m/s injection (p. 38); the same group's hot fires ran near 20.7 bar at ~890 N (CHP59); invalid for flash vaporization (FANG83 §V) [checked online; high]. LOX above saturation at Pc (warm manifold): flag `vapModelInvalid`.

**S4. Mixture-ratio distribution** (POW73 eq. 19, c* form) [checked online; high]
- η_dist,c = Σ_i ṁ_i·c*(f_i)/(ṁ·c*(f̄)); f fuel mass fraction; f̄ = Σ ṁ_f,i/ṁ.
- Assert per-propellant mass balance within 1e-3 relative; throw on failure; no cap [judgment; high].
- Showerhead: user band [lo, hi], default [TBD: calibration], labeled "not validated (SP-8089 p. 16)". Stage 2: Rupe E_m (reviewer D).

**S5. Nozzle and heat loss**
- η_2D (cone) = λ = (1 + cos α)/2, α exit half-angle (SP125 eq. 4-8) [checked online; high]; multiplies momentum thrust only (Cf when Pe = Pa). Bell: user input.
- η_HL,c ≈ √(1 − Q_w/(ṁ·c_p·T_c)); Q_w wall heat not returned to the propellant [W]; c_p [J/(kg·K)]; T_c [K] [judgment: c* ∝ √T_c at fixed γ and molar mass; medium]. Propellant-cooled: η_HL = 1.

**S6. Sizing (Pc given)**
- Inputs: F [N], Pc [Pa], r, Pa, ε (or Pe = Pa), η_c*,design (default 0.85), η_Cf = λ·η_kin·(1 − Δη_BL), CR, L* [m], convergent half-angle β, ΔP_i/Pc.
- A_t = F/(η_Cf·C_F,ODE·Pc); ṁ = Pc·A_t/(η_c*,design·c*_ODE); ṁ_o = ṁ·r/(1 + r); ṁ_f = ṁ/(1 + r).
- A_c = CR·A_t; L_conv = (R_c − R_t)/tan β; V_conv = (π/3)·L_conv·(R_c² + R_c·R_t + R_t²); L_cyl = (L*·A_t − V_conv)/A_c; L_cyl ≤ 0 is infeasible. Volume definition SP125 p. 88 [checked online; high]; frustum ignores fillets [judgment; high].
- P_face = Pc·(1 + 0.54·CR^−2.2) (RCEA) [checked online; rule of thumb; medium]; fit range not stated, flag CR outside 2-8 [judgment].
- Feed budget: P_in,i ≥ P_face + ΔP_i + ΔP_man,i + user margin.
- Optional "size on predicted η": η_c*,design ← η_pred,nom, damping 0.5, stop at |Δη| < 0.002 or 20 iterations; off until calibrated [judgment; high].

**S7. Operating point (Analyze mode)**
- Solve Σ_i (C_d·A)_i·√(2ρ_i·(P_in,i − ΔP_man,i − P_face(Pc))) = Pc·A_t/(η_c*·c*_ODE(r(Pc), Pc)) for Pc in (0, min P_in,i), r(Pc) = ṁ_o/ṁ_f. Left side falls, right side rises: bisection to 1e-4·Pc [judgment; high].
- Run at η_lo, η_nom, η_hi; report Pc, ṁ_i, r, F = η_Cf·C_F,ODE·Pc·A_t, Isp, ΔP_i/Pc. Pc outside the table: stop and say so.

**S8. Gas residence time**
- θ_g = L*·c*_del/(R_g·T_c), R_g = R_u/M_g, from θ_g = Pc·V_c/(R_g·T_c·ṁ) and ṁ = Pc·A_t/c*_del [judgment: derivation; high]. About 1.85 ms at the default with M_g 23 g/mol and T_c 3200 K (audit values, not CEA-checked) [my arithmetic].

**S9. Chug screen**
- k_i = Pc/(2·ΔP_i) (orifice linearization) [judgment: derivation; high].
- θ_g·dφ/dt + φ = −k·φ(t − τ), φ = δPc/Pc: single dead time, structure of WS65 Fig. 1a [checked online; medium as a screen].
- k ≤ 1: no delay-driven instability. k > 1: τ_crit = θ_g·arccos(−1/k)/√(k² − 1) [judgment: standard delay-equation result; high for the math]. τ_crit/θ_g = 0.59, 0.87, 1.21, 1.66, 3.33 at ΔP/Pc = 0.15, 0.20, 0.25, 0.30, 0.40; unbounded from 0.50 [my arithmetic; high].
- τ: time for the slower propellant to reach 50% vaporized (S3 or reviewer B's march) [judgment; low]. Warn when τ_crit/τ < 2 [judgment; low]. Block ΔP_i/Pc < 0.15, warn below 0.20 (SP125 p. 128) [checked online; rule of thumb; medium].
- Constant τ, no feed dynamics; spread dead times are more stable than this [judgment; medium]. Upgrade: WS65 double dead time (tested in NASA TN D-4564, program in TN D-7026) [existence checked online].

**S10. Wall zone**
- Sort mass flux by radius from the wall inward; the outermost w = 0.10-0.15 of total ṁ is the wall zone (SP8089 p. 76) [checked online; high]. Evaluate r_wall = ṁ_o,w/ṁ_f,w at the face (hole assignment) and at 0.25 and 0.5·L_cyl [judgment; medium].
- Block r_wall > r_stoich (2.08 for ethanol, from C₂H₅OH + 3 O₂) on a metal wall without film cooling; warn r_wall > r_global [judgment; low]. The LOX-outer showerhead fails at the face.

**S11. Throat heat flux**
- h_g = 0.026·D_t^−0.2·(μ^0.2·c_p·Pr^−0.6)_c·(Pc/c*)^0.8·(D_t/r_tc)^0.1·(A_t/A)^0.9·σ (SP125 eq. 4-13, p. 100; SI form with g = 1 is my conversion) [checked online; high for the form].
- σ = [½(T_wg/T_c)(1 + (γ−1)/2·M²) + ½]^−0.68·[1 + (γ−1)/2·M²]^−0.12 (Bartz 1957) [from memory: check; medium].
- q = h_g·(T_aw − T_wg); T_aw = T_c·[1 + Pr^(1/3)·(γ−1)/2·M²]/[1 + (γ−1)/2·M²] [from memory: check; medium].
- D_t, r_tc (throat curvature radius) [m]; μ [Pa·s]; h_g [W/(m²·K)]; q [W/m²]. Properties from CEA transport output; fallback Pr = 4γ/(9γ − 5) (SP125 eq. 4-15) [checked online; medium].
- Report q × [0.4, 1.7] [judgment from MAR25 (h about 40% of Bartz), MICH83 (ethanol throat flux above the standard correlation), MAS88 (cites throat flux 70% above prediction); low]. Limit [TBD: cooling method, burn time].

**S12. Search**
- Variables: ΔP_i/Pc, L*, CR, hole counts and diameters (snapped to drill sizes).
- Feasible: feed budget (S6), stiffness and chug (S9), cavitation, hole spacing ≥ 3 d, L_cyl > 0, envelope, wall zone (S10), upper-band q ≤ limit (S11).
- Order: maximize min_i ΔP_i/Pc within budget; then minimize L_cyl subject to lower-band η_c* ≥ target; designs within the η band width are ties, all listed. Flag scan-edge results and any correlation used outside its range.

## 4. Change table

| Problem | Fix | Source | Label | Confidence | Model part |
|---|---|---|---|---|---|
| Isp scaled by c* efficiency only | JANNAF chain with nozzle terms | POW73 eqs. 15-16; SP125 eq. 4-8 | checked online | high | S1, S5 |
| η_vap is one fraction | Per-propellant form | TN4219; POW73 eq. 18 | checked online | high | S2 |
| Guessed K, v_rel, wrong clock | Priem-Heidmann after TR R-67 check, then B's march | TRR67; FANG83 | checked online (form); TBD (constants) | low | S3 |
| Showerhead η_mix unanchored | Calibrated user band | SP8089 p. 16 | checked online | high | S4 |
| c* cap hides mass errors | Mass-balance assertion | Audit 5; POW73 eq. 19 | judgment | high | S4 |
| Sizing on ideal Isp, c* | Design η input; At from delivered Cf | SP125 §1 | checked online | high | S6 |
| No check of built hardware | Operating point at η band | none | judgment | high | S7 |
| L* ignores convergent | Subtract V_conv | SP125 p. 88 | checked online | high | S6 |
| Face-pressure loss missing | P_face correction | RCEA | rule of thumb | medium | S6 |
| Search chooses Pc | Pc input; maps | none | judgment | high | S12 |
| ΔP driven to scan floor | Max ΔP in budget; chug screen | SP125 p. 128; SP8089 p. 82; WS65 | checked online; rule of thumb | medium | S9 |
| Wall O/F unconstrained | Outer 10-15% mass limit | SP8089 pp. 76, 82 | checked online | high | S10 |
| No heat-flux check | Bartz with band | SP125 eq. 4-13 | checked online | medium | S11 |
| 1% tie-break ranks noise | Lower-band target; ties | none | judgment | high | S12 |
| L*, CR guessed | Defaults, warning ranges | SP125; HER61; RCEA | checked online | medium | S6 |
| No validation | Datasets; leave-one-source-out | CHP59, MICH83, FUK08, BAI64, MAS88 | checked online; judgment | medium | 2.4 |
| Heat loss ignored | η_HL | MAR25 | judgment | low | S5 |

## 5. Open questions for the tool's author

1. Burn time, chamber material, cooling method? These set the heat-flux and wall-zone limits.
2. Is the 35 bar inlet pressure at the injector or the tank? Regulated or blowdown?
3. How is the inlet budget built (manifold loss, margin)? This decides whether 27.5 bar is a grid-edge result.
4. Is η_vap computed separately for LOX and ethanol? How are they combined?
5. Is stream-tube c* averaged in O/F or fuel mass fraction? Are Gaussian tails past the wall dropped?
6. Does Lc mean the cylinder only? Convergent angle, nozzle type, exit angle?
7. Can the rings be swapped (fuel outer) or a fuel film ring added?
8. Will the stand measure each propellant's flow, face Pc and thrust? c* efficiency needs all three.
9. Is a removable chamber spool feasible?
10. What η_c* target must the engine meet?
11. Does the CEA table include transport properties, and over what O/F range?

# Review B: atomization, breakup and vaporization (pipeline steps 4-7)

Scope: original item 2, plus item 9 within steps 4-7. Reviewed 2026-10-19.

**Assumptions.** Steady firing after ignition; burn long enough for injector temperatures to settle; axial non-impinging holes; LOX at 90 K and ethanol at 293.15 K unless stated (finding 9 says LOX may be warmer). Cooling, chamber material and igniter type do not change the droplet physics below.

**Labels.** `checked online` = read this session. "My arithmetic" = computed from the stated inputs (arithmetic high confidence; inputs carry their own labels). Source keys are expanded under References.

## 1. Three most serious problems

**P1. The v0.4 vaporization number is set by one guessed velocity, through diesel correlations used far outside their fit.** I reproduced steps 4-7 at the default case (item 4): pessimistic 14% vaporized, nominal and optimistic 100%. The diesel fits run at Laplace numbers 19 to 690 times their stated upper bound. The drop size that reaches step 6 is the breakup cap, built on a guessed relative velocity and inlet-temperature surface tension. Step 6 then uses one SMD, one K for both propellants and the shortest possible clock. The 99.5% nominal is a model artifact [judgment; high].

**P2. No liquid-core length.** Cold-flow correlations for turbulent pipe jets put the intact core of these ~20 m/s jets at 140 to 300 hole diameters, 170 to 420 mm, in a 250 mm chamber [Trettel 2020 Eqs 19, 24, checked online; medium]. The tool starts an atomized spray at the face. For a non-impinging showerhead this alone makes a near-100% prediction implausible.

**P3. There is no single relative velocity to pick.** In a vaporization-limited chamber the gas starts at rest at the face and accelerates as propellant vaporizes. Slip starts at the injection speed, passes through zero, then reverses as gas overtakes the drop, and differs for every drop size [Priem TN 3985 p. 5, checked online; high]. Replace steps 6-7 with Priem's published 1D march (section 3), fed with the one hot-fire-calibrated drop size for parallel jets I found (Priem-Heidmann R-67, as reproduced in Fang 1983).

## 2. Answers

### Item 1. Regime, breakup length, initial drop size, Bayvel & Orzechowski

Chamber gas ρ_g = 2.29 kg/m³ (S1). LOX at 90 K, 27.5 bar [NIST, checked online; high]. Ethanol ρ 789.4 kg/m³, μ 1.20 mPa s, σ 22.3 mN/m [from memory: check against the propellant DB; medium].

| Group (my arithmetic) | LOX | Ethanol |
|---|---|---|
| Re_l = ρ_l U d/μ_l | 1.6e5 | 1.8e4 |
| We_l = ρ_l U² d/σ | 4.8e4 | 2.2e4 |
| We_g = ρ_g U² d/σ | 95 | 64 |
| Oh = μ_l/√(ρ_l σ d); Lp = 1/Oh² | 1.3e-3; 5.5e5 | 8.2e-3; 1.5e4 |
| ρ_l/ρ_g | 501 | 345 |
| Tu₀ = 0.366 f^0.459 (fully developed pipe) | 0.065 | 0.073 |

Tu₀ regression [Trettel 2020 §4.1, checked online; medium]. L/d 15-19 is not fully developed, so I carry Tu₀ 0.05-0.10 [judgment; low].

**Regime: not Rayleigh.** Turbulent jets at the boundary between turbulent surface breakup ("second wind-induced") and atomization:
- Ranz: Rayleigh We_g < 0.4, first wind-induced 0.4-13. Both jets exceed 13 [Ranz 1956 via Trettel Eqs 1-4, checked online; medium; never fitted to data].
- Reitz's We_g = 40.3 atomization boundary is a miscalculation; Miesse's criterion gives 80.6 [Trettel §3.2, checked online; medium]. Do not code 40.3.
- Ohnesorge line Oh = 100 Re^-0.92 (Miesse): both points sit just below it, i.e. second wind-induced [Trettel Eq 5, checked online; low, ignores gas density].
- Turbulence-aware boundary We_g,crit = 3.17 Tu₀^-0.876 = 24-44 for Tu₀ 0.10-0.05: both are atomization [Trettel Eq 26, checked online; medium].

Atomization here means surface stripping starts within millimetres. It does not mean the core breaks up early.

**Core breakup length** (my arithmetic, Tu₀ 0.05-0.10) [Trettel Eqs 19, 24, checked online; medium]:

| Correlation | LOX | Ethanol |
|---|---|---|
| Turbulent surface breakup: x_b/d = 3.61 Tu₀^-0.275 We_l^0.334 | 248-300 d, 348-422 mm | 191-232 d, 232-280 mm |
| Atomization: x_b/d = 5.31 Tu₀^-0.568 (ρ_l/ρ_g)^0.335 | 158-234 d, 221-328 mm | 139-206 d, 168-249 mm |

Eq 19: 194 points, Tu₀ 0.049-0.127. Eq 24: 11 points, ρ_l/ρ_g 29.4-882, R² 0.60. Both are cold jets into still gas. In a chamber, gas overtaking the core and heating (lower σ) shorten it by an amount I cannot quantify [judgment]. Weber's linear theory gives 500-2900 d and does not apply.

**Initial drop size.**
- First stripped drops: x_i/d = 13.0 (Tu₀³ We_l)^-0.915, D32/d = 0.649 (Tu₀² We_l)^-0.657 [Trettel Eqs 21-22, checked online; 52 and 23 points; low-medium]. LOX: onset 0.5-3.6 mm, D32 16-39 µm. Ethanol: 0.9-6.3 mm, 23-57 µm. Most mass leaves later as core fragments of order d.
- Mass-weighted size for vaporization: the Priem-Heidmann "parallel jets" line, back-fitted from LOX/heptane hot-fire performance at 19.8 m/s injection [Fang 1983 Fig 27, §V.A, citing R-67, checked online; medium]. Read by eye (±20%): r_m,uncor ≈ 93 µm × (d/1 mm)^0.6, i.e. 104-114 µm here. After the S3 correction: LOX r_m ≈ 79 µm, ethanol ≈ 129 µm; mass-median diameters 157 and 257 µm; SMD 111 and 182 µm at σ_g 2.3 [my arithmetic]. The calibration velocity matches these jets. Use this as the v1 nominal.

**Bayvel & Orzechowski (steps 4-5): not usable.**
1. Diesel fit (stated ranges We_L 6.3e4-4e5, Lp 185-800; not checked). Here We_L is below the range and Lp is 19-690 times above it.
2. Self-contradictory here: the threshold calls both jets atomizing (We_L 4.7e4 vs 6.6e3; 2.2e4 vs 7.9e3), then returns SMD 425 and 532 µm, 0.30-0.44 d [my arithmetic]. Atomized drops are much smaller than d.
3. Diesel jets atomize at the exit at 100+ m/s; these keep cores for hundreds of diameters.

The Weber branch D = 1.88 d (1+3Oh)^(1/6) is a Rayleigh-regime result and does not apply either. The step-5 spray angle gives half-angles 3.3° and 2.2°; the only turbulent-jet regression I found, tan(θ/2) = 5.32e-5 We_l^0.605, gives 2.1° and 1.3° [Trettel Eq 20, checked online; 5 points; low]. Pass to reviewer C as low confidence.

### Item 2. Relative velocity and the 1D march

Delete the three scenarios; slip is an output of the march (S4).
- **Drag.** Priem used C_D = 27 Re^-0.84, measured on accelerating drops, 6 < Re < 400, 20-120 µm [Ingebo TN 3762, checked online; medium]. Steady sphere: C_D = (24/Re)(1 + 0.15 Re^0.687) [Schiller-Naumann via Clift et al. 1978, form checked online; high], 0.44 above Re 1000 [rule of thumb]. They differ 3.5x at Re 400 [my arithmetic]. Use Ingebo in the P-H-consistent mode (the drop sizes were calibrated with it), Schiller-Naumann as sensitivity.
- **Evaporation.** Use Priem's model, not a fixed-K d²-law: heat-up, vapor-pressure-driven mass flux with a Stefan factor (the mole-fraction form of the Spalding number), a blowing correction on heat transfer, Ranz-Marshall Nu and Sh [TN 3985 Eqs 1-8, checked online; high]. Keep K as a unit test (S7).
- **Gas velocity.** u(x) = u_fin × (mass vaporized up to x)/(total mass flow) [TN 3985 Eq 12, checked online; high]. Summing both propellants is my generalization [judgment; medium].
- **Secondary breakup.** We_c ≈ 12 for Oh < 0.1 [Pilch & Erdman 1987; Hsiang & Faeth 1992; Guildenbecher et al. 2009; checked online via papers citing them; medium-high]. Drop Oh here is < 0.03, so the Oh correction is negligible. Use local slip and σ at drop temperature: heated LOX at 27.5 bar has σ ≈ 2.2 mN/m, not 13.2 [NIST, checked online; high].
- **Properties.** Gas film properties at the 1/3 reference state [Hubbard et al. 1975, from memory: check; medium]. Drag with free-stream density and viscosity at the reference temperature [Yuen & Chen 1976 abstract, checked online; medium; data Re 1-2000, B 0-3]. Liquid properties at drop temperature.

**Priem-Heidmann R-67 vs a custom march.** Implement Priem's march first; add the R-67 generalized-length chart later as a cross-check:
1. I could not find R-67's text online. The 1983 restatement (Fang Eq 1) multiplies by K_P K_J, while TN 3883 puts (1−T_r), drop radius and injection velocity in the denominator. "H_v/325.64" only works in kJ/kg (140 Btu/lb), and the "V/328" reference cannot be resolved. Do not code it from Fang.
2. No ethanol curve exists in TN 3883 (heptane, ammonia, hydrazine, oxygen, fluorine) [checked online]. R-67's property factor (H_v, M, T_r) would still extrapolate to ethanol.
3. The march produced the chart, so reproducing the TN 3883 oxygen curve is a ready verification test (S8).

Inputs either way: Pc; cylinder and convergent lengths; contraction ratio (sets u_fin); injection velocity; initial propellant temperature; T_crit; molecular weight; latent heat; mass-median drop radius; σ_g. The march also needs ρ_l, c_p,l, λ, p_sat, σ versus temperature, and gas k, μ, c_p, D.

### Item 3. Evaporation constants at 20-40 bar

Critical points: O₂ 154.58 K, 50.43 bar; ethanol 514 ± 7 K, 63 ± 4 bar (the brief's 61 bar is inside that band) [NIST, checked online; high]. Reduced pressure over 20-40 bar: LOX 0.40-0.79, ethanol 0.32-0.65. Both subcritical.

| O₂ saturation [NIST, checked online; high] | 20 bar | 27.5 bar | 40 bar |
|---|---|---|---|
| T_sat (K) | 132.7 | 139.7 | 148.7 |
| h_fg (kJ/kg) | 146 | 126 | 88 |
| ρ_l (kg/m³) | 880 | 816 | 700 |
| σ (mN/m) | 3.5 | ~2.2 | 0.71 |

Heating LOX from 90 K to T_sat at 27.5 bar takes 95 of 221 kJ/kg (43%) and swells the drop 41% in volume [NIST; my arithmetic]. Ethanol T_sat = 457, 473, 493 K at 20, 27.5, 40 bar [NIST Antoine, Ambrose 1975, valid 364.8-513.91 K, checked online; high]; h_fg ≈ 560, 500, 385 kJ/kg [Watson scaling from 838 kJ/kg at 351.5 K; rule of thumb; medium]; sensible heat from 293 K ≈ 500 kJ/kg [judgment; low].

Quiescent K₀ = 8 (k/c_p)_ref ln(1+B_T)/ρ_l, B_T = c_p,ref (T_∞ − T_s)/L, T_∞ = 3200 K [TBD: T_c from CEA]:
- **LOX:** 1.4-3.1 × 10⁻⁶ m²/s over 20-40 bar (O₂ film properties from NIST at ~1160 K; low end with heat-up enthalpy and cold density, high end with latent heat and saturated density) [judgment; medium-low]. A mass-transfer estimate from Priem's oxygen wet-bulb point at 300 psia (130.6 K, vapor pressure 275 psia) [TN 3883, checked online] gives ~1.5 × 10⁻⁶ [judgment; low].
- **Ethanol:** 1.0-2.4 × 10⁻⁶ m²/s [judgment; low; film composition unknown].
- **Convection** multiplies K₀ by Nu/2 = 1 + 0.3 Re^0.5 Pr^(1/3): 1.8x at Re 10, 3.7x at Re 100, 7x at Re 500 [Ranz-Marshall, TN 3985 Eq 5, checked online; high]. A 100 µm drop at 20-100 m/s slip has Re ≈ 85-420 [my arithmetic].

The guessed K = 2 × 10⁻⁶ is the right order for a drop with no slip. The error is that it is constant, shared by both fluids and paired with a guessed v_rel. LOX K₀ rises modestly from 20 to 40 bar [judgment; medium].

**Near and above critical.** As P approaches P_crit, σ and h_fg go to zero, liquid and vapor densities converge and ambient gases dissolve at the surface. Cryogenic jets stop forming drops and look like dense gas jets [Mayer et al. 1998, abstract checked online; medium]. Mixture critical pressures with dissolved products can exceed pure O₂'s [from memory: check; low]. The d²-law, Spalding B and We-breakup lose meaning. LOX at 40 bar (P_r 0.79, σ 0.7 mN/m) is already near-critical: warn at P/P_crit ≥ 0.8, block the droplet model at ≥ 1.0 [judgment; medium].

### Item 4. Findings 1 and 2 at the default case

S1 gives ρ_g 2.20-2.32 kg/m³, u_end 138-146 m/s, t_res = L_c/u_end 1.72-1.81 ms for γ 1.13-1.22, needing only c* = 1715.6 m/s from Pc, A_t, ṁ [my arithmetic].

v0.4 chain (ρ_g 2.29, t 1.79 ms, K 2e-6; primary SMD 425/532 µm exceeds the cap in every scenario, so the cap sets D):

| | v_rel LOX/EtOH (m/s) | D (µm) | τ (ms) | Vaporized |
|---|---|---|---|---|
| Pessimistic | 19.7 / 22.6 | 178 / 229 | 15.8 / 26.2 | 14% |
| Nominal | 44.8 / 46.2 | 34 / 55 | 0.59 / 1.50 | 100% |
| Optimistic | 69.8 / 69.8 | 14 / 24 | 0.10 / 0.29 | 100% |

14% times a mixing efficiency near 0.88 matches the 12.4% floor [my arithmetic; medium, η_mix not given].

**Finding 1: confirmed and extended.** τ = 144 σ²/(K ρ_g² v⁴). The 3.5x spread in v moves τ 158x. τ is also second-order in σ: LOX σ at drop temperature (2.2 vs 13.2 mN/m) cuts τ 36x. Nominal ethanol sits at τ/t = 0.84, just inside "complete", which is the saturation the search exploits.

**Finding 2: confirmed.** 1.8 ms is the shortest time any element spends in the cylinder. A drop at constant 19.7 m/s takes 12.7 ms. In the 1D model drops first slow down (gas at the face is slower), so transit is longer until gas overtakes them. The proposed fix is right and already published (TN 3985).

**Independent LOX check.** TN 3883's correlation covers P 150-600 psia, u_fin 61-488 m/s, v₀ 15-61 m/s, r_m 25-225 µm, O₂ initial temperature 78-122 K [Table I, checked online]; the default case is inside all of them. Effective length = L P^0.66 u_fin^0.40 1.9e-5/[(1−T_r)^0.40 r_m^1.45 v₀^0.75] in inch-pound units [TN 3883 p. 5, checked online; high]. With L = 250 mm it gives ~13 at r_m = 79 µm, so >99% of the LOX vaporizes (Fig 2(h)); 7.9 at 110 µm (~96%); 3.3 at 200 µm (~85%) [my arithmetic; figure read by eye; medium]. LOX is probably not the limiting propellant. Ethanol needs the march.

### Item 5. Item 9 within steps 4-7, ranked by effect

1. **Monodisperse SMD in the d²-law.** Unvaporized mass sits in the largest drops; a few large drops cause much of the loss [TN 3883 introduction, checked online]. Use five equal-mass groups, σ_g = 2.3 [TN 3883, from Ingebo TN 4222 cold-flow sprays, checked online; medium]. Large.
2. **Liquid properties at injection temperature.** σ, ρ_l, μ change several-fold as LOX heats. Large, through the cap.
3. **No core-length model** (P2). Large; warn until modeled.
4. **Near-critical LOX at 40 bar**, the top of the Pc scan; the search can exploit the property collapse. Medium-large.
5. **One K, no heat-up.** Ethanol needs ~1040 kJ/kg to vaporize from injection, LOX 221 [judgment; NIST]. Medium.
6. **Gas density near the face** taken as hot-product density; real near-face gas is cooler and denser, so We_g is underestimated [judgment; low]. Medium.
7. **Property DB resolution.** Two or three temperatures per fluid cannot support a march from 90 K to T_sat; generate CoolProp tables. Medium.
8. **Diesel spray angle** (step 5). Small here; matters for mixing.

## 3. Implementable model spec

SI units. **Mode A (P-H consistent, v1 nominal):** Ingebo drag, breakup flagged only, P-H drop sizes. **Mode B (sensitivity):** Schiller-Naumann drag, active breakup. Report A as nominal; the range is the A/B spread plus the S3 drop-size band.

**S1. Chamber gas.** ρ_c = Pc/(c* Γ)², Γ = √γ (2/(γ+1))^((γ+1)/(2(γ−1))) [ideal-rocket relations, Sutton & Biblarz ch. 3, from memory: check; high], or ρ_c = Pc M_c/(R_u T_c) from CEA. u_fin = ṁ/(ρ_c A_c); T_∞ = T_c(O/F). Pc (Pa), c* (m/s), A_c (m²), ṁ (kg/s). Valid inside the CEA table (Pc 10-40 bar, O/F 0.3-4.0); outside: error.

**S2. Regime and core length (diagnostic in v1).** Groups as in item 1 with U₀ (m/s), d₀ (m), σ (N/m) at injection temperature. Tu₀ = 0.366 f^0.459, f = Darcy factor from step 3; clamp to 0.049-0.127, flag "L/d < 40, Tu₀ uncertain".
- We_g < 0.4 Rayleigh; < 13 first wind-induced; else atomization if We_g > 3.17 Tu₀^-0.876, otherwise turbulent surface breakup.
- x_b from Eq 19 or Eq 24 accordingly. ρ_l/ρ_g outside 29-882: "core length unknown".
- x_b > 0.5 L_cyl: warning. x_b > L_cyl: attach "liquid cores may reach the nozzle; vaporization result optimistic" to the efficiency.

**S3. Drop sizes.**
- r_m,uncor (m): [TBD: digitize Fang 1983 Fig 27 parallel-jet line or take from R-67; by-eye fit 93 µm × (d₀/1 mm)^0.6].
- r_m = 99.29 r_m,uncor (σ μ_l/ρ_l)^0.25, σ (N/m), μ_l (Pa s), ρ_l (kg/m³) at injection temperature [Fang Eq 2, checked online; medium]. Factor = 1.04 for heptane [my arithmetic].
- × (U₀/19.8)^-0.66 [Fang §V.B, chosen for sheets; judgment for jets; low]. Warn outside U₀ 10-40 m/s.
- Five equal-mass groups: r_i = r_m σ_g^{z_i}, z = −1.2816, −0.5244, 0, 0.5244, 1.2816, σ_g = 2.3. Reproduces Priem's 25/48/75/120/225 µm within 4% [TN 3883 pp. 2-3, checked online; my arithmetic].
- Band: r_m × 0.5 and × 2 [judgment]. Warn outside r_m 25-225 µm.

**S4. March.** Per propellant p and group i: radius r (m), liquid temperature T_l (K), drop velocity v (m/s), mass m (kg); number flow Ṅ_p,i = 0.2 ṁ_p/m_p,i,0 (1/s). Gas velocity u (m/s); P = Pc (Pa).
- dx/dt = v.
- dv/dt = (3/8) C_D (ρ_d/ρ_l)(u − v)|u − v|/r [TN 3985 Eq 10, sign explicit]. ρ_d = ρ_ref in mode A (Priem's "mantle"), ρ_c in mode B (Yuen & Chen).
- Re = 2r ρ_d |u − v|/μ_ref. C_D: mode A 27 Re^-0.84 with Re clamped to [6, 400] and flagged; mode B Schiller-Naumann to Re 1000, 0.44 above.
- Evaporation ṁ (kg/s) = 2π r Sh D_ref ρ*_v ln(P/(P − p_sat(T_l))), ρ*_v = P M_v/(R_u T_ref), Sh = 2 + 0.6 Sc^(1/3) Re^(1/2), Sc = μ_ref/(ρ_ref D_ref) [TN 3985 Eqs 1-3, rearranged; checked online; high]. M_v (kg/mol), R_u = 8.314 J/(mol K), D_ref (m²/s).
- Heat q (W) = 4π r² h (T_∞ − T_l) Z, h = k_ref Nu/(2r), Nu = 2 + 0.6 Pr^(1/3) Re^(1/2), Pr = c_p,ref μ_ref/k_ref, Z = ζ/(e^ζ − 1), ζ = ṁ c_p,v/(4π r² h) [TN 3985 Eqs 4-6, checked online; high]. c_p,v = vapor specific heat (J/(kg K)).
- m c_p,l dT_l/dt = q − ṁ λ(T_l); dm/dt = −ṁ; r = (3m/(4π ρ_l(T_l)))^(1/3); λ latent heat (J/kg) [TN 3985 Eqs 7-8].
- Boiling guard: if p_sat(T_l) ≥ 0.99 P, hold T_l = T_sat(P), ṁ = q/λ [judgment].
- u(x) = u_fin Σ_p,i Ṅ_p,i (m_p,i,0 − m_p,i(x))/ṁ_total [TN 3985 Eq 12; two-propellant sum is judgment].
- At x = 0: v = U₀,p, T_l = T_inj,p, r = r_p,i, u = 0.
- Integrate all groups together in x (dt = dx/v), RK4, Δx ≤ 0.25 mm, v ≥ 0.05 U₀.
- Stop at the end of the cylinder; optionally continue to the throat with u = ṁ_vap/(ρ_c A(x)).
- Output η_vap,p = 1 − Σ_i Ṅ_p,i m_p,i(L)/ṁ_p, and u, slip, Re, We histories. Mass must close to 1e-6.

**S5. Properties.**
- T_ref = T_l + (T_∞ − T_l)/3; Y_v,ref = Y_s + (0 − Y_s)/3, Y_s from mole fraction p_sat/P [1/3 rule, from memory: check; medium].
- Reference-state c_p, k, μ by mass-fraction weighting of vapor and products [judgment; low-medium]. ρ_ref D_ref = k_ref/c_p,ref (unit Lewis number) [judgment; medium].
- Product transport properties from CEA [TBD: confirm the stored table or `cea` package gives μ, k, Pr]; vapor properties from CoolProp.
- Liquid ρ_l, c_p,l, λ, p_sat, σ versus T_l: LOX 90-154 K, ethanol 293-510 K.
- P/P_crit ≥ 0.8 for either propellant: warn. ≥ 1.0: return "not modeled", no efficiency.
- B_T > 20: flag [Abramzon & Sirignano film theory, range 0-20 via a secondary source, checked online; medium].

**S6. Secondary breakup.** We = ρ_c (u − v)² 2r/σ(T_l). If We > 12 for longer than t_b = 5 (2r/|u − v|) √(ρ_l/ρ_c) [Hsiang & Faeth 1992; Pilch & Erdman 1987; the 5 from memory: check; medium]:
- Mode A: flag only (P-H sizes already include breakup).
- Mode B: split into same-mass drops of diameter 12 σ(T_l)/(ρ_c U_end²), U_end = slip at the end of breakup [Pilch & Erdman 1987, from memory: check; medium].
- Oh ≥ 0.1: [TBD: Oh correction from Pilch & Erdman 1987].

**S7. Unit test.** With u = v and constant properties the march must reproduce d(D²)/dt = −K₀, K₀ = 8 (k/c_p)_ref ln(1+B_T)/ρ_l, B_T = c_p,ref (T_∞ − T_s)/L [Spalding d²-law, from memory: check; high].

**S8. Verification.**
1. TN 3883 Fig 2(g)/(h) oxygen mean curve, inside the hatched band: 300 psia, u_fin 243.8 m/s, v₀ 30.5 m/s, r_m 75 µm, σ_g 2.3, T₀ 77.8 K, Appendix B property fits, mode A.
2. TN 3985 single n-heptane drop histories.
3. Mass closure; S7.

## 4. Change table

| Problem | Fix | Source | Label | Confidence | Model part |
|---|---|---|---|---|---|
| Diesel breakup/SMD fits far outside range | P-H parallel-jet r_m with property correction | Fang 1983 / R-67 | checked online (Fang) | medium | step 4 |
| Weber Rayleigh branch | Remove; classifier S2 | Trettel 2020 | checked online | high | step 4 |
| No core length | x_b diagnostic and warnings | Trettel Eqs 19, 24 | checked online | medium | new |
| Three v_rel scenarios | Delete; slip from march | TN 3985 | checked online | high | step 7 |
| Fixed K, one SMD, t = L_c/u | Priem march, five groups | TN 3985, TN 3883 | checked online | high structure, medium values | step 6 |
| Properties at injection temperature | Evaluate at T_l | NIST | checked online | high | steps 4-7 |
| One K for both fluids | Per-propellant march | TN 3985 | checked online | high | step 6 |
| Cap with guessed v, cold σ | We_c = 12 on local slip, σ(T_l) | Pilch & Erdman; Hsiang & Faeth | via secondary sources | medium | steps 4, 7 |
| Drag law unstated | Ingebo (A), Schiller-Naumann (B) | TN 3762; Clift et al. | checked online | medium | step 7 |
| Near-critical LOX at 40 bar | Warn P_r ≥ 0.8, block ≥ 1.0 | NIST; Mayer 1998 | checked; thresholds judgment | medium | steps 4-7 |
| R-67 chart | Cross-check only, after obtaining R-67 | TN 3883; Fang | partly checked | medium | step 6 |
| No gas transport properties | Add CEA transport | CEA | TBD | medium | data |
| Coarse property DB | CoolProp tables vs T | - | judgment | high | data |
| Diesel spray angle | Flag low confidence | Trettel Eq 20 | checked online | low | step 5 |

## 5. Open questions for the tool's author

1. Measured LOX temperature at the holes? Is the LOX manifold chilled before firing?
2. Hole inlet edge (sharp or chamfered) and finish? (Tu₀, Cd, cavitation.)
3. Cylinder and convergent lengths separately? L* gives only their sum.
4. In v0.4, is step 6 mass-weighted? At what temperature are σ, μ, ρ taken? Which η_mix gave 12.4%?
5. Does the stored CEA table or `cea` package give μ, k, Pr?
6. Do you have NASA TR R-67 (1960)? It resolves the Fang Eq 1 questions.
7. Where in Bayvel & Orzechowski do the stated fit ranges come from?
8. Can the propellant DB carry LOX 90-154 K and ethanol 293-510 K tables?

## References

- **Fang 1983:** J. Fang, *LOX/Hydrocarbon Fuel Carbon Formation and Mixing Data Analysis*, NASA CR-168066, §V, Eqs 1-3, Figs 26-27 (NTRS 19830023615).
- **R-67:** R. J. Priem, M. F. Heidmann, *Propellant Vaporization as a Design Criterion for Rocket-Engine Combustion Chambers*, NASA TR R-67, 1960 (not obtained).
- **TN 3985:** R. J. Priem, *Propellant Vaporization as a Criterion for Rocket-Engine Design; Calculations of Chamber Length to Vaporize a Single n-Heptane Drop*, NACA TN 3985, 1957.
- **TN 3883:** R. J. Priem, same series, *Calculations of Chamber Length to Vaporize Various Propellants*, NACA TN 3883, 1958.
- **TN 3762 / TN 4222:** R. D. Ingebo, *Drag Coefficients for Droplets and Solid Spheres in Clouds Accelerating in Airstreams*, 1956; *Drop-Size Distributions for Impinging-Jet Breakup in Airstreams...*, 1957.
- **Trettel 2020:** B. Trettel, "Reevaluating the jet breakup regime diagram," preprint for *Atomization and Sprays* 30 (engrXiv 740), §§3-4.
- **Ranz & Marshall 1952:** "Evaporation from drops," *Chem. Eng. Prog.* 48(3):141-146.
- **Yuen & Chen 1976:** "On drag of evaporating liquid droplets," *Combust. Sci. Tech.* 14:147-154.
- **Abramzon & Sirignano 1989:** *Int. J. Heat Mass Transfer* 32(9):1605-1618.
- **Pilch & Erdman 1987:** *Int. J. Multiphase Flow* 13(6):741-757.
- **Hsiang & Faeth 1992:** "Near-limit drop deformation and secondary breakup," *Int. J. Multiphase Flow* 18(5):635-652.
- **Guildenbecher et al. 2009:** "Secondary atomization," *Exp. Fluids* 46:371-402.
- **Mayer et al. 1998:** *J. Propulsion Power* 14(5):835-842.
- **Hubbard, Denny & Mills 1975:** *Int. J. Heat Mass Transfer* 18:1003-1008 (from memory: check).
- **Clift, Grace & Weber 1978:** *Bubbles, Drops, and Particles*, ch. 5.
- **NIST:** Chemistry WebBook, oxygen fluid data (C7782447), ethanol phase-change data (C64175).

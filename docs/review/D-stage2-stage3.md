# Review D: Stage 2 impinging elements, Stage 3 coaxial, pintle and swirl, element interface

Scope: original items 5 and 6, and item 9 where it touches them.

**Assumptions.** Hardware unknown; I assume a test stand, burns under about 10 s, an uncooled metal face, LOX near 90 K. Worked numbers use the v0.4 default case (LOX 12 x 1.404 mm at 19.7 m/s, ethanol 12 x 1.210 mm at 22.6 m/s, Pc 27.5 bar) and these properties [from memory: check against the propellant database; medium]: LOX ρ 1141 kg/m³, μ 1.9e-4 Pa·s, σ 13.2e-3 N/m; ethanol ρ 789 kg/m³, μ 1.2e-3 Pa·s, σ 22.3e-3 N/m. Face gas density ρ_g ≈ 2.4 kg/m³ from Pc·MW/(R_u·Tc), Tc 3200 K, MW 23 [judgment; audit estimate, not checked against CEA; low].

**Source key.** "Checked online" means I read the equation in the PDF or a page image.
- SP8089: Gill & Nurick, *Liquid Rocket Engine Injectors*, NASA SP-8089, 1976 (NTRS 19760023196); Secs 2.1.1.1.1-2.1.1.1.4, 3.1.1.1.1-3.1.1.1.4; Eqs 1-7; Table IV.
- EM59: Elverum & Morey, *Criteria for Optimum Mixture-Ratio Distribution Using Several Types of Impinging-Stream Injector Elements*, JPL Memo 30-5, 1959 (NTRS 20150018528); Eqs 1-9.
- HRS72: Hoehn, Rupe & Sotter, *Liquid-Phase Mixing of Bipropellant Doublets*, JPL TR 32-1546, 1972 (NTRS 19720013107); Eqs 1-2, Fig 1. Rupe's 1953 and 1956 reports were not read.
- HP64: Hasson & Peck, *Thickness distribution in a sheet formed by impinging jets*, AIChE J 10:752-754, 1964 (read via CY19 Eq 2).
- RY95: Ryan, Anderson, Pal & Santoro, *Atomization characteristics of impinging liquid jets*, J. Propulsion Power 11:135-145, 1995 (read via RO24 Eq 29). PS95: same authors, *Analytical and experimental studies of impinging liquid jets*, 1995 (NTRS 19950002781).
- AN06: Anderson, Ryan & Santoro, *Impact wave-based model of impinging jet atomization*, Atomization and Sprays 16:791-805, 2006 (read via CY19 Eqs 1-5, RO24 Eq 35).
- RO24: Rodrigues, Kulkarni, Gao, Chen & Sojka, *An experimental and theoretical investigation of spray characteristics of impinging jets in impact wave regime*, arXiv:2405.08259; Eqs 28-30, 35.
- CY19: Chen & Yang, *Recent advances in physical understanding and quantitative prediction of impinging-jet dynamics and atomization*, Chinese J. Aeronautics 32(1):45-57, 2019; Sec 3.
- IN58: Ingebo, *Drop-size distributions for impinging-jet breakup in airstreams simulating the velocity conditions in rocket combustors*, NACA TN 4222, 1958 (NTRS 19930085145).
- MC13: Matas & Cartellier, *C. R. Mécanique* 341:35-43, 2013 (quotes Raynal's 1997 thesis).
- ST25: Stumpo, Ferrero, Martelli, Masseni & Pastrone, *Pintle injector spray study via physics-based spray model and generative adversarial networks*, EUCASS 2025 (DOI 10.13009/EUCASS2025-512); Sec 2, Eqs 1-4; Eq 3 quotes Cheng, Li & Chen, Acta Astronautica 154:61-66, 2019. LE21: Lee, Jeong & Yoon, *Effects of deflectors in liquid-liquid pintle injector with various momentum ratio*, ICLASS 2021; Eq 3. HE11: Heister, *Pintle Injectors*, in Ashgriz (ed.), *Handbook of Atomization and Sprays*, Springer 2011, pp. 647-655 (not read).
- BZ04: Bazarov, Yang & Puri, *Design and Dynamics of Jet and Swirl Injectors*, in *Liquid Rocket Thrust Chambers*, AIAA 2004 (not read; equations via YA18, VD10). YA18: Yoon & Ahn, *Experimental and theoretical study on spray angles of bi-swirl coaxial injectors*, J. Appl. Fluid Mech. 11(5):1377-1386, 2018; Eqs 1-19. VD10: Vasques & Dourado, *Study of swirl atomizers for liquid propellant rocket engines using an open source CFD code*, ENCIT 2010; Eqs 6-16. AL19: Ahn & Lee, *Experimental study on the discharge coefficient of bi-swirl coaxial injectors*, J. Appl. Fluid Mech. 12(5):1439-1447, 2019. KH08: Kenny, Hulka et al., *Effect of chamber backpressure on swirl injector fluid mechanics*, 2008 (NTRS 20090001890).
- RL: Rizk & Lefebvre, *Internal flow characteristics of simplex swirl atomizers*, J. Propulsion Power 1(3), 1985 [from memory: check], and *Prediction of velocity coefficient and spray cone angle for simplex swirl atomizers*, Int. J. Turbo Jet Engines 4:65-74, 1987; both read as reproduced in J. Adv. Res. Fluid Mech. Therm. Sci. 85(2):107-114, 2021, Eqs 2, 4. LA04: Lacava, Bastos-Netto & Pimenta, *Design procedure and experimental evaluation of pressure-swirl atomizers*, ICAS 2004 paper 097. LM17: Lefebvre & McDonell, *Atomization and Sprays*, 2nd ed., 2017 [from memory: check].

## 1. Three most serious problems

**1. Stage 2 as described ("angled jets aimed at one common point") is not an impinging-element injector, and no correlation covers it.** Every mixing and atomization correlation here is for one element: doublet, triplet, 2-on-2, up to 5-on-1 (EM59; SP8089 Table IV). Aiming 24 jets at one point (a) cancels radial momentum, so the spray and its heat release concentrate on the centerline and nothing predicts a "cone"; (b) breaks SP8089 Sec 3.1.1.1.4's free-jet limit of 5-7 orifice diameters [checked online; high]: the tool's rings (radius 17.5 and 11.8 mm) at 30-45° to the axis give L_fs = 17-35 mm = 14-25 d, the STL rings 27-56 mm = 23-40 d [arithmetic; high]; (c) makes aim errors large: 1° over 35 mm moves a jet 0.61 mm, 44% of its diameter, and SP8089 Sec 2.1.1.1.4 reports 20% misimpingement changing mixing uniformity by 15% [checked online; medium]. Fix: Stage 2 is a pattern of elements, each impinging at most 5-7 d from the face. "Common point" survives only as an unvalidated mode that returns the resultant direction and no drop size or E_m.

**2. One shared dP/Pc cannot meet the element mixing criterion, and impinging mixing is set by the element.** Rupe's unlike-doublet criterion is ρ_f V_f² d_f = ρ_o V_o² d_o (EM59 Eq 1; HRS72 Eq 2). The default holes, sized at one dP/Pc, give a ratio of 0.78, N_R = 0.56 against the optimum 0.50. Meeting it at O/F 1.70 needs d_o/d_f = 1.26 and ΔP_o/ΔP_f ≈ 0.79 at equal C_d [EM59 Eq 4, checked online; high; arithmetic mine]; v0.4's single dP/Pc cannot get there. E_m is fixed near the impingement point by this ratio (HRS72 Fig 1: about 80 at N_R 0.5, about 60 near 0.35 and 0.65 [read from figure; low]), not by Gaussian spreading downstream. Fix: separate ΔP_o and ΔP_f; elements return E_m and a mass-fraction distribution that reviewer C's mixing model starts from.

**3. Every spray correlation here is cold-flow, mostly outside its range, and they disagree by about 2.4x.** Default-case impinging drop sizes span 139-341 µm (2.1c). The gas/liquid density ratio (0.002-0.003) happens to sit inside the cold-flow tests' 0.001-0.013 [arithmetic from air at 0.1-1.05 MPa; medium], but those used water in cold air, not LOX or ethanol in hot gas, and jet Weber numbers here are 2-5e4 against checked ranges of 500-4000 (PS95) and 6,820-21,900 (RO24). The two swirl-angle theories differ by 12° at one geometry (S3.6). Shear coax with two liquids has no correlation at all (S3.1). Fix: outputs are intervals with range flags, and "no model" is a legal result. For LOX with liquid ethanol, prefer bi-swirl coaxial (Russian booster practice, SP8089 Sec 2.1.1.1.1) or pintle over shear coax.

## 2. Answers

### 2.1 Stage 2 (item 5)

**(a) Momentum ratio, Rupe criterion, E_m.** Implement S2.2 (EM59 Eqs 1-9; SP8089 Eq 1 as a 60° cross-check) and S2.3 (HRS72 Eq 1). EM59's data are water/kerosene, density ratio 0.54-1.85 (LOX/ethanol is 1.45), fully developed turbulent jets from contoured orifices about 20 d long [checked online; high]. E_m is computed in mass fraction, which agrees with audit finding 5. Default unlike doublet: A_f/A_o 0.74 is inside HRS72's tested 0.26-1.0, and E_m sits a few points below peak by eye [low]. An O-F-O triplet with fuel in the center needs D_f/D_o = 1.03 (EM59 Eq 6) or 0.99 (SP8089 Eq 1, M = 1.6) [checked online; medium; arithmetic mine]. That is inside EM59's tested 0.77-1.41, though EM59 warns against use far from 0.79, so a near-equal-hole triplet is plausible for LOX/ethanol at O/F 1.7, in the core only, pending cold flow.

**(b) Impingement angle and resultant.** S2.1. Default unlike doublet at 60° included: β = 6.4° (10.9° at 90°) toward the LOX jet's direction of travel, since the LOX jet carries 48% more momentum [arithmetic; high]. Use 60° included; above 60°, cold-flow test for backsplash; 90° and above gives high face heat flux; unlike-doublet mixing improves as the angle drops from 80° to 40° (SP8089 Secs 2.1.1.1.3, 3.1.1.1.3) [checked online; high].

**(c) Sheet, breakup length, drop size.** The jets are turbulent (Re 1.8e4, 1.7e5) at We 2.2e4 and 4.7e4, the fully developed impact-wave regime (RO24 summarizing AN06 and others: near We 2e4, Re 2.4e4) [checked online; medium]. Aerodynamic sheet-instability models fail for turbulent high-We jets (CY19 Sec 3.1) [checked online; high]. Implement S2.4-S2.6 and report the spread:

| Default case | LOX jet | Ethanol jet | Label |
|---|---|---|---|
| We_j, Re_j | 4.7e4, 1.7e5 | 2.2e4, 1.8e4 | arithmetic; properties from memory |
| RY95 d_D, uniform profile | 238 µm | 249 µm | checked online via RO24; low (RO24: overpredicts) |
| RO24 MMD, impact wave | 147 µm | 139 µm | checked online; low (one density ratio tested; LOX We above range) |
| SP8089 Eq 4, like doublet, P_c/P_j = 1 | 188 µm | 299 µm | checked online; low (P_c/P_j assumed) |
| SP8089 Eq 2, unlike doublet, fuel | n/a | 341 µm | checked online; low |
| AN06 sheet breakup length | 22 mm (16 d) | 19 mm (16 d) | checked online via CY19, RO24; low |

Read it as coarse: 140-340 µm with a 2.4x spread. Stage 2 alone does not make 99.5% credible; that goes through reviewer B's vaporization model.

**(d) Fan or cone angle.** A like doublet makes a fan normal to the jets' plane; HP64 gives its azimuthal mass distribution (S2.5). At 60° included, 90% of the mass lies within ±48° of forward and 2.9% goes back toward the face; at 90°, ±86° and 9.1%, the same order as EM59's "approximately 10%" backspray for a 2-on-2 element [integration mine; medium]. Unlike doublet: rotate that distribution to β [judgment; low]. Triplet, 2-on-2, 4-on-1: axial resultant and no checked distribution, so a flagged cone with [TBD] spread. A ring converging on one point: no model.

**(e) Free-jet length and jet stability.** L_fs ≤ 5-7 d (mean diameter for unlike elements); above about 10 d misalignment is magnified and drop size grows (SP8089 Secs 2.1.1.1.4, 3.1.1.1.4) [checked online; high]. Implied limits: L_fs below the intact length from reviewer B's round-jet model; turbulent, symmetric, stable jets (EM59 Sec IV), so clean hole entries and L/d near EM59's 20 (v0.4's 15-19 is close) [checked online; medium]. Default unlike doublet at 6 d: L_fs 7.8 mm, impingement 6.8 mm from the face, orifices 7.8 mm apart [arithmetic; high].

**Audit findings.** 7 confirmed: no unlike-impinging elements at the wall, fuel in the outer row (SP8089 Secs 2.1.1.1.1, 3.1.1.1.1). 6 confirmed: Stage 2 needs per-hole angles and positions, so Analyze mode comes first. 9 matters: ρV²d = 16ṁ²/(π²ρd³), so a 5% LOX density error is a 5% error in the Rupe ratio. 4: the criterion needs ΔP_o ≠ ΔP_f, while widely different ΔPs are undesirable for the feed system (SP8089 Sec 3.1.1.1.2), so the search must trade them.

### 2.2 Stage 3 (item 6)

**Shear coaxial (S3.1).** J, velocity ratio and recess are the standard parameters, with core length L/D ≈ 6/√J (MC13's own coaxial data run longer) and best mixing at one post diameter of recess (SP8089). All are gas/liquid results. With LOX and liquid ethanol at similar ΔP, ρU² ≈ 2ΔP for both, so J ≈ 1 [judgment; high] and there is no gas-assisted regime; SP8089's refs 5 and 14 cover liquid/liquid concentric tubes [TBD: not read]. Return `no-model` for liquid/liquid.

**TRW-style pintle (S3.2).** TMR, blockage factor and LMR (ST25); half-angle arccos(1/(1 + LMR)) (Cheng et al. via ST25), and LE21's full angle 2 arccos(1/(1 + TMR)) for a continuous gap [checked online; low: ST25's Table 2 does not reproduce from its printed formula, so confirm in Cheng et al.]. SP8089 Eq 5 for slotted liquid/liquid pintles. No drop-size correlation adopted [TBD: HE11].

**Swirl (S3.3-S3.7).** Abramovich/Bazarov inviscid theory gives filling coefficient, C_d, film thickness and angle from one geometric number; AL19 found Bazarov's C_d close to bi-swirl data [checked online; medium]. Rizk-Lefebvre and Wang-Lefebvre are the empirical checks. Two traps: Bazarov's K_B and Lefebvre's K_L are different quantities; and back-pressure raises C_d and narrows the spray (KH08) [checked online; medium], so 1-atm correlations overpredict the angle at 27.5 bar.

### 2.3 Code structure (item 6)

Elements are pure functions from geometry, streams and face gas state to spray lobes. The chamber never branches on element kind.

```ts
type Vec3 = [number, number, number];
type Interval = { lo: number; hi: number; basis: string[] };  // basis = correlation keys
interface Stream { prop: 'ox' | 'fuel'; mdot: number; rho: number; mu: number; sigma: number;
  d: number; LoverD: number; pos: Vec3; dir: Vec3; dp: number; cd: number }  // SI
interface FaceGas { p: number; rho: number; T: number }
interface Flag { qty: string; value: number; lo?: number; hi?: number; source: string;
  action: 'warn' | 'extrapolated' | 'no-model' | 'block' }
interface Lobe { origin: Vec3; axis: Vec3; mdotOx: number; mdotFuel: number;
  shape: { kind: 'fan'; normal: Vec3; psi: number[]; w: number[] }  // w sums to 1
       | { kind: 'cone'; halfAngle: Interval } | { kind: 'column' };
  startDist: Interval; dropMMD: { ox?: Interval; fuel?: Interval } }
interface ElementResult { lobes: Lobe[]; flags: Flag[]; model: string; version: string;
  mixing?: { Em?: Interval; criterion: number; optimum: number } }
interface ElementModel<G> { kind: string;
  evaluate(g: G, s: Stream[], gas: FaceGas): ElementResult;
  design?(t: { mdotOx: number; mdotFuel: number; dpOx: number; dpFuel: number }, gas: FaceGas): G }
```

The injector is JSON: a list of {kind, geometry, placement}; a registry maps kind to model. The chamber moves lobes to face coordinates, turns them into parcels for reviewer B's droplet march and reviewer C's mixing field, and computes E_m on that field (S2.3). Stage 1 becomes kind `showerhead`, one cone lobe per hole.

### 2.4 Item 9 within scope, ranked by effect

1. Common-point geometry (problem 1). 2. One ΔP for both propellants (problem 2). 3. Drop-size spread and ranges (problem 3). 4. Element size: smaller elements mix better, with little gain below 0.5-0.76 mm (SP8089 Sec 2.1.1.1.2) [checked online; medium]; 12 elements of about 140 N each is coarse. 5. Face heat: unlike impingement reacts next to the face (SP8089 Sec 2.1.1.1.1) [checked online; high]; flag it for an uncooled face. 6. Angled holes need an angle-tolerance input (S2.7). 7. Rename Stage 1 from "pintle" to `showerhead`. 8. Blowapart is hypergolic (SP8089; EM59) and not expected for LOX/ethanol [judgment; medium].

## 3. Implementable model spec

Common, per stream j: A_j = πd_j²/4 [m²]; V_j = ṁ_j/(ρ_j A_j) [m/s]; We_j = ρ_j V_j² d_j/σ_j; Re_j = ρ_j V_j d_j/μ_j; s_j = ρ_g/ρ_j. Out-of-range policy for every item [judgment; high]: design-guide limit exceeded → `warn`; correlation input outside its fitted range → compute, flag `extrapolated`, keep in the interval; no correlation → `no-model`, return null for that quantity. US units: V[ft/s] = V[m/s]/0.3048; d[in] = d[m]/0.0254; μ[lbm/(ft·s)] = 0.671969 μ[Pa·s]; ρ[lbm/ft³] = 0.0624280 ρ[kg/m³]; σ[dyn/cm] = 1000 σ[N/m].

**S2.1 Resultant direction.** ê_R = Σ ṁ_k V_k ê_k / |Σ ṁ_k V_k ê_k|, ê_k unit jet direction. Planar doublet: tan β = (ṁ_1V_1 sinγ_1 - ṁ_2V_2 sinγ_2)/(ṁ_1V_1 cosγ_1 + ṁ_2V_2 cosγ_2), γ = jet angle from the element axis [rad] [momentum conservation; judgment; high; ignores backsplash]. Range: any. Warn if the resultant axis reaches the wall before the chamber end.

**S2.2 Mixing criterion.** Unlike doublet: φ = ρ_f V_f² d_f/(ρ_o V_o² d_o); N_R = 1/(1 + φ); optimum φ = 1 [EM59 Eq 1; HRS72 Eq 2; checked online; high]. Design form, r = ṁ_o/ṁ_f: r²(ρ_f/ρ_o)(d_f/d_o)³ = 1 [EM59 Eq 4; checked online; high]. 2-on-2: same, constant 1, area ratio 1-3.5 [EM59 Eq 5]. 2-on-1 (1 = outer pair, 2 = center, A_1 one outer hole, ṁ_1 both outer holes): (ṁ_1/ṁ_2)²(ρ_2/ρ_1)(A_2/2A_1)^1.75 = k′, k′ = 0.66 at 60° included, 0.42 at 90°; A_2/2A_1 0.3-1.0; warn if D_2/D_1 is far from 0.79 [EM59 Eqs 6-7; checked online; medium]. 4-on-1: (ṁ_1/ṁ_2)²(ρ_2/ρ_1)(A_2/4A_1)^1.25 = 2.75 at 90°, 2.90 at 60°; A_2/4A_1 0.25-0.75 [EM59 Eq 9; checked online; medium]. General, 60° only: (d_c/d_ou)² = M[(ρ_ou/ρ_c)(ṁ_c/ṁ_ou)²]^0.7; M = 1.0 (1-on-1, 2-on-2), 1.6 (2-on-1), 3.5 (3-on-1), 9.4 (4-on-1), 27.5 (5-on-1); ṁ_c, ṁ_ou totals over all center and outside holes; d_ou one outside hole [SP8089 Eq 1, Table IV; checked online; medium]. Ranges: liquid/liquid, density ratio 0.54-1.85 [EM59], diameter ratio verified to 1.5 [SP8089 Sec 2.1.1.1.2], fully developed turbulent jets. Outside: `extrapolated`.

**S2.3 Rupe mixing efficiency.** E_m = 100[1 - (Σ_{r_i<R} w_i(R - r_i)/(W R) + Σ_{r_i>R} w_i(R - r_i)/(W(R - 1)))]. R = injected mass fraction of one propellant; r_i = local mass fraction in cell i; w_i = mass flow through cell i [kg/s]; W = Σw_i [HRS72 Eq 1 with collector factor C = 1; checked online; high]. Result 0-100; it depends on cell size, so the spec must fix the sampling grid [judgment; high]. Measured cold-flow values for circular jets: 50-85 [HRS72; checked online; high]. Design curve E_m(N_R) [TBD: digitize HRS72 Fig 1]; outside N_R 0.3-0.75 → `no-model`.

**S2.4 Drop size** (each returns a diameter in m; report the applicable set as an interval).
- a. Like doublet, 60° included: D̄ = 1.6e5 V_j⁻¹ (P_c/P_j)^-0.10 d_j^0.57 K_prop; D̄ mass median [µm], V_j [ft/s], d_j [in] [SP8089 Eq 4; checked online; medium]. Other angles: D̄_θ = (1.44 - 0.00734 θ) D̄_60, θ included angle [deg] [SP8089 Eq 7; checked online; medium].
- b. Unlike doublet, fuel side, 60°: D̄_f = 2.9e4 V_f^-0.766 (P_c/P_j)_f^-0.65 d_f^0.293 P_D^0.165 (d_o/d_f)^0.023 K_prop, P_D = ρ_f V_f²/(ρ_o V_o²) [SP8089 Eq 2; checked online; medium]. Oxidizer side [TBD: SP8089 ref 4].
- c. K_prop = [(μσ/ρ)_prop/(μσ/ρ)_ref]^(1/4), μ [lbm/(ft·s)], σ [dyn/cm], ρ [lbm/ft³]; reference Shellwax 270: μ 2.69e-3, σ 17, ρ 47.7 [SP8089 Eq 3; checked online; exponent read from a scan; medium]. P_c/P_j = jet centerline over mean dynamic pressure [TBD for real orifices; use 1.0 and flag]. Ranges [TBD: test matrix of SP8089 ref 4]; until known, flag `extrapolated` for LOX.
- d. d_D/d_0 = (2.62/12^(1/3)) s^(-1/6) [We_j f(θ)]^(-1/3), f(θ) = (1 - cosψ cosθ)²/sin³θ, θ half impingement angle, ψ = 0 on the sheet axis [RY95 via RO24 Eq 29; checked online; low].
- e. d_MMD/d_0 = 0.325 s^(-1/6) We_j^-0.201; We_j 6,820-21,900, air/water at 1 atm, 2θ = 100° [RO24 Eq 30; checked online; low].
- f. Cross-flow check once reviewer B's march gives ΔV: D_j/D_30 = 2.64√(D_j V_j) + 0.97 D_j ΔV, D [in], V [ft/s], D_30 volume-number mean; n-heptane, 90° doublets, air near 1 atm, D_j 0.029-0.089 in, ΔV up to 235 ft/s [IN58 summary; checked online; medium].

**S2.5 Sheet mass distribution (like doublet).** ṁ′(ψ) = ṁ_sheet sin³θ/(2π(1 - cosθ cosψ)²) [kg/(s·rad)], ψ ∈ (-π, π] in the sheet plane from the resultant, θ half impingement angle; ∫ṁ′dψ = ṁ_sheet exactly [HP64 thickness h r/d² = sin³θ/(4(1 - cosθ cosψ)²) via CY19 Eq 2; checked online; integration mine; medium]. Outputs: backflow fraction (|ψ| > π/2) and the half-angle holding 90% of mass. Range: equal jets, uniform profile. Turbulent impact-wave sheets: mean only, flag `extrapolated` [CY19; RO24].

**S2.6 Sheet breakup length.** x_b/d_0 = 13.56 (We_j s²)^-0.102 [AN06 via RO24 Eq 35 and CY19 Eq 4; checked online; low]. Range: water at 0.1-1.05 MPa ambient [CY19 Sec 3.2]; Penn State data We 500-4000 [PS95 Fig 3; checked online; medium]. Drops start at x_b along the lobe axis.

**S2.7 Geometry limits.** L_fs ≤ 5-7 d_mean: warn above 7, strong warn above 10 [SP8089 Secs 2.1.1.1.4, 3.1.1.1.4; checked online; high]. Included angle default 60°; above 60° warn "backsplash test needed"; 90° and above warn "face heat flux" [SP8089 Secs 2.1.1.1.3, 3.1.1.1.3; checked online; high]. Misimpingement e = L_fs tanδ/d_mean, δ = angle tolerance input [rad]; warn at e ≥ 0.2 [SP8089 Sec 2.1.1.1.4 data point, checked online; threshold is judgment; medium]. L_fs at or above reviewer B's intact length → `block` (jet breaks before impact) [judgment; high]. Like doublets: core fans canted to 41° included, wall fans parallel to the wall with oxidizer inboard [SP8089 Sec 3.1.1.1.3; checked online; medium]. No unlike element in the outer row [SP8089 Sec 3.1.1.1.1; checked online; high].

**S3.1 Shear coax, gas/liquid only.** J = ρ_a U_a²/(ρ_c U_c²), a annulus, c center; VR = U_a/U_c; L_core/D_c ≈ 6/√J [Raynal via MC13; checked online; low]. Recess l_r ≤ D_post, best at l_r = D_post [SP8089 Secs 2.1.1.1.4, 3.1.1.1.4; checked online; medium]; post chamfer ≤ 5° [SP8089 Sec 3.1.1.1.3; checked online; medium]. Liquid/liquid: `no-model`.

**S3.2 Pintle.** TMR = ṁ_r u_r/(ṁ_a u_a), r radial, a axial; BF = N d/(π d_p), N holes of diameter d, post diameter d_p; LMR = ṁ_r,i u_r/((d/w) ṁ_a,i u_a) per orifice i, w = πd_p/N, which reduces to TMR/BF [algebra; judgment; check against Cheng et al.]; θ_half = arccos(1/(1 + LMR)) [ST25 Eqs 1-4; checked online; low]. Range: LMR 0-2 "of primary interest" [ST25], cold-flow water. BF 0.3-0.7, skip distance near 1 d_p [Technion student project abstract, 2025; rule of thumb; low]. Slotted pintle: ρ_f V_f²(A S + 2ℓC)/(ρ_o V_o² S ℓ) = 1, A fuel annulus width, S slot width, ℓ slot length, C cross-influence term [SP8089 Eq 5; checked online; C is TBD from SP8089 ref 10]; 90° impingement [SP8089 Sec 3.1.1.1.3]. Drop size: `no-model`.

**S3.3-S3.7 Swirl, single closed type.** Inputs: nozzle radius r_n, inlet arm radius R_in, n tangential inlets of radius r_in, swirl chamber diameter D_s, ṁ, ρ, μ, σ, ΔP; all SI.
- S3.3 K_B = R_in r_n/(n r_in²) [VD10 Eq 7; YA18 Eq 1; checked online; high].
- S3.4 Solve √2(1 - φ)/φ^(3/2) = K_B for φ ∈ (0, 1) by bisection; the left side falls monotonically [VD10 Eq 12; YA18 Eq 3; checked online; high].
- S3.5 μ = φ√φ/√(2 - φ); ṁ = μπr_n²√(2ρΔP) [VD10 Eqs 10, 13; checked online; high]. Viscous: μ = 1/√((2 - φ)/φ³ + ξK_B²/C²), C = R_in/r_n, ξ [TBD: Vasiliev et al. 1993 tables or a cold-flow test] [VD10 Eq 15; checked online; medium].
- S3.6 Spray half-angle, report both: (i) ᾱ = arctan{(1 - φ)√8/[(1 + √(1 - φ))√φ]} [VD10 Eq 14; checked online; medium]; (ii) φ_e = φ/√(3 - 2φ), r_e = r_n√((2 - φ_e)/2), U_e = ṁ/(ρφ_e πr_n²), V_t = R_in ṁ/(ρnπr_in² r_e), θ = arctan(V_t/U_e) [YA18 Eqs 4-8 after BZ04; checked online; medium]. Test value: K_B = 2 gives φ = 0.5, μ = 0.289, (i) 49.5°, (ii) 37.9° [arithmetic; high]. Viscous (i): ᾱ = arcsin[2μψK_B/((1 + √(1 - φ))√(1 - ξμ²K_B²/C²))], ψ ≈ 1 for low viscosity [VD10 Eq 16; checked online; medium].
- S3.7 Film thickness h = r_n(1 - √(1 - φ)) in the nozzle, and with φ_e at the exit [from φ = 1 - r_gc²/r_n², VD10 Eq 6; judgment; high].
- Empirical cross-checks, K_L = A_p/(D_s d_o), A_p total inlet area, d_o = 2r_n: C_d = 0.35 K_L^0.5 (D_s/d_o)^0.25 [RL; checked online; medium]; 2θ = 6 K_L^-0.15 (ΔP d_o² ρ/μ²)^0.11 in degrees, K_L 0.1-0.4 [RL 1987; checked online; medium]; design ranges A_p/(D_s d_o) 0.19-1.21, D_s/d_o 1.41-8.13 [LA04 citing Lefebvre; checked online; medium]; h_0 = 0.00805√ρ FN/(d_o cosθ), FN = ṁ/√(ρΔP), SI, reproduces LA04 Table 2 (9.31e-5 m) [LA04 Eq 8; checked online; medium]; SMD = 4.52(σμ²/(ρ_g ΔP²))^0.25 (h cosθ)^0.25 + 0.39(σρ/(ρ_g ΔP))^0.25 (h cosθ)^0.75 [Wang & Lefebvre 1987 via LM17; from memory: check; medium]. All are 1-atm cold-flow results: flag `extrapolated` at chamber pressure (KH08).
- Bi-swirl coax: combine inner and outer sheets by mass and momentum, YA18 Eqs 13-14 (external mixing) or 15-19 (internal) [checked online; medium].

## 4. Change table

| Problem | Fix | Source | Label | Conf. | Model part |
|---|---|---|---|---|---|
| All jets aimed at one point | Element pattern; common point is unvalidated, no drop size or E_m | SP8089 3.1.1.1.4, Table IV | checked online | high | Stage 2 geometry |
| L_fs 14-40 d in common-point layouts | L_fs ≤ 5-7 d; angle-tolerance input; misimpingement flag | SP8089 2.1.1.1.4, 3.1.1.1.4 | checked online | high | S2.7 |
| One dP/Pc for both propellants | Separate ΔP_o, ΔP_f in sizing and search | EM59 Eq 4 | checked online | high | search |
| Impinging mixing from Gaussian spreading; no element criteria | Element returns E_m and mass-fraction lobes; EM59 Eqs 1-9, SP8089 Eq 1 | HRS72 Eq 1, Fig 1; EM59; SP8089 | checked online | high (def.), medium (criteria), low (E_m curve) | S2.2-S2.3 |
| Diesel correlations for impinging sprays | Interval over SP8089 Eqs 2, 4, 7, RY95, RO24; IN58 check | as cited | checked online | low | S2.4 |
| No fan geometry or breakup length | HP64 distribution; AN06 x_b | HP64, AN06 via CY19, RO24 | checked online | medium, low | S2.5-S2.6 |
| Oxidizer outer ring (finding 7) | No unlike elements in outer row; fuel outer | SP8089 3.1.1.1.1 | checked online | high | layout |
| Shear coax with two liquids | `no-model`; prefer bi-swirl or pintle | SP8089 2.1.1.1.1; MC13 | checked online | medium | Stage 3 |
| Pintle angle | TMR, BF, LMR, arccos form, flagged | ST25; LE21 | checked online | low | S3.2 |
| Swirl element | Bazarov chain, Rizk-Lefebvre check, both angles; K_B and K_L named apart | VD10; YA18; RL | checked online | medium | S3.3-S3.7 |
| US-unit correlations | Convert at boundary; one unit test per correlation (LA04 h_0 9.31e-5 m; φ 0.5 at K_B 2; SP8089 Eq 7 = 1 at 60°) | LA04; VD10; SP8089 | checked online | high | tests |
| Stage 1 named "pintle" | Rename `showerhead` | original prompt | judgment | high | naming |
| No element interface | Lobes, flags, intervals; chamber has no element-kind branches | this review | judgment | medium | architecture |

## 5. Open questions for the tool's author

1. Is "all jets to one point" a requirement (for example from the Fluent study), or can Stage 2 use element-wise impingement?
2. Can oxidizer and fuel run different injector ΔP (separate regulators), and how far apart?
3. What angle tolerance can the shop hold on 1.2-1.4 mm holes through 25 mm of material, and what entry shape do the holes have?
4. Burn duration and face cooling: impinging elements put the reaction 5-10 mm from the face.
5. Is a gaseous propellant possible (GOX, or LOX gasified in a jacket)? Without one, drop shear coax.
6. Which geometries did the Fluent comparison use for impinging, coaxial and pintle? Those are the first validation cases.
7. Is a cold-flow rig (water plus a simulant, a patternator) available to measure E_m and fan angle? Several TBDs need it.
8. Are the 12/12 hole counts fixed by the manifold, or free?

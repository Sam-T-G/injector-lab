# Review C: mixing, igniter placement, uncertainty presentation

Scope: original items 4 and 8, plus item 9 within this scope (pipeline steps 8-10).

**Assumed hardware** `[judgment]`: ground test stand, remote operation, burns of a few seconds, heat-sink or ablative chamber, igniter type not chosen.

**Default-case arithmetic** `[mine, from the brief's formulas; high for arithmetic, medium for inputs]`. Inputs:
- LOX: surface tension 13.2 mN/m, viscosity 0.19 mPa·s `[from memory: check]`.
- Ethanol: 22.3 mN/m, 1.1 mPa·s `[from memory: check]`.
- Tc 3200 K and MW 23, taken from the audit (not checked).

Results:
- Gas density 2.38 kg/m³; mean gas speed 134 m/s.
- Eq 6-10 gives tan(α/2) = 0.058 for LOX and 0.039 for ethanol.
- σ at 250 mm without the gas term: 7.6 mm (LOX), 5.2 mm (ethanol). The gas term alone adds 21.2 mm when x_v ≈ 0.
- Distance from ring to wall: LOX ring (r = 17.5 mm) 8.2 mm; ethanol ring (r = 11.8 mm) 13.9 mm.
- Nearest unlike-hole spacing: 6.8 mm.

**Sources** (checked online unless noted):
- **SP-8089**: Gill & Nurick, *Liquid Rocket Engine Injectors*, NASA SP-8089, 1976, §2.1.1.1.1, pp. 13-16.
- **Hersch**: M. Hersch, *A Mixing Model for Rocket Engine Combustion*, NASA TN D-2881, 1965. It builds on Bittker, NACA TN 4321, 1958 (not read).
- **Ferrenberg**: Ferrenberg, Hunt & Duesberg, *Atomization and Mixing Study*, Rocketdyne RI/RD85-312 (NASA NAS8-34504), 1985, §III Eq. 1. It restates Rupe's E_m from JPL PR 20-195, 1953 (not read).
- **ROCCID**: Muss, Nguyen & Johnson, NASA CR-187109, 1991, §2.2. Its Eq. 2.5 is a fit by Ito, Calhoon & Kors, NASA CR-121234, 1973 (not checked).
- **Taylor**: G. I. Taylor, "Diffusion by continuous movements", Proc. London Math. Soc. s2-20:196-212, 1922.
- **Danckwerts**: Appl. Sci. Res. A3:279-296, 1952. Citation checked; the formula's form comes from secondary sources.
- **HCG**: Hussein, Capp & George, J. Fluid Mech. 258, 1994. Spreading rate checked through secondary sources.
- **Crank**: *The Mathematics of Diffusion*, 2nd ed., 1975, Ch. 2. Chapter checked; the image method is from memory.
- **Repas**: *Hydrogen-Oxygen Torch Ignitor*, NASA TM-106493, 1994.
- **Sutton**: Sutton & Biblarz, 9th ed., 2017, §8.6 "Starting and Ignition". Title checked; content from memory.
- **Zabetakis**: USBM Bulletin 627, 1965. Existence checked; values not read.
- **7009B**: NASA-STD-7009B, 2024.

---

## 1. Three most serious problems

**1. The gas-phase spreading term makes mixing complete by construction.**
- **What the term is:** 0.1(x − x_v)/1.177 is the half-width growth of a free round jet into still surroundings. Its rate is about 0.09-0.1 `[HCG; medium]`, and 1.177 = √(2 ln 2) converts half-width to σ.
- **Why it doesn't fit:** this chamber has no still surroundings. 24 jets fill the section, and at about 20 m/s they move slower than the 134 m/s gas.
- **What it does:** with small x_v the term gives σ ≈ 21 mm at 250 mm, in a chamber of radius 25.75 mm. Every Gaussian covers the section, so η_mix → 1 for any hole pattern. Together with audit finding 1, this is the likely source of the 99.5% nominal `[judgment; medium]`.
- **What the source says:** showerhead mixing "relies primarily upon the turbulence generated during combustion" and "requires rather long chambers for complete mixing" `[SP-8089 p. 16; high]`.

**2. Mass leaks through the wall, and the 1.0 cap hides it (finding 5: mechanism confirmed).**
- With the brief's σ(x) and no gas term, 18% of the LOX mass and 0.6% of the ethanol mass fall outside the wall at 250 mm.
- With the gas term and x_v ≈ 0, the losses are 61% and 55% `[my arithmetic: offset 2D Gaussians integrated over the disk; medium]`.
- The mass that stays inside has O/F ≈ 1.40-1.46 instead of 1.70.
- If the tool's c* peak lies below 1.70 `[TBD: from its CEA table]`, the in-domain average beats c*(1.70), so η > 1. The cap hides a conservation bug.

**3. Two outputs claim more than the model knows.**
- "Best igniter location" comes from a steady end-of-chamber field weighted by flux, so it points at the liquid jets (finding 8 confirmed).
- The 99.5% nominal is displayed and optimized inside a 12.4-100% range.
- For a public tool whose output may be built, the igniter output must become a geometry-and-sequence check marked "not modeled". The efficiency must become a range-only display placarded per 7009B [M&S 26] `[checked online; high]`.

---

## 2. Answers

### 2.1 Critique of the current mixing model (item 1)

| Part | Verdict |
|---|---|
| Gaussian per hole | A fine shape for a dispersing cloud. The width must come from physics: an intact jet keeps σ = d/4 (the per-axis σ of a uniform disk) `[derived; high]` until it breaks up (reviewer B). |
| σ(x) = 0.5(0.5d + x tan(α/2)) | Putting the cone edge at 2σ is reasonable `[judgment; medium]`. The angle comes from Eq 6-10 used at Lp ≈ 5.9e5, against a fitted range of 185-800 `[my arithmetic; high]`, so the liquid width is not predicted. |
| Gas-jet term | No basis here (problem 1). |
| Danckwerts index | Variance / (ā(1 − ā)) `[Danckwerts; medium]`. Usable as a diagnostic if mass-weighted and computed on fuel mass fraction; the brief states neither. Injector data are reported as Rupe's E_m, so make E_m the primary index. |
| Capped stream-tube c* | The sum c* = (1/ṁ_t) Σ ṁ_i c*_i is standard `[Hersch Eq. 7a; high]`. The cap is not: delete it and enforce conservation. Run it on vapor composition, not liquid flux. |

**Finding 5, by sub-claim:**
- **Wall leak:** confirmed as the likely mechanism (problem 2). Medium confidence, because the code is not visible.
- **O/F instead of mixture fraction:** cannot be confirmed from the description. A c* lookup at each cell's own O/F, with mass weights, is the same as working in fuel fraction f, because O/F and f map one-to-one. It breaks only if O/F is averaged or interpolated before the lookup. Hersch works in fuel fraction; the metered fraction is the mass-weighted mean (Eq. 9) `[high]`.
- **"Convex" is backwards near the peak:** confirmed. Mass weights give Σ w_i f_i = f̄ exactly. Jensen's inequality then gives Σ w_i c*(f_i) ≤ c*(f̄) where c* is concave over the spread. Hersch's Table I shows c* falling to cold-gas values at f = 0 and f = 1, so convex tails exist. Still, at O/F 1.7, η > 1 signals a bug `[judgment; medium-high]`.
- **Added candidate:** cells outside the 0.3-4.0 O/F table. If they are clamped to the edge, a near-pure-LOX cell gets c*(4.0) instead of a cold-gas value `[judgment; medium]`.

### 2.2 A better equation-level mixing model (item 2)

**Physics.** Nonimpinging jets don't mix each other. Mixing comes from gas turbulence acting on vapor, and its quality "is primarily a function of the spacing between oxidizer and fuel jets" `[SP-8089 p. 16; high]`. Model three stages per hole: intact jet → droplet cloud → vapor dispersed by turbulence (spec M2-M4). Only the vapor enters c*.

**Spreading law: Taylor dispersion instead of free-jet growth.** Assume the Lagrangian autocorrelation is exp(−τ/T_L), and write t = x/U, i = u′/U, Λ = U·T_L. Then:

σ_t² = 2 i² Λ² (x/Λ − 1 + e^(−x/Λ)) `[Taylor 1922; exponential form derived here; high]`

- **Near the face,** σ_t = i·x. That is Hersch's mixing parameter α = T·L/S (T = turbulence intensity in percent, S = hole spacing).
- **Hersch's correlation:** log10 ψ = 0.497 − 1210/α², where ψ = (O/F)min/(O/F)max. Valid for α ≲ 37; mixing is complete near α ≈ 70 (Eq. 11) `[medium]`.
- **Measured intensity:** about 10% at the injector, falling to about 2% at 0.2 m, in one rocket chamber (Hersch 1965 citing his 1961 ARS J. measurement) `[checked online; low transfer to LOX/ethanol]`.
- **Default case:** L = 0.25 m, i = 2-10%, and S between 13.6 mm (twice the unlike spacing) and 35 mm (twice the distance from the hole-free center to the LOX ring). That gives α = 14-184 `[my arithmetic]`: anywhere from barely mixed to complete. The tool must show that span.
- **Current term for comparison:** the v0.4 gas term is equivalent to i ≈ 8.5%, near the top of Hersch's range.

**Wall: zero species flux (Neumann).** Hersch uses the same principle: the line midway between sources carries no net flux.
- Mirror images are exact only for a plane wall `[Crank Ch. 2, from memory: check; high]`.
- A single image at radius 2R_c − r_k holds only while σ is small next to the wall gap and R_c. Here σ grows to R_c.
- **Reference method:** a 2D finite-volume diffusion solve on the cross-section, with zero flux into cells outside the wall (M4). It conserves mass and handles overlap by construction.
- **Symmetry:** the 12+12 pattern with its half-pitch offset reduces to a 15° wedge with zero-flux sides, as long as every hole flows alike.

**Efficiency, per station on the vapor fields** (M6):
- Rupe E_m in oxidizer mass fraction `[Ferrenberg Eq. 1; high]`.
- Stream-tube η_mix in fuel fraction, using a c* table over f ∈ [0, 1] (Hersch's approach).
- Combined η_c* = η_vap · Σ w_i c*(f_i) / c*(f_inj) `[ROCCID Eqs. 2.7-2.9; high]`. Dividing by c*(f_inj) captures the drift of vapor O/F when LOX and ethanol vaporize at different rates; η_vap × η_mix at the injected O/F hides that drift.
- If only E_m is known (cold-flow patternator), use the ROCCID two-tube conversion (M7) as a cross-check.

**Distance.** Compute every metric as a curve from the face to the throat; Hersch adds the convergent length to L. Report η_c*(x), E_m(x), wall-zone O/F(x), and f maps at 0.25, 0.5 and 1.0 Lc. Those maps are the "mixing regions downstream" output the brief asks for.

**Calibration.** The new constants are i and Λ. Ship a sweep instead of defaults:
- i ∈ {0.02, 0.05, 0.10} `[Hersch's measured range; low]`
- Λ ∈ {smallest hole spacing, R_c} `[judgment; low]`

Show the resulting band. Fit later to hot-fire c* (reviewer A) or cold-flow E_m.

### 2.3 Igniter placement (item 3)

**Finding 8: confirmed.** Three more faults:
- **Wrong phase:** the weight uses O/F at the chamber end, where the gas is already products. Flammability belongs to a vapor mixture at local P and T, between lower and upper limits (ethanol/O2 limits: Zabetakis `[TBD: values]`). A log-normal centered on stoichiometric has no source.
- **Points at the jets:** flux weighting puts the "best" point on a jet, and liquid hitting a spark gap or torch exit quenches it.
- **Not a mounting location:** interior points can't hold an igniter. Igniters enter through the face, the wall or the throat.

**What must be true at the igniter during start** `[judgment; medium unless labeled]`:
1. **Running before the propellants arrive.** Hot gas is flowing, confirmed by a signal, before or as propellants arrive. Repas starts the torch "just as the main rocket engine propellants enter the engine", with igniter pressure on an abort channel `[Repas; high]`.
2. **Reaches both propellants near the face.** The chamber starts near 1 bar. LOX warmed in the manifold flashes to gas, while ethanol at 293 K gives little vapor (about 6 kPa vapor pressure `[from memory: check; medium]`). So the igniter must heat and vaporize the fuel itself. Repas's flame was about 0.3 m long at about 3100 K, "sufficient to vaporize and ignite" several propellant pairs `[checked online]`.
3. **Kept dry.** No liquid jet strikes the torch exit or electrode.
4. **Little unburned propellant collects before ignition** (hard-start overpressure) `[Sutton §8.6, from memory: check; medium]`.
5. **Purged.** A purge keeps hot gas out of the port during the run. Repas used a purge 60 psig (about 4 bar) above chamber pressure for the whole firing `[checked online]`.

**Placement rules** `[judgment; low-medium]`:
- **Face torch:** the center port (r = 0) is free, inside the 11.8 mm ethanol ring. Its plume must reach both rings near the face; prove that with an igniter-only firing.
- **Wall torch or spark plug:** place it near the face and aim it radially along an ethanol-hole azimuth (0° + 30k). That path runs between two LOX jets 9 mm apart and meets an ethanol jet. A bare spark plug is a weak start source for LOX/ethanol, so prefer a spark-torch. Repas shows side-wall, through-injector, resonator and spacer-ring mounts.
- **Pyrotechnic:** insert it through the throat to sit on axis near the face. The throat must clear the igniter body, and burn time must exceed propellant arrival time plus margin. A break-wire must confirm ignition before the valves open.

**What a steady-state model can say:** little. It can check port clearance from the holes, and it can show the steady gas near a wall port (oxidizer-rich hot gas there means erosion). It can also estimate a few start numbers (M10):
- manifold fill time per side, and the arrival skew between sides;
- propellant accumulated per millisecond of delay.

The LOX fill time is only a lower bound, because chill-down boils LOX.

### 2.4 Uncertainty and safety for a public tool (item 4)

**Display rules:**
1. **Value plus range.** Every output shows value, range, the driver of the range, and validity status. If an efficiency range is wider than 0.05 absolute, show the range only, labeled "model cannot narrow this" `[judgment; medium]`.
2. **Validity status:** "in range"; "extrapolated" (name the correlation, parameter and factor, for example "Lp 5.9e5 vs fitted 185-800"); or "outside" (number suppressed). 7009B [M&S 26] requires the limit type, how far it was exceeded, and the consequence `[high]`.
3. **Not validated.** "Not validated against hot-fire data" stays on every efficiency, drop-size and mixing output until reviewer A's validation exists.
4. **No safety language.** Never print "safe" or show green checks; write "within model limits".
5. **Sensitivity.** Show the top three drivers of each range (7009B App. E.4.5, results sensitivity).
6. **Search.** Never rank designs on a quantity whose uncertainty exceeds the differences between them (reviewer A covers the replacement).

**Block vs warn:**

| Condition | Action |
|---|---|
| Conservation check fails (M9) | Block: internal error |
| Feed pressure < Pc + injector ΔP + manifold loss | Block |
| Propellant not liquid at the injector inlet | Block |
| Orifice cavitation | Block that design point |
| Holes overlap, leave the face, or hit an igniter port; chamber doesn't fit | Block |
| O/F or Pc outside the CEA table | Block (no thermochemistry extrapolation) |
| Correlation used more than 10× outside its range | Suppress that output only `[judgment; medium]` |
| Correlation 1-10× outside its range | Warn, with factor |
| Wall-zone O/F above global | Strong warning |
| Result on a scan boundary | Warn |
| Injector ΔP/Pc below the stiffness band | Warn; hard floor `[TBD: reviewer A]` |
| Mixing constants at default sweep | Warn; show band |
| Ignition | Always "not modeled" |

**Every export carries** (JSON plus a readable header):
- **Versions:** model version, commit hash, build date, property-database version and hash, CEA table version.
- **Inputs:** every input, flagged as user-set or defaulted, with its pedigree ([M&S 24]).
- **Assumptions:** listed by ID.
- **Per output:** value, range and the scenario set behind it, units, validity flags with extrapolation factors, correlation source, and validation status.
- **Messages:** all warnings and blocks met during the run ([M&S 27]).
- **Permissible use** ([M&S 14]): "Preliminary sizing and planning of cold-flow test articles. Not for hot-fire hardware without independent analysis." `[judgment]`
- **Not checked:** structure and pressure rating, thermal, ignition, stability, oxygen compatibility and cleanliness, feed system.
- **Integrity:** a hash of the export.

### 2.5 Item 9 within this scope (ranked by effect)

1. Gas-jet spreading term (problem 1).
2. Wall leak, cap, possible edge clamping (problem 2).
3. **Liquid flux used where vapor belongs.** Unequal vaporization shifts the vapor O/F.
4. **Wall-zone O/F not reported, with LOX in the outer ring.** Production practice puts fuel orifices nearest the wall for a "fuel-rich, compatible environment" `[SP-8089 pp. 13, 15; high]`. Hersch shows a fuel-rich wall zone costs little performance `[medium]`. With a heat-sink chamber, this is a survival question.
5. **Uniform flow per hole assumed.** A single inlet bore feeding a ring channel can starve the far holes, and that error passes straight into mixing. Add a perturbation case `[judgment; medium]`.
6. **Evaluated only at the chamber end.** Use stations from the face to the throat.
7. **Face-region resolution.** σ is about 0.3 mm at the face. Use erf cell-integrated sources so cell mass is exact on any grid.
8. **"Flammable area" at the end plane** means nothing; drop it.

---

## 3. Implementable model spec

SI units throughout. p ∈ {o, f} is the propellant; k is the hole.

**M1 Holes.** Each hole k has position (y_k, z_k) [m], propellant p_k, mass flow ṁ_k [kg/s] and diameter d_k [m]. Optional perturbation: ṁ_k ← ṁ_k(1 + δ_k), with Σ δ_k ṁ_k = 0 per propellant and |δ_k| ≤ 0.2 `[judgment]`. Reject inputs outside that.

**M2 Liquid width.**
- σ_L,k = d_k/4 for x < x_b,k.
- σ_L,k = d_k/4 + 0.5(x − x_b,k) tan θ_k for x ≥ x_b,k.

x_b,k [m] is the breakup length and θ_k the spray half-angle, both from reviewer B `[TBD]`. Droplet turbulent dispersion is neglected `[judgment; medium]`. Until B lands, use x_b = 0 and the v0.4 angle, labeled "placeholder, extrapolated".

**M3 Vapor source.** s_k(x) = ṁ_k dF_k/dx [kg s⁻¹ m⁻¹], where F_k ∈ [0, 1] is the vaporized fraction from reviewer B's droplet march `[TBD]`. The lateral shape N_k is a 2D Gaussian with σ_L,k, erf-integrated per cell and renormalized over active cells so that Σ N_k A_cell = 1.

**M4 Vapor transport (reference).** For each propellant p, the vapor mass-flux field g_p(x, y, z) [kg m⁻² s⁻¹] obeys:

```
∂g_p/∂x = κ(x) ∇⊥² g_p + Σ_{k∈p} s_k(x) N_k(y,z;x)
κ(x)    = i² Λ (1 − exp(−x/Λ))     [m]
```

- **Parameters:** i is turbulence intensity (dimensionless) and Λ the Lagrangian length [m]. κ = ½ d(σ_t²)/dx `[derived from Taylor; high for the math, low for the values]`.
- **Grid:** Cartesian finite-volume, h ≤ R_c/100. A cell is active if its center is at r ≤ R_c. Faces into inactive cells carry zero flux. In wedge mode (identical holes), the 15° wedge sides are zero-flux.
- **Stepping:** backward Euler or Crank-Nicolson in x; explicit stepping only if Δx ≤ h²/(4κ_max).
- **Assumptions:** plug flow, κ uniform across the section, no recirculation, no density-driven area change `[judgment; medium]`.
- **Valid range:** x ≥ x_near = 2 × smallest unlike spacing `[judgment; low]`. Below x_near, label the field "near field not modeled". Accept i ∈ [0.01, 0.20] and Λ ∈ [d_min, 2R_c]; reject other inputs.
- **Default:** run the §2.2 sweep and report the min and max of every metric.

**M5 Fast preview (optional).**
- g_p = Σ_k ṁ_k F_k [G(σ_k) + G_image(σ_k)], with σ_k² = σ_L,k² + σ_t².
- The image is centered at radius 2R_c − r_k, same azimuth `[Crank, from memory: check]`.
- Renormalize each hole's in-domain integral to ṁ_k F_k.
- Valid while σ_k ≤ 0.25 R_c `[judgment; low]`. Above that, switch to M4.

**M6 Metrics** at 50 or more stations from the face to Lc (plus the convergent length if known).

Per active cell i:
- G_i = g_o,i + g_f,i and w_i = G_i A_i / Σ G A.
- f_i = g_f,i / G_i (w_i = 0 when G_i = 0).
- r_i = 1 − f_i, f̄ = Σ w_i f_i, R̄ = 1 − f̄.

```
E_m   = 1 − [ Σ_{r_i<R̄} w_i (R̄ − r_i)/R̄ + Σ_{r_i>R̄} w_i (r_i − R̄)/(1 − R̄) ]
I_s   = Σ w_i (f_i − f̄)² / (f̄(1 − f̄))
η_mix = Σ w_i c*(f_i) / c*(f̄)
η_vap = Σ_k ṁ_k F_k / Σ_k ṁ_k
η_c*  = η_vap · Σ w_i c*(f_i) / c*(f_inj)
```

- **Sources and checks:** E_m is Ferrenberg Eq. 1, with (R − R_sa)/(R − 1) rewritten as (R_sa − R)/(1 − R) `[high]`; a value outside [0, 1] blocks. The efficiency lines follow Hersch Eq. 7a and ROCCID Eqs. 2.7-2.9 `[high]`.
- **c*(f) table:**
  - CEA equilibrium at the station Pc over the widest O/F range where CEA converges `[TBD]`.
  - Cold unreacted-gas c* at f = 0 and f = 1 (Hersch Table I) `[medium]`.
  - Monotone interpolation between; warn if more than 1% of the mass falls in the interpolated gap.
- **Wall zone:** annulus R_c − δ < r ≤ R_c, with δ = max(1 mm, 0.1 R_c) `[judgment; low]`. OF_wall = Σ g_o A / Σ g_f A over the annulus; warn if it exceeds the global O/F.
- **Ripple factor:** ψ = min OF / max OF over cells with G_i > 0.01 max G.

**M7 E_m-only fallback** `[ROCCID Eqs. 2.4-2.5; low for showerheads]`:

```
η_m  = 0.449 − 0.399 E_m + 0.944 E_m²          (E_m as a fraction)
MR_R = MR_M η_m,   MR_L = MR_M / η_m
X_R  = (1 + MR_R) / ((1 + η_m)(1 + MR_M)),   X_L = 1 − X_R
η_c* = η_vap [X_R c*(MR_R) + X_L c*(MR_L)] / c*(MR_inj)
```

I checked that the tube fractions conserve both propellants `[derived; high]`. η_m is not monotonic below E_m ≈ 0.21. Accept E_m ∈ [0.5, 1] `[judgment; medium]`; refuse anything outside.

**M8 Hersch cross-check** `[Hersch Eq. 11; medium]`:
- α = 100·i·L/S.
- ψ_H = 10^(0.497 − 1210/α²) for α ≤ 37; above that, print "outside Eq. 11".

Compare against the M6 ψ on a regular-grid test pattern. A gap of more than a factor of 2 needs an explanation in the test log `[judgment; low]`.

**M9 Checks** (every run):
- Mass: |Σ g_p A − Σ_{k∈p} ṁ_k F_k| / Σ_{k∈p} ṁ_k F_k ≤ 1e-9, else block.
- Composition: f̄ must match the vaporized-fuel ratio to 1e-9.
- η_mix > 1 + 1e-9 blocks, unless the c* table is convex at f̄; then warn.
- No cap.

**M10 Igniter geometry and start.** Every output is labeled "ignition not modeled".
- **Face port** (r_ig, θ_ig, d_ig): clearance c_k = |p_ig − p_k| − (d_ig + d_k)/2. Block if c_k < 0; warn if c_k < c_min `[TBD]`.
- **Wall port:** warn if it aims within ±(d_o + d_ig)/(2r_o) rad of a LOX hole.
- **Pyrotechnic:** require D_throat − d_pyro ≥ 2c_min.
- **Fill time** t_fill,p = ρ_p V_man,p / ṁ_p [s]. Label the LOX value "lower bound". Report the skew Δt = t_fill,o − t_fill,f and the accumulated mass (ṁ_o + ṁ_f) × 1e-3 kg per millisecond of delay.

**M11 Export:** the §2.4 list, written as JSON with a schema version.

---

## 4. Change table

| Problem | Fix | Source | Label | Confidence | Model part |
|---|---|---|---|---|---|
| Free-jet gas spreading saturates η_mix | Taylor dispersion with an i, Λ sweep (M4) | Taylor; Hersch; SP-8089 p. 16 | checked online + derived | medium | mixing |
| Gaussian tails lost through wall | Zero-flux finite-volume solve (M4); images for previews only | Crank Ch. 2; Hersch | from memory: check / checked | high | mixing |
| η capped at 1.0 | Delete the cap; conservation checks (M9) | Hersch Eqs. 7a, 9 | checked online + judgment | high | efficiency |
| Possible O/F averaging or edge clamping | f from summed fluxes; c* over f ∈ [0, 1] | Hersch Eqs. 8-9, Table I | checked online | medium | efficiency |
| Liquid flux used for mixing | Vapor fields; ROCCID η_c* | ROCCID Eqs. 2.7-2.9 | checked online | high | efficiency |
| Danckwerts as primary metric | Rupe E_m primary, mass-weighted | Ferrenberg Eq. 1 | checked online | high | metrics |
| End plane only | Stations from face to throat; f maps | Hersch | checked online | medium | output |
| Wall O/F unreported, LOX at wall | OF_wall(x) plus warning | SP-8089 pp. 13, 15 | checked online | high | output, safety |
| Equal flow per hole | Perturbation case (M1) | none | judgment | medium | mixing |
| Igniter heuristic | Geometry and sequence checks, "not modeled" (M10) | Repas; Sutton §8.6 | checked / from memory: check | medium | igniter |
| 99.5% nominal inside 12-100% | Range-only display, placards, sensitivity | 7009B [M&S 26, 32, 33] | checked online | high | UI |
| Export lacks provenance | Export record (M11) | 7009B [M&S 14, 24, 27] | checked online | high | export |
| "Flammable area" at end plane | Delete | none | judgment | high | output |

---

## 5. Open questions for the tool's author

1. Is the flux field integrated over the disk, over a square, or renormalized? What grid spacing?
2. Is local O/F formed from summed fluxes or by averaging O/F? What happens to cells outside O/F 0.3-4.0?
3. Which x_v feeds the gas term, and how often is x_v < 50 mm in the search?
4. Is the Danckwerts index area- or mass-weighted, and on which variable?
5. Is the overlaid field liquid or vapor flux? Do LOX and ethanol vaporize at separate rates?
6. At what O/F does your CEA c* peak at 27.5 bar?
7. Which igniter type do you plan? What are the valve sequence, LOX chill-down procedure and manifold volumes?
8. What are the burn time, chamber material and cooling? Is LOX in the outer ring fixed?
9. Can you run water cold-flow tests with a collection grid to calibrate E_m and i?
10. What c* efficiency did you expect, and from which reference engines?

# Open questions for the tool's author

Collected from the four reviews. Answers change model inputs or checks.

**Hardware and test plan**
1. Burn time, chamber material, cooling method? These set the heat-flux and wall-zone limits.
2. Is the 35 bar at the injector inlet or the tank? Regulated or blowdown? How is the budget built (manifold loss, margin)?
3. Which igniter (torch, spark-torch, pyrotechnic)? Valve sequence, LOX chill-down, manifold volumes?
4. Will the stand measure each propellant's flow, face pressure and thrust? c* efficiency needs all three.
5. Is a removable chamber spool feasible, so L* can be a test variable?
6. What c* efficiency must the engine reach, and from which reference engines?

**Geometry**
7. Can the rings be swapped (ethanol outer) or a fuel film ring added? LOX on the outer ring puts oxidizer-rich gas on the wall.
8. Hole inlet edge (sharp or chamfered) and finish? Measured LOX temperature at the holes?
9. Cylinder and convergent lengths, convergent angle, nozzle type and exit angle of the CAD part.
10. Can you run water cold-flow tests with a collection grid? That calibrates the mixing model.

**The v0.4 code** (the port had to guess these; see port-notes.md)
11. Were Gaussian tails past the wall dropped? Was local O/F formed from summed fluxes?
12. Was vaporization computed per propellant? At what temperature were surface tension, viscosity and density taken?
13. Which textbook is Example 5-1 from?
14. Do you have NASA TR R-67 (Priem & Heidmann, 1960)? It would let the tool cross-check its vaporization.

**Stage 2** (impinging jets, review D)
15. "All jets to one common point" puts free-jet lengths at 14-40 hole diameters; SP-8089 limits them to 5-7. Would doublets or triplets per element work instead?
16. Separate pressure drops per propellant are needed to reach the equal-momentum mixing optimum. Can the two manifolds run at different inlet pressures?

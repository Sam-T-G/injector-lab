# Reviewer prompt D: impinging jets (Stage 2), coaxial, pintle and swirl (Stage 3), code structure

Follow `docs/review/prompts/_shared-rules.md`. Write to `docs/review/D-stage2-stage3.md`.

Scope: original items 5 and 6, plus item 9 within this scope.

1. Stage 2, impinging doublets and triplets (like and unlike). Give the equations and criteria to implement, with sources and valid ranges:
   - momentum ratio and the equal-momentum (Rupe) criterion, and Rupe's mixing factor E_m
   - impingement angle effects and the resultant momentum direction
   - fan or sheet formation, sheet breakup length and drop size (for example Dombrowski & Hooper, Ryan et al., Anderson et al., Ashgriz)
   - fan angle or spray cone prediction from the collision
   - free-jet length before impingement and the jet-stability limits it implies
2. Stage 3:
   - shear coaxial: momentum flux ratio J, velocity ratio, recess
   - TRW-style pintle: total momentum ratio, blockage factor, spray angle
   - swirl: Bazarov or Lefebvre swirl-injector design equations, film thickness, spray cone angle, discharge coefficient

   For each, give the standard design equations, the empirical correlations and their ranges, with sources.
3. Code structure. The port is TypeScript with a pure physics library (no UI imports) and JSON input/output. Propose an interface that makes injector element types pluggable: what an element model takes in, what it must return (per-element mass flux field or spray description, drop size, angles, valid-range flags), and how the shared chamber model consumes it. Keep it small.
4. Item 9 within this scope.

# Port notes: v0.4 Python to TypeScript

The author's Python source, STL and CEA table were not available. The TypeScript library in `src/physics/` reimplements the v0.4 pipeline from its written description (pipeline steps 1 to 12 and the default-case output). Where the description was silent, the port made the choices below and marked each one in the code.

## Parity with the author's default case

1700 N, 35 bar inlets, O/F 1.70. Test: `tests/v04-parity.test.ts`.

| Quantity | v0.4 (author) | Port | Notes |
|---|---|---|---|
| Chosen Pc | 27.5 bar | 27.5 bar | exact |
| Chosen L* | 1.25 m | 1.25 m | exact |
| Chosen dP/Pc | 15% | 15% | exact |
| Chamber length | 250 mm | 250.0 mm | |
| Chamber diameter | 51.5 mm | 51.40 mm | follows from mass flow |
| Throat diameter | 23.0 mm | 22.99 mm | |
| Mass flow | 0.666 kg/s | 0.6646 kg/s | 0.2% low; the author's Isp interpolation is unknown |
| LOX holes | 12 x 1.404 mm | 12 x 1.4042 mm | |
| Ethanol holes | 12 x 1.210 mm | 12 x 1.2091 mm | |
| LOX jet velocity | 19.7 m/s | 19.73 m/s | |
| Ethanol jet velocity | 22.6 m/s | 22.63 m/s | |
| Efficiency, pessimistic | 12.4% | 12.5% | |
| Efficiency, nominal | 99.5% | 99.6% | |
| Efficiency, optimistic | 100% | 100% (raw 100.09%, capped) | |

CEA check: c* = 1718.3 m/s at 20 bar, O/F 1.6 (author: 1718).

## Choices the port made

| Item | Choice | Why |
|---|---|---|
| Hole length | injector thickness minus manifold depth: 50.8 - 29 = 21.8 mm | gives L/d 15.5 and 18.0, inside the author's "about 15 to 19" |
| Liquid properties | CoolProp saturated liquid at the given temperature | the author's database file was not available |
| Laminar limit for friction | Re < 2300 | not stated |
| Gas density for drop breakup and spray angle | chamber gas density from CEA (= Pc / R Tc) | the description uses rho_g without saying where |
| Vaporization efficiency | mass-weighted average of the two propellants | not stated |
| Spray tails at the wall | dropped (`wallMode: 'truncate'`) | reproduces 99.5% nominal; reflecting them gives 99.4% and a different L* |
| Local O/F outside 0.3 to 4.0 | clamped to the range | the v0.4 table stopped there |
| "Both present" area | each propellant above 5% of its mean flux | not stated |
| "Flammable" area | both present and flammability weight above exp(-0.5) | not stated |
| Igniter stations | 10, 25, 50, 75% of the chamber length; interior r <= 0.8 R, wall r >= 0.9 R | not stated |
| Injector mass | solid aluminum disk, chamber diameter plus 15 mm margin each side | not stated; does not bind at the default |
| Chamber fits the body | chamber diameter plus 5 mm wall each side <= max body diameter | not stated |
| Hole spacing | ring pitch >= 3 hole diameters, and ring gap >= 3 of the larger hole diameter | the ring-gap check is an addition |
| O/F | an input (default 1.70) | the output lists 1.70; peak sea-level Isp at 27.5 bar is at O/F 1.65, within 0.03% |
| Textbook Example 5-1 self-test | not ported | the textbook is not named in the description |

## What the port confirmed

Numbers from the default case, nominal scenario:

- **Spray tails past the wall.** Only 40% of the LOX and 49% of the ethanol land inside the wall at the chamber exit. The 99.6% nominal efficiency is computed on that remainder, whose O/F is 1.37 instead of 1.70 (audit finding 5).
- **The 1.0 cap is active.** The optimistic stream-tube value is 1.0009 before the cap.
- **Fourth-power sensitivity.** With the breakup limit active, drop lifetime scales as v_rel^-4 (unit test). Pessimistic LOX drops live 15.2 ms, nominal 0.60 ms; the gas residence time is 1.81 ms (audit findings 1 and 2).
- **Scan edge.** The chosen dP/Pc of 15% is the bottom of the search range.
- **Pc 27.5 bar is set by the LOX inlet limit.** At 30 bar the LOX side needs 35.05 bar against 35 available.

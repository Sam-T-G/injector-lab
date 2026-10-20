# Injector Lab

Size a two-ring showerhead injector for a LOX and ethanol rocket engine in the browser. Every efficiency comes with its uncertainty band and the reasons the model cannot support it.

Live: https://sam-t-g.github.io/injector-lab/

**Status: not validated against hot-fire data.** Do not build hardware from these numbers alone.

## What it does

Enter thrust, mixture ratio, inlet pressure limits, propellant temperatures, hole counts and injector geometry. The tool either searches chamber pressure, L* and injector pressure drop, or evaluates one point you give it. It returns:

- engine size (chamber and throat diameters, chamber length, mass flow)
- hole diameters, nearest drill sizes, jet velocities, discharge coefficients, feed pressures
- drop sizes, vaporization and mixing for three cases (pessimistic, nominal, optimistic)
- c* efficiency and delivered Isp as a range
- a 3D drawing with the spray envelopes, a cross-section mixture-ratio map, and a map of the search

## Model

The current model is `v0.4-port`, a TypeScript reimplementation of a Python tool (v0.4) from its author's written description. It reproduces that tool's default case to the reported precision; see [docs/port-notes.md](docs/port-notes.md) for the parity table and every assumption the port had to make.

The v0.4 model has known problems, listed in [docs/review/](docs/review/). The app shows them next to each result. A revised model built from the reviews is next.

Data:

- Combustion: NASA CEA (python package `cea` 3.3.4), equilibrium, infinite-area combustor, expanded to 1.01325 bar. Tables in `src/data/`, built by `tools/build_cea_tables.py`.
- Liquids: CoolProp 8.0.0, saturated liquid. Built by `tools/build_props.py`.

## Layout

```
src/physics/   pure model code, no DOM; the JSON contract is in types.ts
src/render/    Three.js drawing
src/ui/        form, results, maps
src/worker.ts  runs the search off the main thread
tools/         Python scripts that build the data tables
tests/         Vitest suite, including the v0.4 parity test
docs/          port notes and the review set
```

## Run it

```sh
pnpm install
pnpm dev        # local server
pnpm test       # model tests
pnpm typecheck
pnpm build
```

Rebuild the data tables:

```sh
python3 -m venv .venv && .venv/bin/pip install -r tools/requirements.txt
.venv/bin/python -I tools/build_cea_tables.py
.venv/bin/python -I tools/build_props.py
```

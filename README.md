# Injector Lab

Size a two-ring showerhead injector for a LOX and ethanol rocket engine in the browser. Every efficiency comes with its uncertainty band and the reasons the model cannot support it.

Live: https://sam-t-g.github.io/injector-lab/

**Status: not validated against hot-fire data.** Do not build hardware from these numbers alone.

## What it does

Enter thrust, chamber pressure, mixture ratio, inlet pressure limits, propellant temperatures, hole counts and injector geometry, or the dimensions of hardware you already have. It returns:

- engine size (chamber and throat diameters, chamber length, mass flow)
- hole diameters, nearest drill sizes, jet velocities, discharge coefficients, feed pressures
- jet breakup, drop sizes, vaporization and mixing, swept over the inputs nobody has measured yet
- c* efficiency and delivered Isp as a range, and how both change along the chamber
- the built engine's pressure, thrust and O/F across that range
- a 3D drawing with liquid cores and vapor spread, and a cross-section mixture-ratio map

## Models

- **v0.5** (default) is rebuilt from four reviews in [docs/review/](docs/review/): chamber pressure as an input, sizing at a design efficiency, Priem's droplet vaporization march, turbulent vapor mixing with a zero-flux wall, an uncertainty sweep shown as a band, a chug screen, a wall-zone check, Bartz throat heat flux, and an Analyze mode for given hardware. What changed and why: [docs/model-v0.5.md](docs/model-v0.5.md).
- **v0.4** is a TypeScript reimplementation of the original Python tool from its author's written description. It reproduces that tool's default case to the reported precision and stays in the app for comparison; see [docs/port-notes.md](docs/port-notes.md).

Data:

- Combustion: NASA CEA (python package `cea` 3.3.4), equilibrium, infinite-area combustor, expanded to 1.01325 bar. Tables in `src/data/`, built by `tools/build_cea_tables.py`.
- Liquids: CoolProp 8.0.0, saturated liquid. Built by `tools/build_props.py`.
- Droplet film gas: CEA equilibrium products with frozen transport properties, and vapor heat capacities. Built by `tools/build_film.py`.

## Layout

```
src/physics/   pure model code, no DOM; v0.4 at the top level, v0.5 in v05/
src/render/    Three.js drawing
src/ui/        form, results, maps
src/worker.ts  runs the search off the main thread
tools/         Python scripts that build the data tables
tests/         Vitest suite, including the v0.4 parity test
docs/          model notes, port notes, open questions and the review set
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
.venv/bin/python -I tools/build_film.py
```

"""Gas-side property tables for the droplet march (model v0.5).

Usage: python -I tools/build_film.py  (needs `pip install cea numpy`)
Writes src/data/film-lox-ethanol.json:
  products: equilibrium combustion products at (Pc, O/F, T), frozen transport properties,
            used at the droplet film reference temperature;
  vapor:    ideal-gas heat capacity of O2 and C2H5OH vapor versus T (blowing correction).
"""
import json
import pathlib

import numpy as np
import cea

FUEL, OX = ("C2H5OH(L)", 293.15), ("O2(L)", 90.17)
PC = [10.0, 20.0, 30.0, 40.0, 50.0, 60.0]
OF = [0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.5, 3.0, 3.5, 4.0]
T = [float(t) for t in np.arange(600.0, 3600.0 + 1e-9, 150.0)]
VAPOR_T = [float(t) for t in np.arange(100.0, 3600.0 + 1e-9, 100.0)]


def products():
    names = [FUEL[0], OX[0]]
    reac = cea.Mixture(names)
    prod = cea.Mixture(names, products_from_reactants=True)
    solver = cea.EqSolver(prod, reactants=reac, transport=True)
    sol = cea.EqSolution(solver)
    fields = {k: np.full((len(PC), len(OF), len(T)), np.nan) for k in ["mu", "k", "cp", "MW"]}
    failed = 0
    for a, pc in enumerate(PC):
        for b, of in enumerate(OF):
            w = reac.of_ratio_to_weights(np.array([0.0, 1.0]), np.array([1.0, 0.0]), of)
            for c, t in enumerate(T):
                solver.solve(sol, cea.TP, t, pc, w)
                if not sol.converged:
                    failed += 1
                    continue
                fields["mu"][a, b, c] = sol.viscosity * 1e-4
                fields["k"][a, b, c] = sol.conductivity_fr * 0.1
                fields["cp"][a, b, c] = sol.cp_fr * 1000.0
                fields["MW"][a, b, c] = sol.MW
    return fields, failed


def vapor_cp(name):
    m = cea.Mixture([name])
    w = np.array([1.0])
    return [float((m.calc_property(cea.ENTHALPY, w, t + 1.0) - m.calc_property(cea.ENTHALPY, w, t - 1.0)) / 2.0) for t in VAPOR_T]


def main():
    root = pathlib.Path(__file__).resolve().parent.parent
    fields, failed = products()
    if failed:
        raise SystemExit(f"{failed} product points did not converge")
    doc = {
        "source": f"NASA CEA python package (lib {cea.lib_version}): TP equilibrium products with frozen transport; "
                  "vapor cp from the CEA thermo library by enthalpy difference",
        "units": {"T": "K", "Pc": "bar", "mu": "Pa s", "k": "W/m/K", "cp": "J/kg/K", "MW": "kg/kmol"},
        "Pc": PC,
        "OF": OF,
        "T": T,
        "products": {k: np.round(v, 8).tolist() for k, v in fields.items()},
        "vapor": {
            "T": VAPOR_T,
            "lox": {"MW": 31.9988, "cp": [round(x, 3) for x in vapor_cp("O2")]},
            "ethanol": {"MW": 46.0684, "cp": [round(x, 3) for x in vapor_cp("C2H5OH")]},
        },
    }
    path = root / "src" / "data" / "film-lox-ethanol.json"
    path.write_text(json.dumps(doc, separators=(",", ":")))
    print(f"wrote {path.relative_to(root)} ({path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()

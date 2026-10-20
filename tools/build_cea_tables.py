"""Build equilibrium combustion tables with NASA CEA for the web app.

Usage: python -I tools/build_cea_tables.py  (needs `pip install cea numpy`)
Writes src/data/cea-<pair>.json. The browser never runs CEA; it interpolates these tables.
"""
import json
import pathlib
import sys

import numpy as np
import cea

P_AMB = 1.01325  # bar, sea-level exit pressure for the ideal Isp

PAIRS = {
    "lox-ethanol": {
        "fuel": ("C2H5OH(L)", 293.15),
        "ox": ("O2(L)", 90.17),
        "label": "LOX / ethanol (100%)",
    },
}

PC_BAR = np.arange(5.0, 60.0 + 1e-9, 2.5)
OF = np.unique(np.round(np.concatenate([
    [0.02, 0.03, 0.05, 0.075],
    np.arange(0.10, 0.30, 0.05),
    np.arange(0.30, 4.00 + 1e-9, 0.05),
    np.arange(4.25, 10.0 + 1e-9, 0.25),
    [11, 12.5, 15, 17.5, 20, 25, 30, 40, 50],
]), 4))

FIELDS = ["cstar", "Tc", "MW", "gamma", "rho", "IspSL", "IspVac", "eps", "cp", "mu", "kfr", "cpfr", "Prfr"]


def solve_pair(fuel, ox):
    names = [fuel[0], ox[0]]
    temps = np.array([fuel[1], ox[1]])
    reac = cea.Mixture(names)
    prod = cea.Mixture(names, products_from_reactants=True)
    solver = cea.RocketSolver(prod, reactants=reac, transport=True)
    sol = cea.RocketSolution(solver)
    out = {k: np.full((len(PC_BAR), len(OF)), np.nan) for k in FIELDS}
    failed = 0
    for i, pc in enumerate(PC_BAR):
        for j, of in enumerate(OF):
            w = reac.of_ratio_to_weights(np.array([0.0, 1.0]), np.array([1.0, 0.0]), float(of))
            hc = reac.calc_property(cea.ENTHALPY, w, temps) / cea.R
            solver.solve(sol, w, float(pc), [float(pc) / P_AMB], hc=hc, iac=True)
            if not sol.converged:
                failed += 1
                continue
            # Point 0 = chamber, 1 = throat, 2 = exit at P_AMB.
            out["cstar"][i, j] = sol.c_star[0]
            out["Tc"][i, j] = sol.T[0]
            out["MW"][i, j] = sol.MW[0]
            out["gamma"][i, j] = sol.gamma_s[0]
            out["rho"][i, j] = sol.density[0]
            out["IspSL"][i, j] = sol.Isp[2]
            out["IspVac"][i, j] = sol.Isp_vacuum[2]
            out["eps"][i, j] = sol.ae_at[2]
            out["cp"][i, j] = sol.cp_eq[0] * 1000.0  # kJ/kg-K -> J/kg-K
            out["mu"][i, j] = sol.viscosity[0] * 1e-4  # millipoise -> Pa s
            out["kfr"][i, j] = sol.conductivity_fr[0] * 0.1  # mW/(cm K) -> W/(m K)
            out["cpfr"][i, j] = sol.cp_fr[0] * 1000.0
            out["Prfr"][i, j] = sol.Pr_fr[0]
    return out, failed


def main():
    root = pathlib.Path(__file__).resolve().parent.parent
    dest = root / "src" / "data"
    dest.mkdir(parents=True, exist_ok=True)
    for key, pair in PAIRS.items():
        out, failed = solve_pair(pair["fuel"], pair["ox"])
        if failed:
            print(f"{key}: {failed} points did not converge", file=sys.stderr)
        doc = {
            "pair": key,
            "label": pair["label"],
            "source": f"NASA CEA python package {cea.__dict__.get('__version__', 'cea')} "
                      f"(lib {cea.lib_version}), equilibrium, infinite-area combustor, "
                      f"exit at {P_AMB} bar",
            "fuel": {"name": pair["fuel"][0], "T_K": pair["fuel"][1]},
            "ox": {"name": pair["ox"][0], "T_K": pair["ox"][1]},
            "units": {"Pc": "bar", "cstar": "m/s", "Tc": "K", "MW": "kg/kmol", "gamma": "-",
                      "rho": "kg/m^3", "IspSL": "m/s", "IspVac": "m/s", "eps": "-",
                      "cp": "J/kg/K", "mu": "Pa s", "kfr": "W/m/K", "cpfr": "J/kg/K", "Prfr": "-"},
            "Pc": PC_BAR.round(4).tolist(),
            "OF": OF.tolist(),
            "fields": {k: [[None if np.isnan(v) else round(float(v), 6) for v in row]
                           for row in out[k]] for k in FIELDS},
        }
        path = dest / f"cea-{key}.json"
        path.write_text(json.dumps(doc, separators=(",", ":")))
        print(f"wrote {path.relative_to(root)} ({path.stat().st_size // 1024} KB), failed={failed}")


if __name__ == "__main__":
    main()

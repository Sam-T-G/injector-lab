"""Build saturated-liquid property tables with CoolProp for the web app.

Usage: python -I tools/build_props.py  (needs `pip install CoolProp numpy`)
Writes src/data/liquids.json.
"""
import json
import pathlib

import numpy as np
import CoolProp
import CoolProp.CoolProp as CP

FLUIDS = {
    # Dense steps near the critical point, where the droplet march needs sigma and h_fg going to zero.
    "lox": {"coolprop": "Oxygen", "label": "Liquid oxygen",
            "T": np.concatenate([np.arange(60.0, 150.0, 2.0), np.arange(150.0, 154.0 + 1e-9, 0.5)])},
    "ethanol": {"coolprop": "Ethanol", "label": "Ethanol (100%)",
                "T": np.concatenate([np.arange(170.0, 500.0, 5.0), np.arange(500.0, 512.0 + 1e-9, 1.0)])},
}


def table(name, temps):
    rows = {k: [] for k in ["rho", "mu", "sigma", "psat", "cp", "k", "hvap"]}
    for T in temps:
        rows["rho"].append(CP.PropsSI("D", "T", T, "Q", 0, name))
        rows["mu"].append(CP.PropsSI("V", "T", T, "Q", 0, name))
        rows["sigma"].append(CP.PropsSI("I", "T", T, "Q", 0, name))
        rows["psat"].append(CP.PropsSI("P", "T", T, "Q", 0, name))
        rows["cp"].append(CP.PropsSI("C", "T", T, "Q", 0, name))
        rows["k"].append(CP.PropsSI("L", "T", T, "Q", 0, name))
        rows["hvap"].append(CP.PropsSI("H", "T", T, "Q", 1, name) - CP.PropsSI("H", "T", T, "Q", 0, name))
    return {k: [float(f"{v:.6g}") for v in vals] for k, vals in rows.items()}


def main():
    root = pathlib.Path(__file__).resolve().parent.parent
    out = {
        "source": f"CoolProp {CoolProp.__version__}, saturated liquid at T",
        "units": {"T": "K", "rho": "kg/m^3", "mu": "Pa s", "sigma": "N/m", "psat": "Pa",
                  "cp": "J/kg/K", "k": "W/m/K", "hvap": "J/kg"},
        "fluids": {},
    }
    for key, f in FLUIDS.items():
        name = f["coolprop"]
        out["fluids"][key] = {
            "label": f["label"],
            "Tcrit": CP.PropsSI("Tcrit", name),
            "pcrit": CP.PropsSI("pcrit", name),
            "Ttriple": CP.PropsSI("Ttriple", name),
            "M": CP.PropsSI("M", name),
            "T": f["T"].round(3).tolist(),
            **table(name, f["T"]),
        }
    path = root / "src" / "data" / "liquids.json"
    path.write_text(json.dumps(out, separators=(",", ":")))
    print(f"wrote {path.relative_to(root)} ({path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()

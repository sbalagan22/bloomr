---
name: stl-modeling
description: Generate, inspect, repair, and export 3D models as STL files from Python using a code-CAD workflow. Use this skill whenever the user asks to create an STL, design a 3D-printable part, build a parametric model, generate a mesh, "make a 3D model of X", fix a broken/non-manifold STL, convert between 3D formats (STEP/OBJ/3MF/STL), or do any programmatic CAD. Strongly prefer this skill over ad-hoc OpenSCAD or raw numpy-stl attempts — it picks the right library for the job and avoids the usual LLM failure modes (non-manifold meshes, silent boolean failures, wrong units, inverted normals).
---

# STL 3D Modeling

A skill for producing clean, printable, manifold STL files from code. Built to stop Claude from reaching for OpenSCAD reflexively and shipping broken meshes.

## Library selection (do this first, don't skip)

Pick the library based on **what the user is modeling**, not what you remember first:

| If the task is... | Use | Why |
|---|---|---|
| Mechanical parts, brackets, enclosures, anything with fillets/chamfers, boolean ops, threads, gears | **build123d** (preferred) or **cadquery** | Real B-rep kernel (OCCT). Filleting actually works. Units are explicit. Exports clean manifold STL. |
| Organic shapes, sculpts, characters, terrain, anything "mesh-native" | **trimesh** + primitives, or SDF via `sdf` library | B-rep struggles here; meshes are the right primitive. |
| Procedural / mathematical surfaces (gyroids, heightmaps, signed distance fields) | **sdf** (fogleman/sdf) or **trimesh** with numpy | SDFs handle implicit geometry cleanly. |
| Repairing / inspecting / converting an existing STL/OBJ/3MF | **trimesh** | Best mesh analysis + repair tooling in Python. |
| The user explicitly asked for OpenSCAD | OpenSCAD via `solidpython2` | Only if asked. Do not default here. |

**Default to build123d** for anything mechanical. It is strictly better than CadQuery's old API for code generation: cleaner builder context, better error messages, same OCCT kernel underneath.

**Never default to `numpy-stl`.** It writes STL bytes but has zero geometry — you'd be hand-rolling triangles, which is how non-manifold garbage gets produced.

## Install

```bash
pip install build123d trimesh numpy
# optional:
pip install cadquery-ocp sdf solidpython2
```

build123d ships with the OCCT kernel as a wheel — no system deps on Linux/macOS/Windows.

## Standard workflow

1. **Clarify units and critical dimensions.** Ask if not given. Default to millimeters (3D printing standard). Never guess wall thickness for printable parts — minimum 1.2mm for FDM, 0.8mm for resin.
2. **Model parametrically.** Expose dimensions as top-of-file variables so the user can tweak without re-reading the script.
3. **Export STL** with a sane tessellation tolerance (linear 0.1mm, angular 0.1 rad is a good default for printing; tighter for visual/rendering).
4. **Validate the mesh** with trimesh before handing it over (see Validation section). Non-optional.
5. **Report stats**: volume, surface area, bounding box, watertight status, triangle count.

## build123d quickstart (the 90% case)

```python
from build123d import *

# Parameters — expose these at the top
WIDTH = 40
DEPTH = 30
HEIGHT = 20
WALL = 2
FILLET_R = 3

with BuildPart() as part:
    Box(WIDTH, DEPTH, HEIGHT)
    # Hollow it
    offset(amount=-WALL, openings=part.faces().sort_by(Axis.Z)[-1])
    # Round outer vertical edges
    fillet(part.edges().filter_by(Axis.Z), radius=FILLET_R)

# Export — build123d uses OCCT's tessellator
part.part.export_stl("output.stl", tolerance=0.1, angular_tolerance=0.1)
```

Key build123d idioms Claude gets wrong:
- Use `BuildPart()` context, then access `.part` for the final `Part` object.
- `fillet()` / `chamfer()` take edge selections, not distances-first. Use `.edges().filter_by(...)` or `.edges().sort_by(...)`.
- `offset(amount=-wall, openings=face)` is how you make a shell/enclosure. `openings` takes the face(s) to leave open.
- Units: build123d is unitless by default but treats numbers as mm for STL. If the user says inches, multiply by 25.4 explicitly and comment it.

## trimesh for mesh work, repair, and validation

```python
import trimesh

mesh = trimesh.load("output.stl")

# Validation — always run this before claiming success
report = {
    "watertight": mesh.is_watertight,
    "winding_consistent": mesh.is_winding_consistent,
    "volume_mm3": float(mesh.volume) if mesh.is_volume else None,
    "surface_area_mm2": float(mesh.area),
    "bbox_mm": mesh.bounding_box.extents.tolist(),
    "triangles": len(mesh.faces),
    "euler_number": mesh.euler_number,  # should be 2 for a single closed solid
}

# If not watertight, attempt repair
if not mesh.is_watertight:
    trimesh.repair.fill_holes(mesh)
    trimesh.repair.fix_normals(mesh)
    trimesh.repair.fix_winding(mesh)
```

If after repair it's still not watertight, **say so explicitly**. Do not hand the user a broken STL and call it done.

## Validation checklist (run before delivering any STL)

- [ ] `is_watertight == True`
- [ ] `is_winding_consistent == True`
- [ ] `volume > 0` and matches rough expectation (catch unit errors — a 4 cm cube should be ~64,000 mm³, not 64)
- [ ] Bounding box matches the parameters the user specified
- [ ] Triangle count is reasonable (a simple box should not be 500k triangles — tessellation tolerance is wrong)
- [ ] For printable parts: minimum wall thickness, no floating disconnected shells (`mesh.split()` should return 1 body unless intentional)

## Common failure modes and how to avoid them

1. **Silent boolean failures.** In OpenSCAD, a failed union produces warnings nobody reads. In build123d/OCCT, catch exceptions around boolean ops and report them.
2. **Non-manifold edges from coincident faces.** When subtracting, make cutters *slightly larger* than the host (e.g., hole depth = thickness + 0.01) so faces don't overlap exactly.
3. **Inverted normals after mirror.** Run `trimesh.repair.fix_normals()` after any mirror operation.
4. **Unit confusion.** STL has no units. Always state the unit in your final summary to the user ("exported in mm").
5. **Over-tessellation.** Don't set tolerance to 0.001 unless the user needs render quality — file sizes explode.
6. **Huge files from organic shapes.** For mesh-native work use `trimesh.smoothing.filter_taubin` then decimate with `mesh.simplify_quadric_decimation(target_face_count)`.

## Research and references

Claude's training data on build123d is thin and changes fast. **Before writing non-trivial build123d code, fetch the current docs** if web access is available:

- build123d docs: https://build123d.readthedocs.io/ — check `tutorials/` and `objects_3d.html` for current API
- build123d cheat sheet: https://build123d.readthedocs.io/en/latest/cheat_sheet.html
- CadQuery docs (similar concepts, older API): https://cadquery.readthedocs.io/
- trimesh docs: https://trimesh.org/
- sdf library: https://github.com/fogleman/sdf
- Printables / Thingiverse for reference dimensions on common parts

If web access is not available, **say so** and flag that the build123d API you're writing may be slightly stale — don't pretend otherwise.

## Delivering to the user

Final response should include:
1. The parametric Python script (ready to re-run with different parameters)
2. The validated `.stl` file path
3. Stats block: dimensions, volume, triangle count, watertight status
4. Any caveats (non-watertight regions, assumed units, assumed tolerances)

Do not deliver an STL without the stats block. The stats block is what proves you didn't hand over garbage.
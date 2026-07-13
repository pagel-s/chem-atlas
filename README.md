# Chemistry Atlas

An interactive 3D chemistry atlas. Eleven guided exhibits, each posing one question
and answering it with a single observable 3D scene — built as a mental-model aid
for secondary-school through first-year undergraduate chemistry.

**Live:** https://pagel-s.github.io/chem-atlas/

## Exhibits

Battery ion/electron choreography · molecular recognition (caffeine · A2A receptor) ·
snowflake growth · Pt catalysis of CO oxidation · the chemistry of smell (OR51E2) ·
reaction mechanisms (SN2 · Suzuki · Diels–Alder) · orbitals & hybridization ·
VSEPR geometry · crystal lattices · the electrochemical cell.

## Develop

```bash
npm install
npm run dev            # local dev server
npm run build          # production build to dist/
npm run check:science  # science-integrity assertions
```

## Stack

React + Vite, Three.js for the hand-built scenes, and 3Dmol.js for the
experimentally-derived protein structures.

## Data

The two protein exhibits use experimental coordinates from the RCSB PDB:
**5MZP** (A2A adenosine receptor with caffeine) and **8F76** (OR51E2 with
propionate). Every other scene is a disclosed teaching model — each exhibit
states in-app what it simplifies; none is a physical simulation.

## License

[MIT](LICENSE).

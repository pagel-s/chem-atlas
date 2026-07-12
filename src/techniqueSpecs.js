// Analytical techniques. Every number here is a real, quotable literature value, and every
// place the model departs from reality is stated in `evidence` rather than glossed over.
//
// Axis mappings (progress 0..1 -> the swept quantity):
//   IR    wavenumber 4000 -> 400 cm-1      p = (4000 - v) / 3600
//   Raman Raman shift 0 -> 3000 cm-1       p = shift / 3000
//   UV    wavelength 200 -> 700 nm         p = (lambda - 200) / 500
//   NMR   chemical shift 10 -> 0 ppm       p = (10 - delta) / 10
//   MS    m/z 0 -> 60                      p = mz / 60
//   XRD   theta 0 -> 60 deg                p = theta / 60
//   Fluor. is a process, not a sweep: progress runs absorb -> relax -> emit.

// All-trans polyene absorption maxima (hexane). Standard textbook values; the spacing is
// NOT linear, which is why this is a lookup table and not a formula.
export const POLYENE = {
  2: { name: '1,3-butadiene', lambdaMax: 217 },
  3: { name: '1,3,5-hexatriene', lambdaMax: 258 },
  4: { name: '1,3,5,7-octatetraene', lambdaMax: 290 },
  5: { name: 'decapentaene', lambdaMax: 334 },
  6: { name: 'dodecahexaene', lambdaMax: 364 },
};

const irX = (v) => (4000 - v) / 3600;
const ramanX = (s) => s / 3000;
const nmrX = (d) => (10 - d) / 10;
const msX = (mz) => mz / 60;
const xrdX = (deg) => deg / 60;

// NaCl with Cu K-alpha: d(200) = a/2 = 2.82 A, lambda = 1.5406 A -> sin(theta) = n * 0.2732
export const XRD_D = 2.82;
export const XRD_LAMBDA = 1.5406;
const braggAngle = (n) => Math.asin(n * XRD_LAMBDA / (2 * XRD_D)) * 180 / Math.PI; // 15.86, 33.10, 55.02

export const techniqueSpecs = [
  {
    id: 'ir',
    label: 'IR',
    title: 'Infrared spectroscopy',
    short: 'A changing dipole absorbs',
    question: 'Why does a vibrating bond absorb infrared light only sometimes?',
    summary: 'Scan infrared light across CO2. Every mode is vibrating the whole time — but light is only absorbed by a vibration that changes the molecular dipole.',
    evidence: 'CO2 fundamentals: v1 symmetric stretch 1333 cm-1 (IR-inactive), v2 bend 667 cm-1 (doubly degenerate, IR-active), v3 asymmetric stretch 2349 cm-1 (IR-active). Only one component of the degenerate bend is drawn. Vibrational amplitudes are exaggerated for visibility, and band intensities are schematic; rotational fine structure is omitted.',
    control: ['4000 cm⁻¹', '400 cm⁻¹'],
    legend: ['C=O bonds', 'net dipole (gold arrow)', 'absorption band', 'IR-silent mode'],
    parts: {
      'Dipole moment': 'The vector sum of the bond dipoles. IR absorption requires this to CHANGE as the molecule vibrates (dμ/dQ ≠ 0). If it stays at zero throughout the cycle, no infrared photon can be absorbed however hard the bond is vibrating.',
      Carbon: 'The central carbon. In the asymmetric stretch it moves against the two oxygens; in the symmetric stretch it does not move at all.',
      Oxygen: 'The two oxygens. Whether they move together or in opposition is what decides if the dipole changes.',
      'Absorption band': 'A dip in transmitted infrared intensity. It appears at the frequency of an IR-active vibration.',
    },
    steps: [
      ['All the modes are already vibrating', 'A molecule does not sit still and start vibrating when you shine light on it. CO2 is vibrating in all its modes the whole time. The question infrared asks is narrower: at this frequency, is a photon absorbed?'],
      ['Asymmetric stretch: 2349 cm⁻¹', 'The two C=O bonds stretch out of step, so the molecule is momentarily lopsided and its dipole swings back and forth. A changing dipole can exchange energy with the oscillating electric field of the light, so the photon is absorbed — the strongest band in the spectrum.'],
      ['Symmetric stretch: 1333 cm⁻¹, and silent', 'Here both bonds lengthen together. The molecule stays symmetric, so the dipole is zero at every instant of the cycle. There is nothing for the light to couple to, and no band appears — even though this vibration is just as real and just as energetic as the others.'],
      ['Bend: 667 cm⁻¹', 'Bending destroys the linear symmetry and creates a dipole perpendicular to the axis, so infrared is absorbed again. This mode is doubly degenerate — there are two perpendicular bends at the same energy — and only one is drawn here.'],
    ],
    check: { q: 'CO2\'s symmetric stretch is a real, energetic vibration. Why is there no infrared band at 1333 cm⁻¹?', options: ['The vibration is too fast for infrared light', 'The dipole moment stays zero throughout the vibration, so there is nothing for the light to couple to', 'The mode is too weak to detect with a normal spectrometer'], answer: 1, explanation: 'IR absorption needs a changing dipole moment (dμ/dQ ≠ 0). In the symmetric stretch the molecule stays symmetric, so the dipole is zero at every point of the cycle and the mode is rigorously IR-inactive — not merely weak.' },
    guidedViews: [
      { progress: .06, part: 'Oxygen' },
      { progress: irX(2349), part: 'Dipole moment' },
      { progress: irX(1333), part: 'Dipole moment' },
      { progress: irX(667), part: 'Dipole moment' },
    ],
    observationPrompts: [
      'Scan the beam. The molecule is always vibrating; only the absorption changes.',
      'At 2349 cm⁻¹ the gold dipole arrow flips back and forth — that is what absorbs.',
      'At 1333 cm⁻¹ the bonds stretch hard, but the dipole arrow never appears.',
      'At 667 cm⁻¹ bending tips the dipole sideways and the band returns.',
    ],
    modes: [
      { p: irX(2349), kind: 'asym', wn: 2349, active: true },
      { p: irX(1333), kind: 'sym', wn: 1333, active: false },
      { p: irX(667), kind: 'bend', wn: 667, active: true },
    ],
    readout: (progress) => {
      const wn = Math.round(4000 - progress * 3600);
      const near = [
        { p: irX(2349), name: 'v3 asymmetric stretch', active: true },
        { p: irX(1333), name: 'v1 symmetric stretch', active: false },
        { p: irX(667), name: 'v2 bend (degenerate)', active: true },
      ].find((m) => Math.abs(progress - m.p) < .05);
      return [
        ['Wavenumber', `${wn} cm⁻¹`],
        ['Mode at this energy', near ? near.name : 'none'],
        ['dμ/dQ', near ? (near.active ? '≠ 0' : '= 0 (stays symmetric)') : '—'],
        ['Infrared', near ? (near.active ? 'absorbed → band' : 'IR-inactive → no band') : 'transmitted'],
      ];
    },
    spectrum: () => ({
      kind: 'transmittance',
      title: 'IR spectrum · CO₂',
      subtitle: 'dips = absorption · v₁ is rigorously absent',
      left: '4000', right: '400 cm⁻¹',
      peaks: [{ x: irX(2349), h: 1, label: '2349' }, { x: irX(667), h: .8, label: '667' }],
      marks: [{ x: irX(1333), label: '1333 IR-silent' }],
    }),
  },

  {
    id: 'raman',
    label: 'Raman',
    title: 'Raman spectroscopy',
    short: 'A changing polarisability scatters',
    question: 'How does Raman see exactly the vibration infrared cannot?',
    summary: 'Same molecule, different question. Raman does not need a changing dipole — it needs a changing polarisability, and in a centrosymmetric molecule that makes the two techniques exact complements.',
    evidence: 'CO2 v1 is Raman-active, but it does not appear as a single line: it is in Fermi resonance with the overtone 2v2 (2 x 667 = 1334 cm-1), and the interaction splits it into the well-known doublet at 1285 and 1388 cm-1. The electron cloud is drawn as a qualitative polarisability ellipsoid whose volume tracks (rL + rR); it is not a computed charge density. Anti-Stokes scattering (weaker, by the Boltzmann factor) is omitted.',
    control: ['0 cm⁻¹', '3000 cm⁻¹'],
    legend: ['laser in (unshifted)', 'Stokes photon (shifted)', 'electron cloud = polarisability', 'Raman-silent mode'],
    parts: {
      Polarisability: 'How easily the electron cloud is distorted by the light\'s electric field. Raman needs this to CHANGE during the vibration (dα/dQ ≠ 0) — shown here as the cloud swelling and shrinking.',
      Laser: 'One fixed frequency goes in. Almost all of it scatters back at the same frequency (Rayleigh); only about one photon in a million is shifted.',
      'Stokes photon': 'A scattered photon that left behind exactly one vibrational quantum, so it emerges with less energy. That energy loss — not the photon\'s own frequency — is what the spectrum plots.',
      Carbon: 'The carbon. Note it does not move at all in the symmetric stretch, which is precisely the mode Raman sees.',
      Oxygen: 'The oxygens. Moving together changes the cloud\'s size; moving in opposition does not.',
    },
    steps: [
      ['Scattering, not absorption', 'Raman is not absorption. A single laser frequency goes in and almost all of it bounces straight back unshifted. Roughly one photon in a million leaves having handed one vibrational quantum to the molecule, and the size of that energy loss is the Raman shift.'],
      ['The symmetric stretch is Raman-active', 'Both bonds lengthen together, so the electron cloud swells and contracts and the polarisability changes. That is exactly what Raman scattering needs — this is the mode infrared could not touch.'],
      ['But it is a Fermi doublet, not a line', 'CO2 does not give one peak here. v1 (1333) sits almost on top of the overtone 2v2 (1334); the two mix, repel, and appear as a doublet at 1285 and 1388 cm⁻¹. It is the textbook example of Fermi resonance.'],
      ['Mutual exclusion', 'The bend and the asymmetric stretch, which dominate the IR, are rigorously absent here: the cloud shifts but never changes size. In any centrosymmetric molecule every mode is IR-active or Raman-active and never both — which is why the two spectra are run together.'],
    ],
    check: { q: 'Why does the CO2 symmetric stretch appear as two Raman peaks (1285 and 1388) rather than one at 1333?', options: ['The spectrometer resolves two isotopes of carbon', 'v1 is in Fermi resonance with the overtone 2v2, which lies at almost the same energy; the two mix and split apart', 'The molecule vibrates at two different speeds'], answer: 1, explanation: 'v1 (1333 cm⁻¹) and the overtone 2v2 (2 x 667 = 1334 cm⁻¹) are nearly degenerate and have the same symmetry, so they interact, repel one another, and share intensity — giving the classic Fermi doublet at 1285 and 1388 cm⁻¹.' },
    guidedViews: [
      { progress: .05, part: 'Laser' },
      { progress: ramanX(1336), part: 'Polarisability' },
      { progress: ramanX(1336), part: 'Stokes photon' },
      { progress: ramanX(2349), part: 'Polarisability' },
    ],
    observationPrompts: [
      'One laser colour in; watch what comes back out.',
      'At the symmetric stretch the cloud visibly breathes — polarisability is changing.',
      'Read the spectrum: two peaks, not one. That splitting is Fermi resonance.',
      'At 2349 the cloud shifts but never changes size, so Raman sees nothing.',
    ],
    modes: [
      { p: ramanX(667), kind: 'bend', wn: 667, active: false },
      { p: ramanX(1336), kind: 'sym', wn: 1336, active: true },
      { p: ramanX(2349), kind: 'asym', wn: 2349, active: false },
    ],
    readout: (progress) => {
      const shift = Math.round(progress * 3000);
      const near = [
        { p: ramanX(667), name: 'v2 bend', active: false },
        { p: ramanX(1336), name: 'v1 symmetric stretch', active: true },
        { p: ramanX(2349), name: 'v3 asymmetric stretch', active: false },
      ].find((m) => Math.abs(progress - m.p) < .05);
      return [
        ['Raman shift', `${shift} cm⁻¹`],
        ['Mode at this energy', near ? near.name : 'none'],
        ['dα/dQ', near ? (near.active ? '≠ 0 (cloud breathes)' : '= 0 (size fixed)') : '—'],
        ['Raman', near ? (near.active ? 'Stokes photon → doublet' : 'Raman-inactive (IR-active)') : 'Rayleigh only'],
      ];
    },
    spectrum: () => ({
      kind: 'peaks',
      title: 'Raman spectrum · CO₂',
      subtitle: 'v₁ splits into a Fermi doublet',
      left: '0', right: '3000 cm⁻¹',
      peaks: [{ x: ramanX(1285), h: .9, label: '1285' }, { x: ramanX(1388), h: 1, label: '1388' }],
      marks: [{ x: ramanX(667), label: '667 IR only' }, { x: ramanX(2349), label: '2349 IR only' }],
    }),
  },

  {
    id: 'uvvis',
    label: 'UV-Vis',
    title: 'UV-Vis spectroscopy',
    short: 'Conjugation makes colour',
    question: 'Why does a longer conjugated chain absorb at a longer wavelength?',
    summary: 'Sweep the wavelength across a polyene and change how many double bonds it has. The pi electrons behave like a particle in a box: a longer box means a smaller gap.',
    evidence: 'Measured lambda-max for all-trans polyenes in hexane: butadiene 217, hexatriene 258, octatetraene 290, decapentaene 334, dodecahexaene 364 nm. The spacing is not linear, so these are tabulated rather than fitted. Energy levels are drawn qualitatively; band shape, molar absorptivity and solvent shifts are not modelled.',
    control: ['200 nm', '700 nm'],
    legend: ['conjugated chain', 'HOMO / LUMO levels', 'promoted electron', 'transmitted colour'],
    parts: {
      'Conjugated chain': 'Alternating double and single bonds let the pi electrons delocalise along the whole chain. The chain length is the length of the box they live in.',
      'HOMO-LUMO gap': 'The energy step the electron must make. A longer box lowers the gap — like a guitar string, a longer string gives a lower note.',
      Electron: 'One electron in the highest occupied level. It is promoted only when the photon energy matches the gap exactly.',
      Photon: 'Light of the swept wavelength. E = hc/λ, so a longer wavelength carries less energy.',
    },
    steps: [
      ['Only a matching photon is absorbed', 'Light of every wavelength passes through. Nothing happens until a photon carries precisely the energy of the HOMO-LUMO gap; then it is absorbed and an electron is promoted.'],
      ['Butadiene absorbs at 217 nm', 'With two conjugated double bonds the gap is large, so it takes a high-energy ultraviolet photon. Nothing in the visible is removed, so butadiene is colourless.'],
      ['A longer box, a smaller gap', 'Raise the conjugation control. Each extra double bond lengthens the box the pi electrons occupy, which lowers the gap and pushes lambda-max to longer wavelength: 217 → 258 → 290 → 334 → 364 nm. Note the steps are not equal.'],
      ['Where colour comes from', 'Keep going and absorption reaches the visible. Beta-carotene, with eleven conjugated double bonds, absorbs blue light around 450 nm — and so it looks orange, the complementary colour of what it removed.'],
    ],
    check: { q: 'Why does adding conjugated double bonds shift absorption to a longer wavelength?', options: ['The molecule contains more electrons in total', 'The pi electrons are delocalised over a longer box, which lowers the HOMO-LUMO gap, so a lower-energy photon suffices', 'Longer molecules scatter more of the incoming light'], answer: 1, explanation: 'Delocalising the pi electrons over a longer chain lowers the HOMO-LUMO gap (the particle-in-a-box energy scales as 1/L²). A smaller gap is matched by a lower-energy, longer-wavelength photon.' },
    guidedViews: [
      { progress: .02, part: 'Photon' },
      { progress: (217 - 200) / 500, part: 'HOMO-LUMO gap' },
      { progress: (290 - 200) / 500, part: 'Conjugated chain' },
      { progress: (364 - 200) / 500, part: 'Electron' },
    ],
    observationPrompts: [
      'Most wavelengths pass straight through — nothing is absorbed.',
      'Butadiene (2 C=C) absorbs at 217 nm, deep in the UV. Colourless.',
      'Raise conjugation and watch the gap close and λmax slide right.',
      'The steps 217 → 258 → 290 → 334 → 364 are not equal; the gap closes more slowly.',
    ],
    stepConjugation: [2, 2, 4, 6],
    readout: (progress, params = {}) => {
      const n = Math.round(params.conjugation ?? 2);
      const entry = POLYENE[n] || POLYENE[2];
      const lambda = Math.round(200 + progress * 500);
      const hit = Math.abs(lambda - entry.lambdaMax) < 12;
      return [
        ['Wavelength', `${lambda} nm`],
        ['Polyene', `${entry.name} (${n} C=C)`],
        ['λmax (measured)', `${entry.lambdaMax} nm`],
        ['Photon', hit ? 'absorbed → electron promoted' : 'transmitted'],
      ];
    },
    spectrum: (params = {}) => {
      const n = Math.round(params.conjugation ?? 2);
      const entry = POLYENE[n] || POLYENE[2];
      return {
        kind: 'peaks',
        title: 'UV-Vis absorption',
        subtitle: `${entry.name} · λmax ${entry.lambdaMax} nm (hexane)`,
        left: '200', right: '700 nm',
        peaks: [{ x: (entry.lambdaMax - 200) / 500, h: 1, label: `${entry.lambdaMax}` }],
        marks: [{ x: (450 - 200) / 500, label: 'β-carotene 450' }],
      };
    },
  },

  {
    id: 'nmr',
    label: 'NMR',
    title: '¹H NMR spectroscopy',
    short: 'Shift, area, splitting',
    question: 'How does one spectrum give you the environment, the count and the neighbours of every hydrogen?',
    summary: 'Ethanol gives three signals. Where they sit tells you the environment, how much area they have counts the hydrogens, and how they are split tells you the neighbours.',
    evidence: 'Ethanol in CDCl3: CH3 delta 1.22 (t, J = 7 Hz, 3H), CH2 delta 3.69 (q, J = 7 Hz, 2H), OH delta ~2.6 (broad s, 1H; strongly dependent on solvent, temperature and concentration). Shifts are relative to TMS = 0. J = 7 Hz is ~0.02 ppm at 400 MHz, far too small to see on a 10 ppm axis, so the multiplets are drawn as expansions. The OH does not couple here because it exchanges rapidly. This is drawn as a frequency sweep (the old CW experiment); modern instruments pulse and Fourier-transform.',
    control: ['10 ppm', '0 ppm'],
    legend: ['B₀ field', 'spin α (with B₀) / β (against)', 'CH₃ shielded → upfield', 'CH₂ deshielded → downfield'],
    parts: {
      'B0 field': 'The external magnetic field. A bare proton would resonate at one frequency; everything interesting comes from the fact that electrons shield each proton slightly differently.',
      'CH3 protons': 'Three equivalent hydrogens, furthest from oxygen and therefore the most shielded — they resonate upfield at δ 1.22. Two CH₂ neighbours split them into a 1:2:1 triplet.',
      'CH2 protons': 'Two hydrogens on the carbon bearing oxygen. Oxygen withdraws electron density, so these protons are deshielded and appear downfield at δ 3.69. Three CH₃ neighbours split them into a 1:3:3:1 quartet.',
      'Spin states': 'In the field a proton has two states: α (magnetic moment with B₀, lower energy) and β (against it, higher). The gap ΔE is set by the field the nucleus actually FEELS — which its electrons shield. Match ΔE with radio waves and the spin flips. More shielding → smaller ΔE → lower frequency → upfield.',
      'OH proton': 'One hydrogen on oxygen. It exchanges rapidly between molecules, which averages away its coupling — so it is a broad singlet, and its shift moves around with solvent and concentration.',
      Integral: 'The AREA under each signal, not its height, is proportional to the number of hydrogens. Here the areas are exactly 3 : 2 : 1.',
    },
    steps: [
      ['Shielding decides the shift', 'Every proton feels the big external field slightly reduced by the electrons around it. More electron density means more shielding and a lower chemical shift. That is all a chemical shift is.'],
      ['Oxygen strips the CH₂', 'Sweep to δ 3.69. The CH₂ protons resonate here because the neighbouring oxygen pulls electron density away from them; with less shielding they feel more of the field. This is the whole reason electronegative atoms push signals downfield.'],
      ['The area counts the hydrogens', 'Sweep on to δ 1.22 for the CH₃. Now read the integral trace, not the peak heights: the areas are 3 : 2 : 1. That literally counts the hydrogens in each environment — which is why integration, not height, is what you measure.'],
      ['Splitting counts the neighbours', 'Each signal is split by the hydrogens on the ADJACENT carbon (n+1). CH₃ has two CH₂ neighbours, so it is a triplet (1:2:1); CH₂ has three CH₃ neighbours, so it is a quartet (1:3:3:1). The OH is a singlet only because it exchanges too fast to couple.'],
    ],
    check: { q: 'In the ethanol spectrum, what tells you there are exactly three hydrogens in the CH₃ environment?', options: ['It is the tallest peak', 'The area under its signal, read from the integral, is 3 units out of 6', 'It is split into a triplet'], answer: 1, explanation: 'Integration measures AREA, not height. A tall narrow peak and a short broad one can hold the same number of protons; only the area is proportional to hydrogen count. The triplet splitting tells you about neighbours, not about how many hydrogens the signal itself represents.' },
    guidedViews: [
      { progress: .05, part: 'B0 field' },
      { progress: nmrX(3.69), part: 'CH2 protons' },
      { progress: nmrX(1.22), part: 'Integral' },
      { progress: nmrX(1.22), part: 'CH3 protons' },
    ],
    observationPrompts: [
      'The field is on; every proton is already resonating at its own frequency.',
      'At δ 3.69 the CH₂ lights up — oxygen has stripped its shielding.',
      'Read the integral steps: 3 : 2 : 1. Not the heights.',
      'Count neighbours: CH₃ sees 2 → triplet; CH₂ sees 3 → quartet.',
    ],
    environments: [
      { p: nmrX(3.69), key: 'ch2', delta: 3.69, n: '2H', mult: 'quartet (1:3:3:1)' },
      { p: nmrX(2.6), key: 'oh', delta: 2.6, n: '1H', mult: 'broad singlet (exchange)' },
      { p: nmrX(1.22), key: 'ch3', delta: 1.22, n: '3H', mult: 'triplet (1:2:1)' },
    ],
    readout: (progress) => {
      const ppm = (10 - progress * 10).toFixed(2);
      const near = [
        { p: nmrX(3.69), name: 'CH₂', n: '2H', mult: 'quartet (3 neighbours)' },
        { p: nmrX(2.6), name: 'OH', n: '1H', mult: 'singlet (exchanging)' },
        { p: nmrX(1.22), name: 'CH₃', n: '3H', mult: 'triplet (2 neighbours)' },
      ].find((m) => Math.abs(progress - m.p) < .035);
      return [
        ['Chemical shift', `${ppm} ppm`],
        ['Environment', near ? near.name : 'none'],
        ['Integral (area)', near ? near.n : '—'],
        ['Splitting (n+1)', near ? near.mult : '—'],
      ];
    },
    spectrum: () => ({
      kind: 'peaks',
      title: '¹H NMR · ethanol (CDCl₃)',
      subtitle: 'area = hydrogen count · multiplets expanded',
      left: '10 ppm', right: '0 ppm',
      // heights are proportional to AREA (equal widths), i.e. 3 : 2 : 1
      peaks: [
        { x: nmrX(3.69), h: .667, label: 'CH₂', mult: 4 },
        { x: nmrX(2.6), h: .333, label: 'OH', mult: 1 },
        { x: nmrX(1.22), h: 1, label: 'CH₃', mult: 3 },
      ],
      integral: [
        { x: nmrX(3.69), h: 2 / 6 },
        { x: nmrX(2.6), h: 3 / 6 },
        { x: nmrX(1.22), h: 6 / 6 },
      ],
    }),
  },

  {
    id: 'massspec',
    label: 'MS',
    title: 'Mass spectrometry',
    short: 'Alpha-cleavage names the base peak',
    question: 'Why is ethanol\'s tallest peak at m/z 31, and not at its molecular mass?',
    summary: 'Knock an electron out of ethanol and it falls apart. Where it breaks is not random: it breaks to leave the most stabilised cation, and that is what makes m/z 31 the base peak.',
    evidence: 'Ethanol, electron ionisation at 70 eV. Approximate relative intensities (NIST): m/z 31 = 100 (base), 45 = 42, 29 = 26, 27 = 22, 46 (M+.) = 23, 15 = 8. Minor fragments are omitted. The instrument is drawn as a scanning mass filter; the ion source, acceleration optics and vacuum are not shown.',
    control: ['m/z 0', 'm/z 60'],
    legend: ['e⁻ 70 eV ionises → M⁺•', 'α-cleavage', 'the ION is accelerated', 'the NEUTRAL is lost'],
    parts: {
      'Molecular ion': 'Ethanol minus ONE electron: a radical cation, M⁺• at m/z 46. It is odd-electron and unstable, which is why it is not the tallest peak — only about 23% of the base peak.',
      'Alpha cleavage': 'The C–C bond next to the oxygen breaks. This is the dominant fragmentation of alcohols, and it happens because of what it leaves behind.',
      Oxocarbenium: 'CH₂=OH⁺ at m/z 31. The oxygen donates a lone pair into the empty carbon orbital, forming a full C=O π bond that spreads the positive charge over two atoms. That stabilisation is why this fragment dominates the spectrum.',
      'Methyl fragment': 'CH₃⁺ at m/z 15. A primary carbocation with nothing to stabilise it — which is exactly why it is a tiny peak (8%).',
      'Neutral fragment': 'THE thing most people miss about mass spectrometry: when the molecule breaks, only ONE piece keeps the charge. The other leaves as a neutral radical, and a mass spectrometer cannot accelerate, deflect or detect a neutral. It is lost. Every peak you see is an ion; every fragmentation also produced something you never saw.',
      Ionisation: 'A 70 eV electron does not stick to the molecule - it knocks one electron OUT, leaving a radical cation M+. with both an unpaired electron and a positive charge.',
      Analyser: 'Ions are accelerated down the flight tube. Which one reaches the detector depends on its mass-to-charge ratio, and that is what the sweep selects.',
      Detector: 'Only ions of the selected mass-to-charge ratio get through and are counted.',
    },
    steps: [
      ['Ionise: knock out one electron', 'A 70 eV electron does not add charge — it removes an electron, leaving a radical cation M⁺• at m/z 46. Its mass gives you the molecular mass straight away.'],
      ['The molecular ion is fragile', 'M⁺• has an unpaired electron and a lot of excess energy, so most of it falls apart before it reaches the detector. That is why m/z 46 is only about a quarter of the tallest peak — the molecular ion is often weak, and sometimes absent altogether.'],
      ['α-cleavage gives the base peak', 'The bond that breaks is the C–C next to oxygen. It leaves CH₂=OH⁺ at m/z 31, and oxygen immediately donates a lone pair to make a full C=O π bond. Sharing the charge over two atoms stabilises the cation enormously — which is why m/z 31 is the base peak.'],
      ['Compare the alternative', 'Break the same bond the other way and you get CH₃⁺ at m/z 15: a bare primary carbocation with no lone pair to help it. It is worth only 8%. The spectrum is not a random shattering — it is a map of which cations are stable.'],
    ],
    check: { q: 'Why is m/z 31 (CH₂=OH⁺) the base peak of ethanol rather than m/z 15 (CH₃⁺)?', options: ['It is heavier, so it hits the detector harder', 'Oxygen donates a lone pair to form a C=O π bond, spreading the positive charge over two atoms and stabilising the cation', 'It contains more hydrogens'], answer: 1, explanation: 'After α-cleavage the oxygen lone pair delocalises into the adjacent empty orbital, giving an oxocarbenium ion (CH₂=OH⁺) in which the charge is shared between C and O. CH₃⁺ has no such stabilisation, so it is a minor peak. Fragmentation follows cation stability.' },
    guidedViews: [
      { progress: msX(46), part: 'Molecular ion' },
      { progress: msX(46), part: 'Molecular ion' },
      { progress: msX(31), part: 'Oxocarbenium' },
      { progress: msX(15), part: 'Methyl fragment' },
    ],
    observationPrompts: [
      'At m/z 46 the intact radical cation gets through: that is the molecular mass.',
      'Note it is only ~23% — the molecular ion is fragile.',
      'At m/z 31 the oxocarbenium dominates. Watch the C=O π bond form.',
      'At m/z 15 the bare methyl cation barely registers: 8%.',
    ],
    fragments: [
      { p: msX(15), mz: 15, keep: ['ch3'], id: 'CH₃⁺', rel: 8 },
      { p: msX(31), mz: 31, keep: ['ch2', 'oh'], id: 'CH₂=OH⁺ (base peak)', rel: 100 },
      { p: msX(45), mz: 45, keep: ['ch3', 'ch2', 'oh'], id: 'M–H', rel: 42 },
      { p: msX(46), mz: 46, keep: ['ch3', 'ch2', 'oh'], id: 'M⁺• molecular ion', rel: 23 },
    ],
    readout: (progress) => {
      const mz = Math.round(progress * 60);
      const peaks = [
        { p: msX(15), id: 'CH₃⁺', rel: 8, why: 'primary cation, unstabilised' },
        { p: msX(29), id: 'CHO⁺ / C₂H₅⁺', rel: 26, why: 'secondary fragmentation' },
        { p: msX(31), id: 'CH₂=OH⁺', rel: 100, why: 'α-cleavage + lone-pair donation' },
        { p: msX(45), id: 'M–H', rel: 42, why: 'loss of H•' },
        { p: msX(46), id: 'M⁺•', rel: 23, why: 'intact radical cation' },
      ];
      // 45 and 46 are adjacent, so match the NEAREST peak rather than the first in range
      const best = peaks.reduce((a, b) => (Math.abs(progress - b.p) < Math.abs(progress - a.p) ? b : a));
      const near = Math.abs(progress - best.p) < .014 ? best : null;
      return [
        ['Selected m/z', `${mz}`],
        ['Ion', near ? near.id : 'nothing at this mass'],
        ['Relative intensity', near ? `${near.rel}%` : '—'],
        ['Why', near ? near.why : 'molecular mass = 46'],
      ];
    },
    spectrum: () => ({
      kind: 'peaks',
      title: 'EI-MS · ethanol (70 eV)',
      subtitle: 'relative intensities, NIST',
      left: 'm/z 0', right: '60',
      peaks: [
        { x: msX(15), h: .08, label: '15' },
        { x: msX(27), h: .22 },
        { x: msX(29), h: .26, label: '29' },
        { x: msX(31), h: 1, label: '31' },
        { x: msX(45), h: .42, label: '45' },
        { x: msX(46), h: .23, label: '46 M⁺•' },
      ],
    }),
  },

  {
    id: 'xrd',
    label: 'XRD',
    title: 'X-ray diffraction',
    short: 'Bragg measures the spacing',
    question: 'How does the angle at which X-rays reflect tell you how far apart the atoms are?',
    summary: 'Send Cu Kα X-rays into rock salt and sweep the angle. Reflections from successive planes only reinforce when the extra path is a whole number of wavelengths — and that condition solves for d.',
    evidence: 'NaCl with Cu K-alpha radiation: lambda = 1.5406 A, d(200) = a/2 = 2.82 A, so sin(theta) = n x 0.2732 and reflections fall at theta = 15.9, 33.1 and 55.0 degrees. IMPORTANT: only two planes are drawn, and two beams interfere as cos^2 — broad fringes. A real crystal stacks thousands of planes, which leaves the Bragg ANGLES unchanged but makes the peaks razor-sharp. The plotted pattern shows the sharp peaks of a real crystal, not the cos^2 of the two-plane picture. Structure factors and systematic absences are not modelled.',
    control: ['θ = 0°', 'θ = 60°'],
    legend: ['lattice planes (d = 2.82 Å)', 'Cu Kα beam (1.54 Å)', 'extra path 2d·sinθ', 'Bragg reflection'],
    parts: {
      'Lattice planes': 'Sheets of ions repeating every d = 2.82 Å — the (200) spacing of rock salt, the same lattice as the crystal exhibit. This is the ruler the X-rays measure against.',
      'X-ray beam': 'Cu Kα, wavelength 1.5406 Å — comparable to the atomic spacing, which is exactly why X-rays can measure it. Visible light, at 5000 Å, is hopelessly too coarse.',
      'Path difference': 'The wave reflecting from the lower plane travels an extra 2d·sinθ. Everything depends on whether that extra distance is a whole number of wavelengths.',
      'Bragg reflection': 'When 2d·sinθ = nλ the reflected waves arrive in step and reinforce. Measure θ, know λ, and you have solved for d.',
    },
    steps: [
      ['Why X-rays, and not light?', 'To measure a spacing you need a wave comparable to it. Cu Kα is 1.54 Å and the planes in rock salt are 2.82 Å apart — the same scale. Visible light is thousands of times too long and simply cannot resolve atoms.'],
      ['The extra path', 'The X-ray reflecting from the second plane has further to travel: an extra 2d·sinθ. Sweep the angle and watch that path difference change — the readout gives it in wavelengths.'],
      ['In step at 15.9°', 'When the extra path is exactly one whole wavelength the two reflected waves arrive in phase, reinforce, and the detector lights up. That is Bragg\'s law: 2d·sinθ = nλ. At every other angle they cancel, which is why diffraction gives sharp spots rather than a smear.'],
      ['Solve for d', 'A second reflection appears at 33.1° (n = 2) and a third at 55.0° (n = 3). Rearranging, d = nλ / (2·sinθ) — measuring the angles and knowing the wavelength gives the atomic spacing directly. This is how we know d(NaCl) = 2.82 Å.'],
    ],
    check: { q: 'Why must you use X-rays rather than visible light to measure the spacing between atomic planes?', options: ['X-rays are more energetic, so they penetrate the crystal', 'The wavelength must be comparable to the spacing being measured; X-rays are ~1.5 Å and the planes are ~2.8 Å apart, whereas visible light is thousands of times too long', 'X-rays are not absorbed by the crystal'], answer: 1, explanation: 'Diffraction requires a wavelength on the same scale as the repeat distance. With λ = 1.54 Å and d = 2.82 Å, sinθ = nλ/2d has real solutions. With visible light (~5000 Å) the ratio λ/2d far exceeds 1 and no diffraction maximum can exist at all.' },
    guidedViews: [
      { progress: .08, part: 'X-ray beam' },
      { progress: xrdX(24), part: 'Path difference' },
      { progress: xrdX(braggAngle(1)), part: 'Bragg reflection' },
      { progress: xrdX(braggAngle(2)), part: 'Bragg reflection' },
    ],
    observationPrompts: [
      'λ = 1.54 Å and d = 2.82 Å — the same scale. That is the whole trick.',
      'Watch the path difference (in wavelengths) as you sweep the angle.',
      'At 15.9° it hits exactly 1.00 λ: the waves are in step and the spot blazes.',
      'A second reflection at 33.1° (n=2) and a third at 55.0° (n=3).',
    ],
    braggAngles: [braggAngle(1), braggAngle(2), braggAngle(3)],
    readout: (progress) => {
      const theta = progress * 60;
      const path = 2 * XRD_D * Math.sin(theta * Math.PI / 180) / XRD_LAMBDA; // in wavelengths
      const nearInt = Math.round(path);
      const bragg = nearInt >= 1 && Math.abs(path - nearInt) < .02;
      return [
        ['Angle θ', `${theta.toFixed(1)}°`],
        ['Extra path 2d·sinθ', `${path.toFixed(2)} λ`],
        ['Waves arrive', bragg ? 'in step' : 'out of step'],
        ['Detector', bragg ? `Bragg reflection (n = ${nearInt})` : 'dark'],
      ];
    },
    spectrum: () => ({
      kind: 'peaks',
      title: 'Diffraction pattern · NaCl',
      subtitle: 'Cu Kα · sharp peaks need many planes',
      left: 'θ 0°', right: '60°',
      peaks: [
        { x: xrdX(braggAngle(1)), h: 1, label: 'n=1' },
        { x: xrdX(braggAngle(2)), h: .68, label: 'n=2' },
        { x: xrdX(braggAngle(3)), h: .4, label: 'n=3' },
      ],
    }),
  },

  {
    id: 'fluorescence',
    label: 'Fluorescence',
    title: 'Fluorescence',
    short: 'Why emitted light is redder',
    question: 'Why is emitted light always lower in energy than the light that was absorbed?',
    summary: 'Follow one molecule through absorption, vibrational relaxation and emission. Energy is lost as heat at BOTH ends of the trip — and that is the Stokes shift.',
    evidence: 'Fluorescein in basic ethanol: absorption max ~490 nm, emission max ~514 nm, Stokes shift ~24 nm (about 950 cm-1), fluorescence lifetime ~4 ns. Timescales: absorption ~10^-15 s, vibrational relaxation ~10^-12 s, fluorescence ~10^-9 s. The Jablonski diagram is schematic; triplet states, intersystem crossing and quenching are omitted.',
    control: ['Absorb', 'Emit'],
    legend: ['absorbed photon (blue)', 'emitted photon (green)', 'vibrational relaxation (heat)', 'Stokes shift'],
    parts: {
      'Ground state': 'S₀. The molecule starts at the bottom of this state, and — importantly — emission returns it to an UPPER vibrational level of S₀, not to the bottom.',
      'Excited state': 'S₁. Absorption lands the molecule on an upper vibrational rung of S₁, not at its bottom, because the nuclei have not had time to move (Franck-Condon).',
      Electron: 'Follow the molecule\'s state: up on absorption, down the vibrational ladder as heat, then back down emitting light.',
      'Absorbed photon': 'A blue photon (~490 nm for fluorescein). Absorption takes ~10⁻¹⁵ s — far faster than the nuclei can respond.',
      'Emitted photon': 'A greener photon (~514 nm). It is lower in energy because energy was shed as heat both before and after the emission step.',
      'Stokes shift': 'The gap between the absorption and emission maxima: ~24 nm for fluorescein. It exists because vibrational relaxation is ~1000× faster than emission, so the molecule always relaxes before it emits.',
    },
    steps: [
      ['Absorption is faster than the nuclei', 'The photon is absorbed in about 10⁻¹⁵ s, far too fast for the nuclei to move. So the molecule arrives on an UPPER vibrational rung of S₁, not at its bottom. That is the Franck-Condon principle, and it is the first place energy gets stranded.'],
      ['Relaxation wins the race', 'Sliding down the vibrational ladder of S₁ takes ~10⁻¹² s, while fluorescence takes ~10⁻⁹ s — a thousand times slower. Relaxation always wins, so the molecule ALWAYS emits from the bottom of S₁ regardless of how hard you excited it. That is Kasha\'s rule.'],
      ['Emission lands high, not low', 'Now it drops back to S₀ and emits a photon — but it lands on an upper vibrational level of S₀, not the bottom. Energy is stranded a second time. Then it quietly relaxes down again as heat.'],
      ['That is the Stokes shift', 'Energy was lost as heat both before and after the photon was emitted, so the emitted photon must be lower in energy than the absorbed one. For fluorescein: absorbs 490 nm, emits 514 nm — a Stokes shift of ~24 nm. It is also why you can filter out the excitation light and see only the fluorescence.'],
    ],
    check: { q: 'Why is fluorescence always red-shifted relative to absorption?', options: ['Some of the photons are absorbed twice over', 'Energy is lost as vibrational heat both before emission (relaxing down S₁) and after it (landing on an upper level of S₀)', 'The detector systematically under-reads the energy'], answer: 1, explanation: 'Vibrational relaxation (~10⁻¹² s) is far faster than emission (~10⁻⁹ s), so the molecule relaxes to the bottom of S₁ before emitting, and the emission itself terminates on a vibrationally excited level of S₀. Energy is shed as heat at both ends, so the emitted photon must be lower in energy — the Stokes shift.' },
    guidedViews: [
      { progress: .25, part: 'Absorbed photon' },
      { progress: .5, part: 'Electron' },
      { progress: .78, part: 'Emitted photon' },
      { progress: .95, part: 'Stokes shift' },
    ],
    observationPrompts: [
      'The photon lands the molecule high up in S₁ — the nuclei could not keep up.',
      'It slides down the ladder as heat. This is 1000× faster than emission.',
      'Emission lands on an UPPER level of S₀, not the bottom. Energy stranded twice.',
      'Absorbs 490 nm, emits 514 nm: a 24 nm Stokes shift.',
    ],
    readout: (progress) => [
      ['Stage', progress < .34 ? 'absorption (~10⁻¹⁵ s)' : progress < .62 ? 'vibrational relaxation (~10⁻¹² s)' : 'fluorescence (~10⁻⁹ s)'],
      ['Molecule', progress < .34 ? 'S₀ → S₁ (upper vib. level)' : progress < .62 ? 'relaxing to bottom of S₁' : 'S₁ → S₀ (upper vib. level)'],
      ['Energy lost as heat', progress < .34 ? 'not yet' : progress < .62 ? 'yes — before emission' : 'yes — before AND after'],
      ['Result', progress < .62 ? '—' : 'emitted 514 nm vs absorbed 490 nm'],
    ],
    spectrum: () => ({
      kind: 'peaks',
      title: 'Fluorescein · absorption & emission',
      subtitle: 'Stokes shift ≈ 24 nm (490 → 514 nm)',
      left: '450 nm', right: '600 nm',
      // axis runs 450 -> 600 nm; x = (nm - 450) / 150
      band: [{ x: (490 - 450) / 150, h: .95, label: 'abs 490' }],
      peaks: [{ x: (514 - 450) / 150, h: .85, label: 'em 514' }],
      noCursor: true,
    }),
  },
];

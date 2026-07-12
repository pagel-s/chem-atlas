import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  Activity, Atom, BatteryCharging, BookOpen, Box, Check, ChevronLeft, ChevronRight,
  CircleDot, FlaskConical, Focus, Hexagon, Menu, MousePointer2, Pause, Play, Rotate3D,
  RotateCcw, Snowflake, Sparkles, Waves, X,
} from 'lucide-react';
import ChemScene from './ChemScene';
import { lessons as allLessons } from './lessons';
import { mechanismSpecs } from './mechanismSpecs';

const MoleculeScene = lazy(() => import('./MoleculeScene'));

// ponytail: hide exhibit 11 (synthesis) from the UI; its data and scene code stay intact
const lessons = allLessons.filter((lesson) => lesson.id !== 'synthesis');

const icons = {
  battery: BatteryCharging, binding: Focus, snowflake: Snowflake, catalyst: Hexagon,
  smell: Waves, mechanism: Play, orbitals: CircleDot, geometry: Atom,
  lattice: Box, electrochem: FlaskConical, synthesis: FlaskConical, ir: Activity,
};

const guidedViews = {
  battery: [{ progress: .14, part: 'Electron' }, { progress: .38, part: 'Lithium ion' }, { progress: .84, part: 'Negative electrode' }, { progress: 1, part: 'Metallic lithium' }],
  binding: [{ progress: 0, part: 'Receptor' }, { progress: 1, part: 'Binding pocket' }, { progress: 1, part: 'Ligand' }, { progress: 1, part: 'Ligand' }],
  snowflake: [{ progress: .08, part: 'Hydrogen bond' }, { progress: .46, part: 'Hexagonal lattice' }, { progress: .7, part: 'Branch' }, { progress: 1, part: 'Facet' }],
  catalyst: [{ progress: .04, part: 'Selected channel wall' }, { progress: .3, part: 'Washcoat' }, { progress: .66, part: 'Pt(111) terrace' }, { progress: 1, part: 'Adsorbed molecule' }],
  smell: [{ progress: 0, part: 'Receptor' }, { progress: 1, part: 'Binding cavity' }, { progress: 1, part: 'Receptor' }, { progress: 1, part: 'Odorant' }],
  mechanism: [{ progress: .05, part: 'Nucleophile' }, { progress: .48, part: 'Transition state' }, { progress: .5, part: 'Transition state' }, { progress: .92, part: 'Leaving group' }],
  orbitals: [{ progress: 0, part: 's orbital' }, { progress: .5, part: 'p orbital' }, { progress: 1, part: 'Hybrid orbital' }, { progress: 1, part: 'Hybrid orbital' }],
  geometry: [{ progress: 0, part: 'Bonding pair' }, { progress: .5, part: 'Lone pair' }, { progress: .5, part: 'Bond angle' }, { progress: 1, part: 'Bond angle' }],
  lattice: [{ progress: 0, part: 'Unit cell' }, { progress: .5, part: 'Coordination shell' }, { progress: .5, part: 'Central cation' }, { progress: 1, part: 'Cleavage plane' }],
  electrochem: [{ progress: 0, part: 'Anode' }, { progress: .35, part: 'Anode' }, { progress: .7, part: 'Cathode' }, { progress: 1, part: 'Salt bridge' }],
  synthesis: [{ progress: .04, part: 'Condition' }, { progress: .34, part: 'Manual flask' }, { progress: .68, part: 'Reaction plate' }, { progress: .96, part: 'Candidate condition' }],
  ir: [{ progress: .06, part: 'Oxygen' }, { progress: .459, part: 'Dipole moment' }, { progress: .739, part: 'Dipole moment' }, { progress: .926, part: 'Dipole moment' }],
};

const sceneLegends = {
  battery: ['Li+ (gold): electrolyte path', 'e- (yellow): external charger circuit', 'graphite galleries: negative electrode', 'layered oxide: positive electrode'],
  binding: ['experimental coordinates', 'receptor', 'caffeine', 'nearby residues'],
  snowflake: ['H2O vapour (schematic)', 'local ice-Ih motif', 'vapour flux', 'solid ice'],
  catalyst: ['amber = same selected region', 'porous oxide washcoat', 'Pt particle -> idealized Pt(111) facet', 'C black · O red · teal trace = O from O2'],
  smell: ['OR51E2', 'propionate', 'active-state structure', 'contact residue'],
  mechanism: ['electron pair', 'forming bond', 'breaking bond', 'reaction coordinate'],
  orbitals: ['positive phase (+)', 'negative phase (−)', 'nucleus'],
  geometry: ['bonding domain', 'lone-pair domain', 'bond dipole', 'net dipole'],
  lattice: ['Na+ (smaller cation)', 'Cl- (larger anion)', 'coordination = 6', 'flat cleavage plane'],
  electrochem: ['Zn(s) -> Zn2+ + 2e-', 'Cu2+ + 2e- -> Cu(s)', 'NO3- -> zinc anode', 'K+ -> copper cathode'],
  synthesis: ['one generic reaction question', 'manual serial flask', 'independent plate wells', 'illustrative analytical response'],
  ir: ['C=O bonds', 'net dipole (gold arrow)', 'absorption peak', 'IR-silent mode'],
};

const observationPrompts = {
  battery: ['Trace the yellow e- and gold Li+ paths. Do they cross the same material?', 'Follow one Li+ through the electrolyte toward the graphite host.', 'Compare Li+ leaving the idealized layered-oxide host with Li+ entering graphite, then check the paired counts.', 'Raise the illustrative rate and watch neutral Li(s) replace three Li+ labels.'],
  binding: ['Orient the whole receptor before entering the pocket.', 'Select the pocket and inspect the dashed atom-to-atom distances.', 'Select Ligand to isolate the intact caffeine molecule from the receptor cartoon.', 'Compare the occupancy inset with the one bound experimental conformer.'],
  snowflake: ['Inspect the local ice motif before growth.', 'Rotate to see the six equivalent crystal directions.', 'Increase supersaturation and watch exposed tips capture parcels.', 'Compare representative growth regimes; this is not a phase transition of one finished crystal.'],
  catalyst: ['Follow the amber lining on one channel wall into the enlarging washcoat patch.', 'Keep the amber boundary in view, then locate its one marked Pt nanoparticle.', 'Watch that particle resolve into its idealized top Pt(111) facet before the gases react.', 'Follow the same four O atoms into two CO2 molecules, then watch four sites reopen.'],
  smell: ['Frame the whole OR51E2 structure and identify the ligand.', 'Inspect the dashed contact lines in the occluded pocket.', 'Note which claims are structural evidence and which require another state.', 'Read the illustrative receptor-array pattern as a population code.'],
  mechanism: ['Check the nucleophile and leaving group before scrubbing.', 'Pause near the maximum and inspect both curved electron arrows.', 'Compare the partial bonds with the energy marker.', 'Follow H, D and CH3 as the tetrahedral center inverts.'],
  orbitals: ['The s orbital is one sphere — a cloud of likely positions, not a shell.', 'Count the orbitals: one spherical s plus three p dumbbells on x, y and z.', 'Watch the same four orbitals become four tetrahedral sp³ hybrids.', 'Ask what stays the same: four orbitals in, four orbitals out.'],
  geometry: ['Count four electron domains around the central atom.', 'Compare an NH3 lone pair with its three bonding domains.', 'Read the measured H2O angle and dipole arrows.', 'Ask why methane’s four bond dipoles cancel.'],
  lattice: ['This one cube, repeated in every direction, is the whole crystal.', 'Find the central Na+ and count its six Cl- neighbours.', 'Rotate the octahedron: six nearest neighbours, one on each axis.', 'Watch the crystal lift apart along a flat plane into two even faces.'],
  electrochem: ['Start with the switch open: a potential difference is not a sustained current.', 'Close the switch and follow one Zn atom into solution with two electrons.', 'Follow the same two electrons to one Cu2+ ion as it deposits on copper.', 'Track two NO3- to the zinc side and two K+ to the copper side as charge is compensated.'],
  synthesis: ['Read the generic amide question before choosing a workflow.', 'Follow one measured manual dispensing step into a single planned flask.', 'Inspect the 4 x 6 plate: distinguish conditions, a replicate, and a blank control.', 'Treat the highlighted well as a candidate for verification, not a finished scalable procedure.'],
  ir: ['Scan the beam; the molecule only reacts near one of its vibration frequencies.', 'At 2349 cm⁻¹ the two C=O stretch out of step — the gold dipole arrow flips, so it absorbs.', 'At 1340 cm⁻¹ the molecule breathes symmetrically — the dipole stays zero and no peak appears.', 'At 667 cm⁻¹ the molecule bends — a dipole appears and it absorbs again.'],
};

function snowHabit(temperature, saturation) {
  if (temperature > -4) return saturation > .14 ? 'stellar / sectored plate' : 'faceted plate';
  if (temperature > -9) return 'column / needle';
  if (temperature > -22) return saturation > .14 ? 'dendritic plate' : 'faceted plate';
  return 'columnar / rosette';
}

function mechanismReadout(mechanismId, progress) {
  const spec = mechanismSpecs.find((item) => item.id === mechanismId);
  if (spec?.readout) return spec.readout(progress);
  if (mechanismId === 'suzuki') {
    return [
      ['Catalytic stage', progress < .08 ? 'aryl partners + formal Pd(0)' : progress < .34 ? 'C-Br oxidative addition' : progress < .62 ? 'aryl transfer -> cis-diaryl Pd(II)' : progress < .72 ? 'cis-diaryl Pd(II)' : progress < .9 ? 'reductive elimination' : 'biaryl + regenerated Pd(0)'],
      ['C-C bond', progress < .72 ? 'not yet formed' : progress < .9 ? 'forming from cis Pd-C bonds' : 'biaryl connectivity'],
      ['Geometry', progress < .34 ? 'reactants occupy separate depth lanes' : progress < .72 ? 'oblique square plane; aryl rings torsioned' : 'twisted biaryl, not a flat product'],
      ['Model scope', 'idealized catalytic sequence'],
    ];
  }
  if (mechanismId === 'dielsAlder') {
    return [
      ['Reaction stage', progress < .2 ? 'separated pi systems' : progress < .52 ? 'phase-matched approach' : progress < .78 ? 'concerted [4+2] transition state' : progress < .96 ? 'bond closure + ring pucker' : 'cyclohexene product'],
      ['New sigma bonds', progress < .52 ? '0' : progress < .78 ? '2 partial' : progress < .96 ? '2 closing' : '2 formed'],
      ['Orbital colour', 'wavefunction phase, not charge'],
    ];
  }
  return [
    ['Relative C-O formation', progress.toFixed(2)],
    ['Relative C-Cl cleavage', progress.toFixed(2)],
    ['Overall charge', '-1 throughout'],
  ];
}

function sceneReadout(id, progress, parameters = {}, mechanismId = 'sn2') {
  const eased = progress * progress * (3 - 2 * progress);
  const transferred = Array.from({ length: 12 }, (_, index) => eased * 1.35 - index * .025).filter((value) => value >= .98).length;
  const rateFraction = Math.max(0, Math.min(1, ((parameters.chargeRate ?? .3) - 1.4) / .3));
  const platingAmount = rateFraction * rateFraction * (3 - 2 * rateFraction) * Math.max(0, Math.min(1, (progress - .82) / .18));
  const plated = platingAmount * 3;
  const platedDisplay = plated < .01 ? '0' : plated > 2.97 ? '3' : `${plated.toFixed(1)} growing`;
  const graphiteOccupancy = Math.max(0, transferred - plated);
  const circuitClosed = parameters.circuitClosed ?? progress > .02;
  const electrochemProgress = circuitClosed ? progress : parameters.circuitFrozenProgress ?? 0;
  const values = {
    battery: [['Graphite occupancy', `${graphiteOccupancy.toFixed(1)} / 12 Li+ equivalent`], ['Layered-oxide Li+ sites', `${12 - transferred} / 12 shown`], ['e- / Li+ paired', `${transferred} / ${transferred}`], ['Illustrative rate', `${(parameters.chargeRate ?? .3).toFixed(1)} C`], ['Metallic Li plated', platedDisplay]],
    binding: [['Structure', 'PDB 5MZP'], ['Resolution', '2.1 Å'], ['ASN253 ND2-O11', 'polar · 2.89 Å'], ['PHE168 CD1-N3', 'packing · 3.41 Å'], ['ILE274 CD1-C8', 'packing · 3.35 Å']],
    snowflake: [['Representative habit', snowHabit(parameters.temperature, parameters.saturation)], ['Temperature', `${parameters.temperature} °C`], ['Above ice saturation', `${Math.round(parameters.saturation * 100)}%`]],
    catalyst: [['Scale / event', progress < .2 ? 'selected mm-scale channel wall' : progress < .48 ? 'same region: porous um-scale washcoat' : progress < .62 ? 'one nm-scale Pt nanoparticle' : progress < .68 ? 'idealized Pt(111) top facet' : progress < .72 ? 'CO(g) + O2(g) enter view' : progress < .79 ? 'O2 approaches bridge positions' : progress < .8 ? 'weakened O2* bridge' : progress < .85 ? 'CO(g) -> CO* adsorption' : progress < .9 ? 'O-O bond cleavage' : progress < .95 ? 'C-O bonds form -> CO2' : progress < .999 ? 'CO2 desorption; sites reopen' : 'four Pt sites regenerated'], ['Pt site ledger', progress < .62 ? 'not yet in atomic facet view' : progress < .66 ? 'Pt(111) facet resolving; sites not yet counted' : progress < .68 ? '4 vacant Pt sites; no gases yet' : progress < .72 ? '4 vacant Pt sites; gases approach' : progress < .775 ? '4 vacant Pt sites; O2 approaches bridge' : progress < .8 ? '2 bridge sites fill with O2*' : progress < .85 ? 'O2* + 2 CO(g) -> O2* + 2 CO*' : progress < .9 ? '2 CO* + O2* -> 2 CO* + 2 O*' : progress < .95 ? '2 CO* + 2 O* -> 2 CO2*' : progress < .999 ? 'CO2 leaves; Pt sites reopen' : '4 vacant Pt sites'], ['Atom ledger', '2 C and 4 O conserved']],
    smell: [['Structure', 'PDB 8F76'], ['Resolution', '3.1 Å'], ['HIS180 ND1-O1', 'polar · 2.40 Å'], ['GLN181 NE2-O2', 'polar · 2.65 Å'], ['ARG262 NH1-O2', 'polar · 2.66 Å']],
    mechanism: mechanismReadout(mechanismId, progress),
    orbitals: [['In view', progress < .25 ? '1 s orbital' : progress < .75 ? '1 s + 3 p orbitals' : '4 sp³ hybrids'], ['Orbital count', progress < .25 ? '1 of 4 basis orbitals' : progress < .75 ? '4 basis orbitals (1 s + 3 p)' : '4 hybrids (4 → 4)'], ['Colour', 'wavefunction phase, not charge']],
    geometry: [['Electron domains', '4'], ['Molecular shape', progress < .25 ? 'tetrahedral' : progress < .75 ? 'trigonal pyramidal' : 'bent'], ['Bond angle', progress < .25 ? '109.5°' : progress < .75 ? '~107°' : '104.5°']],
    lattice: [['Structure', 'rock salt (NaCl)'], ['Coordination', '6 : 6, octahedral'], ['View', progress < .34 ? 'one unit cell' : progress < .67 ? 'one ion + 6 neighbours' : 'cleaving along a flat plane']],
    electrochem: [['Circuit state', circuitClosed ? 'closed: Zn -> wire -> Cu' : 'open: no sustained current'], ['Redox event', electrochemProgress < .18 ? 'ready: no net transfer' : electrochemProgress < .6 ? 'Zn(s) -> Zn2+(aq) + 2e-' : electrochemProgress < .8 ? 'Cu2+(aq) + 2e- -> Cu(s)' : 'one paired Zn/Cu event'], ['Electrode mass', electrochemProgress < .18 ? 'unchanged' : electrochemProgress < .6 ? 'Zn down; Cu unchanged' : electrochemProgress < .76 ? 'Zn down; Cu depositing' : 'Zn down; Cu up'], ['Charge compensation', electrochemProgress < .58 ? 'bridge awaits imbalance' : electrochemProgress < .94 ? '2 NO3- -> anode; 2 K+ -> cathode' : 'both half-cells rebalanced']],
    synthesis: [['Workflow stage', progress < .16 ? 'one defined reaction question' : progress < .48 ? 'manual serial flask' : progress < .8 ? 'parallel 24-well condition screen' : 'analyse -> choose -> verify'], ['Reaction identity', 'ArCO2H + RNH2 + coupling reagent -> ArCONHR'], ['Parallel unit', progress < .48 ? 'one planned condition' : 'independent wells, not one mixture'], ['Result status', progress < .8 ? 'no result before analysis' : 'candidate condition; verify at scale']],
    ir: (() => {
      const wn = Math.round(4000 - progress * 3600);
      const near = [{ p: .459, name: 'asymmetric stretch', active: true }, { p: .739, name: 'symmetric stretch', active: false }, { p: .926, name: 'bend', active: true }].find((m) => Math.abs(progress - m.p) < .06);
      return [
        ['IR wavenumber', `${wn} cm⁻¹`],
        ['At this frequency', near ? near.name : 'no vibration (scanning)'],
        ['Dipole change', near ? (near.active ? 'yes' : 'no (stays symmetric)') : '—'],
        ['Result', near ? (near.active ? 'absorbs -> peak' : 'IR-silent -> no peak') : 'light passes through'],
      ];
    })(),
  };
  return values[id];
}

export default function App() {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [selectedPart, setSelectedPart] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [cameraReset, setCameraReset] = useState(0);
  const [snowTemperature, setSnowTemperature] = useState(-15);
  const [snowSaturation, setSnowSaturation] = useState(.18);
  const [batteryRate, setBatteryRate] = useState(.3);
  const [electrochemClosed, setElectrochemClosed] = useState(false);
  const [electrochemFrozenProgress, setElectrochemFrozenProgress] = useState(0);
  const [freeExplore, setFreeExplore] = useState(false);
  const [guidedTransitioning, setGuidedTransitioning] = useState(false);
  const [mechanismId, setMechanismId] = useState('sn2');
  const progressRef = useRef(0);
  const guidedTransitionRef = useRef();
  const baseLesson = lessons[lessonIndex];
  const activeMechanism = baseLesson.id === 'mechanism'
    ? mechanismSpecs.find((spec) => spec.id === mechanismId) || mechanismSpecs[0]
    : null;
  const lesson = activeMechanism ? { ...baseLesson, ...activeMechanism, id: baseLesson.id } : baseLesson;
  const LessonIcon = icons[lesson.id];
  const guidedSequence = activeMechanism?.guidedViews || guidedViews[lesson.id];
  const lessonLegend = activeMechanism?.legend || sceneLegends[lesson.id];
  const lessonSwatches = activeMechanism?.swatches;
  const lessonObservations = activeMechanism?.observationPrompts || observationPrompts[lesson.id];
  const lessonKey = activeMechanism ? `${lesson.id}:${activeMechanism.id}` : lesson.id;
  const catalystScaleStage = progress < .2 ? 0 : progress < .48 ? 1 : progress < .62 ? 2 : 3;
  const guidedView = guidedSequence[Math.min(stepIndex, lesson.steps.length - 1)];
  const highlightedPart = selectedPart || (freeExplore ? null : guidedView.part);
  const hasContinuousControl = ['battery', 'snowflake', 'catalyst', 'mechanism', 'electrochem', 'synthesis', 'ir'].includes(lesson.id);

  const cancelGuidedTransition = () => {
    if (guidedTransitionRef.current) cancelAnimationFrame(guidedTransitionRef.current);
    guidedTransitionRef.current = undefined;
    setGuidedTransitioning(false);
  };
  const setVisualProgress = (value) => {
    progressRef.current = value;
    setProgress(value);
  };

  useEffect(() => () => cancelGuidedTransition(), []);

  useEffect(() => {
    setSelectedPart(null); setAnswer(null); setNavOpen(false); setPlaying(false); setFreeExplore(false);
  }, [lessonIndex]);

  useEffect(() => {
    if (stepIndex >= lesson.steps.length) return;
    const target = guidedSequence[stepIndex].progress;
    const start = progressRef.current;
    const distance = Math.abs(target - start);
    const reactionStart = Math.max(lesson.id === 'catalyst' ? .68 : .6, Math.min(start, target));
    const reactionEnd = Math.min(1, Math.max(start, target));
    const reactionDistance = Math.max(0, reactionEnd - reactionStart);
    const catalystReactionDuration = lesson.id === 'catalyst' && reactionDistance > .01
      ? Math.max(900, 6000 * reactionDistance / .4)
      : 0;
    const catalystScaleDuration = lesson.id === 'catalyst' && stepIndex > 0 && Math.max(start, target) <= .66 && distance > .01
      ? Math.max(2800, Math.min(4000, 11200 * distance))
      : 0;
    const mechanismReactionDuration = lesson.id === 'mechanism' && distance > .01
      ? Math.max(1800, Math.min(3600, (activeMechanism?.playMs || 4200) * distance * .9))
      : 0;
    const duration = catalystScaleDuration || catalystReactionDuration || mechanismReactionDuration || (lesson.id === 'catalyst' && distance > .24 ? 1800 : 850);
    cancelGuidedTransition();
    setSelectedPart(null);
    setPlaying(false);
    setFreeExplore(false);
    if (lesson.id === 'battery') setBatteryRate(stepIndex === 3 ? 1.7 : .3);
    if (lesson.id === 'electrochem' && stepIndex > 0) setElectrochemClosed(true);
    if (distance < .002) {
      setVisualProgress(target);
      if (lesson.id === 'electrochem' && stepIndex === 0) {
        setElectrochemFrozenProgress(0);
        setElectrochemClosed(false);
      }
      setGuidedTransitioning(false);
      return undefined;
    }
    setGuidedTransitioning(true);
    const startedAt = performance.now();
    const advance = (now) => {
      const amount = Math.min(1, (now - startedAt) / duration);
      const eased = amount * amount * (3 - 2 * amount);
      setVisualProgress(start + (target - start) * eased);
      if (amount < 1) guidedTransitionRef.current = requestAnimationFrame(advance);
      else {
        guidedTransitionRef.current = undefined;
        if (lesson.id === 'electrochem' && stepIndex === 0) {
          setElectrochemFrozenProgress(0);
          setElectrochemClosed(false);
        }
        setGuidedTransitioning(false);
      }
    };
    guidedTransitionRef.current = requestAnimationFrame(advance);
    return () => cancelGuidedTransition();
  }, [activeMechanism?.playMs, guidedSequence, lesson.id, lesson.steps.length, lessonKey, stepIndex]);

  useEffect(() => {
    if (!playing || lesson.id !== 'mechanism') return undefined;
    let frame;
    let previous = performance.now();
    let lastUiUpdate = previous;
    const advance = (now) => {
      const elapsed = Math.min(now - previous, 50);
      previous = now;
      const next = Math.min(1, progressRef.current + elapsed / (activeMechanism?.playMs || 4200));
      progressRef.current = next;
      if (next >= 1 || now - lastUiUpdate >= 50) {
        lastUiUpdate = now;
        setProgress(next);
      }
      if (next >= 1) setPlaying(false);
      frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [activeMechanism?.playMs, lessonKey, playing]);

  const chooseLesson = (index) => {
    cancelGuidedTransition();
    progressRef.current = 0;
    setProgress(0);
    setStepIndex(0);
    setElectrochemClosed(false);
    setElectrochemFrozenProgress(0);
    setLessonIndex(index);
    setNavOpen(false);
  };
  const chooseMechanism = (id) => {
    if (id === mechanismId) return;
    cancelGuidedTransition();
    setPlaying(false);
    setFreeExplore(false);
    setSelectedPart(null);
    setAnswer(null);
    progressRef.current = 0;
    setProgress(0);
    setStepIndex(0);
    setMechanismId(id);
  };
  const moveStep = (direction) => {
    if (direction > 0 && stepIndex === lesson.steps.length - 1 && guidedTransitioning) return;
    setStepIndex((current) => Math.max(0, Math.min(lesson.steps.length, current + direction)));
  };

  return (
    <main className="app" style={{ '--accent': lesson.color }}>
      <header className="topbar">
        <div className="brand" aria-label="Chemistry, in space">
          <span className="brand-mark"><Atom size={19} strokeWidth={1.7} /></span>
          <strong>Chemistry, in space</strong>
        </div>
        <div className="chapter-position">
          <span>Exhibit {lesson.number}</span>
          <span className="chapter-rule"><i style={{ width: `${((lessonIndex + 1) / lessons.length) * 100}%` }} /></span>
          <span>{lessons.length}</span>
        </div>
        <button className="icon-button mobile-menu" onClick={() => setNavOpen(true)} aria-label="Open exhibit menu" title="Exhibits">
          <Menu size={20} />
        </button>
      </header>

      <div className="workspace">
        <nav className={`exhibit-nav ${navOpen ? 'is-open' : ''}`} aria-label="Chemistry exhibits">
          <div className="nav-heading">
            <span>Field guide</span>
            <button className="icon-button nav-close" onClick={() => setNavOpen(false)} aria-label="Close exhibit menu"><X size={20} /></button>
          </div>
          <div className="exhibit-list">
            {lessons.map((item, index) => {
              const Icon = icons[item.id];
              return (
                <button key={item.id} className={index === lessonIndex ? 'active' : ''} onClick={() => chooseLesson(index)} title={`${item.title}: ${item.short}`}>
                  <span className="nav-number">{item.number}</span>
                  <span className="nav-icon"><Icon size={17} strokeWidth={1.7} /></span>
                  <span className="nav-copy"><strong>{item.title}</strong><small>{item.short}</small></span>
                </button>
              );
            })}
          </div>
        </nav>

        <section className={`visual-stage lesson-${lesson.id} ${stepIndex > 0 ? 'is-focused' : ''} ${lesson.id === 'binding' || lesson.id === 'smell' ? 'molecule-stage' : ''}`} aria-labelledby="lesson-title">
          <div className="stage-heading">
            <div className="category"><LessonIcon size={16} /> {lesson.category}</div>
            <h1 id="lesson-title">{lesson.title}</h1>
            <p>{lesson.question}</p>
          </div>

          {lesson.id === 'binding' || lesson.id === 'smell' ? (
            <Suspense fallback={<div className="scene scene-loading" aria-hidden="true" />}>
              <MoleculeScene key={lesson.id} kind={lesson.id} progress={progress} stepIndex={stepIndex} resetToken={cameraReset} selectedPart={highlightedPart} onSelect={(part) => { setFreeExplore(true); setSelectedPart(part); }} />
            </Suspense>
          ) : (
            <ChemScene lessonId={lesson.id} sceneVariant={activeMechanism?.id} progress={progress} progressSignal={progressRef} stepIndex={stepIndex} resetToken={cameraReset} parameters={{ temperature: snowTemperature, saturation: snowSaturation, chargeRate: batteryRate, circuitClosed: electrochemClosed, circuitFrozenProgress: electrochemFrozenProgress, mechanismId: activeMechanism?.id }} color={lesson.color} selectedPart={highlightedPart} onSelect={(part) => { setFreeExplore(true); setSelectedPart(part); }} />
          )}

          <div className="scene-legend" aria-label="Model legend">
            {lessonLegend.map((item, index) => <span key={item}><i data-swatch={index} style={lessonSwatches?.[index] ? { background: lessonSwatches[index], borderColor: '#7f8783' } : undefined} />{item}</span>)}
          </div>
          {lesson.id === 'catalyst' && (
            <div className="catalyst-scale-rail" aria-label="Same marked region across scale">
              <strong>Same marked region</strong>
              <ol>
                {[['mm', 'channel wall'], ['um', 'washcoat'], ['nm', 'Pt particle'], ['atomic', 'Pt terrace']].map(([scale, label], index) => (
                  <li key={label} className={index === catalystScaleStage ? 'active' : index < catalystScaleStage ? 'complete' : ''}><i /><span>{scale}</span><b>{label}</b></li>
                ))}
              </ol>
            </div>
          )}
          <div className={`scene-readout readout-${lesson.id}`} aria-label="Scientific readout">
            {sceneReadout(lesson.id, progress, { temperature: snowTemperature, saturation: snowSaturation, chargeRate: batteryRate, circuitClosed: electrochemClosed, circuitFrozenProgress: electrochemFrozenProgress }, activeMechanism?.id).map(([label, value], index) => <div key={`${label}-${index}`}><span>{label}</span><strong>{value}</strong></div>)}
          </div>
          {lesson.id === 'binding' && stepIndex === 3 && (
            <div className="concept-inset" aria-label="Receptor occupancy model">
              <strong>Occupancy model</strong><span>[caffeine] / ([caffeine] + Kd)</span>
              <div className="response-bars">{[50, 67, 75, 80, 83].map((height, index) => <i key={height} style={{ height: `${height}%` }}><b>{index + 1}x</b></i>)}</div>
            </div>
          )}
          {lesson.id === 'smell' && stepIndex === 3 && (
            <div className="concept-inset" aria-label="Combinatorial receptor response pattern">
              <strong>Receptor response pattern</strong><span>Illustrative, not measured from 8F76</span>
              <div className="response-bars">{[74, 18, 46, 9, 61, 27].map((height, index) => <i key={index} style={{ height: `${height}%` }}><b>R{index + 1}</b></i>)}</div>
            </div>
          )}
          {lesson.id === 'catalyst' && stepIndex === 3 && (
            <div className="concept-inset energy-inset" aria-label="Catalyzed and uncatalyzed energy paths">
              <strong>Qualitative relative energy</strong><span>Catalyst lowers barriers; curve is not a calculated Pt pathway</span>
              <svg viewBox="0 0 168 72" role="img" aria-label="Catalyzed path has a lower activation-energy peak">
                <path className="axis" d="M8 62H162M8 62V6" />
                <path className="uncatalyzed" d="M10 52 C50 52 54 8 84 8 C114 8 118 58 160 58" />
                <path className="catalyzed" d="M10 52 C35 52 38 30 58 30 C74 30 78 39 92 39 C108 39 113 25 126 27 C140 29 143 58 160 58" />
              </svg>
              <i className="energy-marker" style={{ left: `${Math.round(progress * 100)}%` }} />
            </div>
          )}
          {lesson.id === 'snowflake' && (
            <div className={`concept-inset habit-inset ${stepIndex === 0 ? 'is-intro' : ''}`} aria-label="Qualitative Nakaya snow crystal habit map">
              <strong>Nakaya-style habit map</strong><span>Qualitative regime; dot = current T / supersaturation</span>
              <div className="habit-map">
                <i className="habit-zone low-column-zone">columnar / rosette</i>
                <i className="habit-zone dendrite-zone">plates / dendrites</i>
                <i className="habit-zone column-zone">columns / needles</i>
                <i className="habit-zone plate-zone">plates</i>
                <b className="habit-dot" style={{ left: `${Math.max(2, Math.min(98, ((snowTemperature + 25) / 23) * 100))}%`, top: `${100 - Math.max(2, Math.min(98, ((snowSaturation - .02) / .28) * 100))}%` }} />
                <small className="habit-y">above ice saturation</small>
              </div>
              <div className="habit-axis"><span>-25 °C</span><span>-2 °C</span></div>
            </div>
          )}
          {lesson.id === 'ir' && (
            <div className="concept-inset ir-inset" aria-label="Infrared transmittance spectrum of CO2">
              <strong>IR spectrum · CO₂</strong><span>dips = absorption · scan bar tracks the beam</span>
              <svg viewBox="0 0 200 100" role="img" aria-label="CO2 infrared spectrum: strong peak at 2349, weaker at 667, and a silent gap at 1340">
                <path className="axis" d="M8 80 H192" />
                <polyline className="ir-trace" points="8,26 84,26 92,68 100,26 170,26 178,62 186,26 192,26" />
                <line className="ir-silent" x1="144" y1="26" x2="144" y2="36" />
                <line className="ir-cursor" x1={8 + progress * 184} y1="14" x2={8 + progress * 184} y2="80" />
                <text className="ir-peak" x="92" y="80">2349</text>
                <text className="ir-peak silent" x="144" y="44">1340 silent</text>
                <text className="ir-peak" x="178" y="80">667</text>
                <text className="ir-axis-end" x="8" y="94">4000</text>
                <text className="ir-axis-end end" x="192" y="94">400 cm⁻¹</text>
              </svg>
            </div>
          )}

          <div className="scene-instruction"><Rotate3D size={16} /> Drag to rotate <span /> <MousePointer2 size={15} /> Select a structure <span /> <button onClick={() => setCameraReset((value) => value + 1)}><RotateCcw size={15} /> Reset view</button></div>

          <div className={`simulation-control ${hasContinuousControl ? '' : 'mode-control'}`}>
            {hasContinuousControl ? (
              <>
                {lesson.id === 'mechanism' && (
                  <div className="mechanism-picker" role="group" aria-label="Reaction mechanism">
                    {mechanismSpecs.map((spec) => (
                      <button key={spec.id} aria-pressed={spec.id === activeMechanism?.id} title={spec.title} onClick={() => chooseMechanism(spec.id)}>{spec.label}</button>
                    ))}
                  </div>
                )}
                <div className="control-labels"><span>{lesson.control[0]}</span><span>{lesson.control[1]}</span></div>
                <div className="range-row">
                  {lesson.id === 'mechanism' && (
                    <button className="play-control" aria-label={playing ? 'Pause reaction' : 'Play reaction'} title={playing ? 'Pause' : 'Play'} onClick={() => {
                      cancelGuidedTransition();
                      if (!playing && progress >= .999) setVisualProgress(0);
                      setFreeExplore(true);
                      setPlaying((value) => !value);
                    }}>
                      {playing ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                  )}
                  <input
                    aria-label={`Move between ${lesson.control[0]} and ${lesson.control[1]}`}
                    type="range" min="0" max="1" step="0.01" value={progress}
                    style={{ '--value': `${progress * 100}%` }}
                    onChange={(event) => { cancelGuidedTransition(); setPlaying(false); setFreeExplore(true); setVisualProgress(Number(event.target.value)); }}
                  />
                </div>
                {lesson.id === 'snowflake' && (
                  <div className="parameter-grid">
                    <label><span>Air temperature</span><strong>{snowTemperature} °C</strong><input style={{ '--value': `${((snowTemperature + 25) / 23) * 100}%` }} aria-label="Air temperature in degrees Celsius" type="range" min="-25" max="-2" step="1" value={snowTemperature} onChange={(event) => { setFreeExplore(true); setSnowTemperature(Number(event.target.value)); }} /></label>
                    <label><span>Above ice saturation</span><strong>{Math.round(snowSaturation * 100)}%</strong><input style={{ '--value': `${((snowSaturation - .02) / .28) * 100}%` }} aria-label="Vapour supersaturation relative to ice" type="range" min="0.02" max="0.3" step="0.01" value={snowSaturation} onChange={(event) => { setFreeExplore(true); setSnowSaturation(Number(event.target.value)); }} /></label>
                  </div>
                )}
                {lesson.id === 'battery' && (
                  <div className="parameter-grid one-parameter">
                    <label><span>Illustrative charge rate</span><strong>{batteryRate.toFixed(1)} C</strong><input style={{ '--value': `${((batteryRate - .2) / 1.8) * 100}%` }} aria-label="Illustrative battery charge rate in C" type="range" min="0.2" max="2" step="0.1" value={batteryRate} onChange={(event) => { setFreeExplore(true); setBatteryRate(Number(event.target.value)); }} /></label>
                  </div>
                )}
                {lesson.id === 'electrochem' && (
                  <label className="circuit-toggle"><input type="checkbox" checked={electrochemClosed} onChange={(event) => { cancelGuidedTransition(); setFreeExplore(true); if (!event.target.checked) setElectrochemFrozenProgress(progress); setElectrochemClosed(event.target.checked); }} /><span>External switch</span><strong>{electrochemClosed ? 'Closed' : 'Open'}</strong></label>
                )}
              </>
            ) : (
              <div className="mode-options" aria-label={`${lesson.title} view`} style={{ '--modes': lesson.control.length }}>
                {lesson.control.map((label, index) => (
                  <button key={label} className={Math.round(progress * (lesson.control.length - 1)) === index ? 'active' : ''} aria-pressed={Math.round(progress * (lesson.control.length - 1)) === index} onClick={() => { cancelGuidedTransition(); setFreeExplore(true); setVisualProgress(index / (lesson.control.length - 1)); }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedPart && (
            <div className="part-popover" role="status">
              <button onClick={() => { setSelectedPart(null); setFreeExplore(false); }} aria-label="Close structure explanation"><X size={16} /></button>
              <span>Selected structure</span>
              <strong>{selectedPart}</strong>
              <p>{lesson.parts[selectedPart] || 'This structure contributes to the system shown in the current model.'}</p>
            </div>
          )}
        </section>

        <aside className="lesson-panel">
          {stepIndex < lesson.steps.length ? (
            <div key={`${lessonKey}-${stepIndex}`} className="lesson-step-content">
              <div className="lesson-kicker"><BookOpen size={15} /> Guided investigation</div>
              <div className="step-count">{String(stepIndex + 1).padStart(2, '0')} <span>/ {String(lesson.steps.length).padStart(2, '0')}</span></div>
              <h2>{lesson.steps[stepIndex][0]}</h2>
              <p className="lesson-text">{lesson.steps[stepIndex][1]}</p>
              <p className="observation-note"><span>Observe</span>{lessonObservations[stepIndex]}</p>
              {stepIndex === 0 && <p className="lesson-summary">{lesson.summary}</p>}
              {stepIndex === 0 && <p className="evidence-note">{lesson.evidence}</p>}
              <div className="term-list">
                {[guidedView.part].map((part) => (
                  <button key={part} onClick={() => setSelectedPart(part)}><span>{part}</span><ChevronRight size={15} /></button>
                ))}
              </div>
            </div>
          ) : (
            <div className="knowledge-check">
              <div className="lesson-kicker"><Sparkles size={15} /> Check your model</div>
              <h2>{lesson.check.q}</h2>
              <div className="answers">
                {lesson.check.options.map((option, index) => (
                  <button
                    key={option}
                    className={answer === index ? (index === lesson.check.answer ? 'correct' : 'incorrect') : ''}
                    onClick={() => setAnswer(index)}
                  >
                    <span>{String.fromCharCode(65 + index)}</span>{option}
                    {answer === index && index === lesson.check.answer && <Check size={17} />}
                  </button>
                ))}
              </div>
              {answer !== null && <p className="feedback">{answer === lesson.check.answer ? `Correct. ${lesson.check.explanation}` : `Recheck the highlighted paths or structures. ${lesson.check.explanation}`}</p>}
            </div>
          )}

          <div className="step-navigation">
            <button className="icon-button" onClick={() => moveStep(-1)} disabled={stepIndex === 0} aria-label="Previous learning step" title="Previous"><ChevronLeft size={20} /></button>
            <div className="step-dots">
              {[...Array(lesson.steps.length + 1)].map((_, index) => <i key={index} className={index === stepIndex ? 'active' : ''} />)}
            </div>
            <button className="next-button" onClick={() => moveStep(1)} disabled={stepIndex === lesson.steps.length || (stepIndex === lesson.steps.length - 1 && guidedTransitioning)}>
              {stepIndex === lesson.steps.length - 1 ? 'Check understanding' : 'Continue'} <ChevronRight size={17} />
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}

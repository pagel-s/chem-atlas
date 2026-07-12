import { readFileSync } from 'node:fs';
import { lessons } from '../src/lessons.js';
import { mechanismSpecs } from '../src/mechanismSpecs.js';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const scene = readFileSync(new URL('../src/ChemScene.jsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const pdb5mzp = readFileSync(new URL('../public/data/5mzp.pdb', import.meta.url), 'utf8');
const pdb8f76 = readFileSync(new URL('../public/data/8f76.pdb', import.meta.url), 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(lessons.length === 18, 'Expected eighteen chemistry exhibits.');
// The analytical suite: each technique needs a scene, a spectrum panel, and its parts.
['ir', 'raman', 'uvvis', 'nmr', 'massspec', 'xrd', 'fluorescence'].forEach((id) => {
  const lesson = lessons.find((item) => item.id === id);
  assert(lesson && lesson.category === 'Analytical techniques', `Analytical exhibit missing: ${id}.`);
  assert(app.includes(`lesson.id === '${id}'`), `${id}: spectrum panel is not wired into the stage.`);
  assert(app.includes(`${id}:`), `${id}: missing from the App per-lesson maps.`);
});
const irLesson = lessons.find((lesson) => lesson.id === 'ir');
const ramanLesson = lessons.find((lesson) => lesson.id === 'raman');
assert(irLesson.parts['Dipole moment'] && ramanLesson.parts.Polarisability, 'IR and Raman must expose their different selection rules.');
// Mutual exclusion must fall out of the shared geometry, not be asserted by hand.
assert(scene.includes('function co2State') && scene.includes('mu: sum.clone().multiplyScalar(-1)') && scene.includes('polar: (rL + rR) / (2 * CO2_L)'), 'CO2 dipole and polarisability must be derived from one shared normal-mode geometry.');
assert(new Set(lessons.map((lesson) => lesson.check.answer)).size >= 3, 'Knowledge-check answers must not share one position.');
lessons.forEach((lesson) => {
  assert(lesson.steps.length === 4, `${lesson.id}: expected four authored investigation steps.`);
  assert(lesson.check.options.length === 3, `${lesson.id}: expected three assessment options.`);
  assert(lesson.check.explanation?.length > 30, `${lesson.id}: assessment needs evidence-based feedback.`);
});
assert(mechanismSpecs.length === 7, 'Mechanism exhibit must offer seven mechanism views.');
assert(new Set(mechanismSpecs.map((spec) => spec.id)).size === 7, 'Mechanism ids must be unique.');
['sn2', 'suzuki', 'dielsAlder', 'e2', 'sn1', 'carbonyl', 'michael'].forEach((id) => {
  assert(mechanismSpecs.some((spec) => spec.id === id), `Required mechanism variant is missing: ${id}.`);
  assert(scene.includes(`parameters.mechanismId === '${id}'`) || id === 'sn2', `Mechanism scene dispatch missing for ${id}.`);
});
mechanismSpecs.forEach((spec) => {
  assert(spec.steps.length === 4 && spec.guidedViews.length === 4, `${spec.id}: expected four guided states.`);
  assert(spec.check.options.length === 3 && spec.check.explanation?.length > 30, `${spec.id}: assessment needs evidence-based feedback.`);
  spec.guidedViews.forEach((view) => assert(spec.parts[view.part], `${spec.id}: guided view references undefined part ${view.part}.`));
});

assert(!app.includes('useState(.28)'), 'Discrete exhibits must not initialize in a partial state.');
assert(app.includes('guidedViews'), 'Guided steps must author scene states.');
assert(app.includes('(lessonIndex + 1) / lessons.length'), 'Chapter progress must scale with the current number of exhibits.');
assert(app.includes('mechanismSpecs') && app.includes('sceneVariant'), 'Mechanism variants must drive the lesson content and scene switch together.');
assert(app.includes('id: baseLesson.id'), 'Mechanism variants must not overwrite the parent exhibit id.');
assert(scene.includes('2 CO(g) + O2(g)  ->  2 CO2(g)'), 'Catalyst cycle must show balanced carbon and oxygen.');
assert(scene.includes('Zn(s) + Cu2+(aq)') && scene.includes('Zn2+(aq) + Cu(s)'), 'Electrochemical event ledger is missing.');
assert(lessons[0].evidence.includes('idealized layered-oxide') && !lessons[0].evidence.includes('LiCoO2'), 'Battery host must be labelled as an idealized layered oxide, not a composition-specific crystal.');
assert(scene.includes("labelSprite('Li(s)'"), 'Fast-charge plating must be identified as metallic lithium, not Li+.');
assert(scene.includes("labelSprite('TRACKED Li+'"), 'Battery must expose the tracked Li+ carrier.');
assert(scene.includes('new THREE.LineDashedMaterial'), 'Battery must expose an explicit carrier path.');
assert(scene.includes('EXTERNAL CHARGER') && lessons[0].parts['External charger'], 'Charging view must show and explain its external power source.');
assert(scene.includes('graphite.position.x = -1.65;') && scene.includes('cathode.position.x = 1.65;'), 'Battery electrode separation must remain fixed during charge transfer.');
assert(!scene.includes('graphite.position.x = THREE.MathUtils.lerp'), 'Battery electrodes must not translate toward one another during charge transfer.');
assert(scene.includes('visibleWireSections') && scene.includes('chargerPlusVertical') && scene.includes('chargerMinus.position.set(-.16'), 'Charging view must interrupt the visible wire at the charger and show correct terminal polarity.');
assert(scene.includes("platingAmount < .48") && app.includes('growing'), 'Lithium-plating labels and readout must crossfade continuously rather than contradict each other.');
assert(scene.includes('new THREE.Vector3(0, .544, .839)'), 'Water lone-pair geometry must use tetrahedral directions.');
assert(app.includes("progress: .3, part: 'Washcoat'") && app.includes("progress: .66, part: 'Pt(111) terrace'"), 'Catalyst guided sequence must stop at the anchored washcoat and settled Pt terrace.');
assert(scene.includes('const channelDepth = .62;') && scene.includes('new THREE.ExtrudeGeometry(honeycombShape()') && scene.includes('const makeSelectedWallStrip') && scene.includes("'Selected channel wall'"), 'Catalyst macro view must use one connected honeycomb monolith with a marked inner-wall strip.');
assert(scene.includes('const selectedParticleAnchor = new THREE.Vector3(.23, .2, .05);') && scene.includes("addHexLayer(selectedParticle, 2, .061") && scene.includes('const wallParticleAnchor = selectedWallAnchor.clone().add(selectedParticleAnchor.clone().applyQuaternion(wallSurfaceFrame));') && scene.includes("'Pt(111) terrace'"), 'Catalyst scale transition must retain one selected Pt nanoparticle and its flat top terrace.');
assert(app.includes('catalyst-scale-rail') && styles.includes('.catalyst-scale-rail') && lessons.find((lesson) => lesson.id === 'catalyst').evidence.includes('mm channel -> um washcoat -> nm Pt particle'), 'Catalyst scale hierarchy must remain explicit, including on compact layouts.');
assert(scene.includes('const ooBond = dynamicDoubleBond') && scene.includes('const weakOOBond = dynamicBond') && scene.includes('smoothstep(value, .985, 1)'), 'Catalyst must show O2 bond weakening before dissociation and preserve O2-derived traces through desorption.');
assert(scene.includes('const reactantOpacity = surfaceOpacity * THREE.MathUtils.smoothstep(value, .68, .72);'), 'Catalyst gases must wait until the Pt-particle-to-terrace handoff has resolved.');
assert(scene.includes('const oxygenHollowSites') && scene.includes('const oHollowBondsA') && scene.includes('oHollowBondsA.forEach'), 'Catalyst O atoms must move to threefold hollow-site teaching geometry on Pt(111).');
assert(app.includes("lesson.id === 'catalyst' && stepIndex === 3"), 'Catalyst energy comparison must appear with the reaction step rather than the scale handoff.');
assert(scene.includes('const selectedFaceCentre = new THREE.Vector3(') && scene.includes('const selectedWallAnchor = selectedFaceCentre.clone().add(selectedFaceInset)') && scene.includes('makeSelectedWallStrip()'), 'Catalyst washcoat magnification must originate from the actual marked hexagonal channel-wall face.');
assert(scene.includes('const wallTangent = wallAxis.clone().cross(wallSurfaceNormal).normalize();') && scene.includes('new THREE.Matrix4().makeBasis(wallTangent, wallAxis, wallSurfaceNormal)') && scene.includes('washcoat.position.copy(selectedWallAnchor);') && scene.includes('foldedWallRails') && !scene.includes('foldedWallFaces') && scene.includes('atomicSurface.position.copy(wallAtomicAnchor);') && scene.includes('g.userData.cameraStops = ['), 'Catalyst magnification must retain one aligned hex-wall frame, compact neighbouring wall rails, and model-derived camera stops.');
assert(scene.includes('modelRoot.localToWorld(new THREE.Vector3(...stop.target))') && scene.includes('modelRoot.localToWorld(new THREE.Vector3(...stop.offset)).sub(origin)'), 'Catalyst camera framing must follow the transformed model on compact as well as desktop layouts.');
assert(scene.includes('let compactMode; let cameraNeedsReset = false;') && scene.includes("if (lessonId === 'catalyst') cameraNeedsReset = true;") && scene.includes("if (cameraNeedsReset) {"), 'Catalyst camera framing must reset after responsive model transforms without requiring another scene interaction.');
assert(scene.includes(".065 + index * .005") && scene.includes('const selectedParticleAnchor = new THREE.Vector3(.23, .2, .05);'), 'Catalyst Pt particles must sit on the oxide support rather than float above it.');
assert(app.includes("progress < .62 ? 'not yet in atomic facet view'") && app.includes("progress < .66 ? 'Pt(111) facet resolving; sites not yet counted'") && app.includes("progress < .68 ? '4 vacant Pt sites; no gases yet'"), 'Catalyst site ledger must not imply counted Pt sites before the atomic terrace is resolved.');
assert(app.includes("lesson.id === 'catalyst' ? .68 : .6") && app.includes('Math.max(start, target) <= .66') && app.includes('catalystScaleDuration || catalystReactionDuration'), 'Catalyst scale handoffs must remain slow and distinct from the later reaction animation.');
assert(scene.includes('parameters.temperature') && scene.includes('parameters.saturation'), 'Snow morphology must respond to temperature and supersaturation.');
assert(lessons.find((lesson) => lesson.id === 'snowflake').evidence.includes('Representative ice-growth regimes'), 'Snow model must disclose that controls compare representative growth regimes.');
assert(lessons.find((lesson) => lesson.id === 'lattice').steps[3][1].includes('(001)') && lessons.find((lesson) => lesson.id === 'lattice').steps[3][1].includes('{100}') && lessons.find((lesson) => lesson.id === 'lattice').steps[3][1].includes('[001]'), 'Rock-salt cleavage must identify the (001) plane, {100} family, and [001] opening direction.');
assert(lessons.find((lesson) => lesson.id === 'orbitals').evidence.includes('isosurfaces') && !scene.includes('new THREE.Points('), 'Orbital view must disclose smooth qualitative isosurfaces rather than a point cloud.');
assert(scene.includes('function suzukiMechanism') && scene.includes('function dielsAlderMechanism'), 'Suzuki and Diels-Alder scenes are missing.');
assert(scene.includes("parameters.mechanismId === 'suzuki'") && scene.includes("parameters.mechanismId === 'dielsAlder'"), 'Mechanism scene dispatch is missing.');
assert(mechanismSpecs.find((spec) => spec.id === 'suzuki').evidence.includes('Idealized Pd catalytic sequence'), 'Suzuki view must disclose its idealized catalytic scope.');
assert(mechanismSpecs.find((spec) => spec.id === 'dielsAlder').evidence.includes('qualitative LCAO model'), 'Diels-Alder orbital lobes must be disclosed as a qualitative LCAO phase model.');
assert(mechanismSpecs.find((spec) => spec.id === 'dielsAlder').guidedViews[0].progress >= .24, 'The first Diels-Alder guided state must reach the prepared s-cis conformer.');
assert(scene.includes('const dienePiOrbitals = makePiOrbitals') && scene.includes('const dienophilePiOrbitals = makePiOrbitals') && scene.includes('[phaseNegative, phasePositive], [phasePositive, phaseNegative]') && scene.includes('applyAxisAngle(dieneAxis, Math.PI * cisPreparation)') && scene.includes('const product = THREE.MathUtils.smoothstep(value, .72, .96);') && scene.includes('const pucker = THREE.MathUtils.smoothstep(value, .8, .96);'), 'Diels-Alder must show phase-matched p-orbital pairs, rotate into s-cis without compressing a C-C bond, and synchronize pi-bond reorganization with sigma-bond closure and late ring puckering.');
assert(scene.includes("'Br- off-cycle'") && scene.includes("'borate by-product'") && scene.includes('const bromideDeparture = THREE.MathUtils.smoothstep(value, .3, .44);'), 'Suzuki must separate bromide departure from aryl transfer and identify both off-cycle fragments before they fade.');
assert(scene.includes('const planeNormal = new THREE.Vector3(') && scene.includes('const coordinationU = new THREE.Vector3(') && scene.includes('const coordinationV = new THREE.Vector3().crossVectors(planeNormal, coordinationU).normalize();') && scene.includes("labelSprite('Pd(II): square planar'"), 'Suzuki must expose a real oblique square-planar Pd(II) coordination frame.');
assert(scene.includes('const placeAryl = (fragment, ipsoPosition, ipsoAxis, torsion) => {') && scene.includes('const torsionA =') && scene.includes('const torsionB =') && !scene.includes('applyEuler(fragment.group.rotation)'), 'Suzuki aryl rings must rotate about anchored Pd-C axes rather than remain planar.');
assert(scene.includes('cBBond(rightCarbon, boronate.position, 1 - THREE.MathUtils.smoothstep(value, .44, .52));') && scene.includes('const eliminationDirection = eliminationStartVector.clone().normalize().applyQuaternion(') && scene.includes('const eliminationDistance = THREE.MathUtils.lerp(eliminationStartVector.length(), eliminationEndVector.length(), reductiveElimination);') && scene.includes('productBond(leftCarbon, rightCarbon, cCBondClosure);') && scene.includes('const reductiveElimination = THREE.MathUtils.smoothstep(value, .72, .9);'), 'Suzuki must contract aryl-carbon separation monotonically, fade C-B before transfer stretches it, and form a torsioned biaryl during reductive elimination.');
assert(scene.includes('equation.visible = false;') && scene.includes('setSpriteOpacity(arylBromide.text, 1 - THREE.MathUtils.smoothstep(value, .14, .26));') && scene.includes('setSpriteOpacity(bromideLabel, THREE.MathUtils.smoothstep(value, .34, .42)') && scene.includes('setSpriteOpacity(borateLabel, THREE.MathUtils.smoothstep(value, .66, .72)') && scene.includes('const squareLabelOpacity =') && scene.includes('pdZeroLabelOpacity = Math.max('), 'Suzuki must keep evidence labels stage-specific instead of overlapping the teaching interface.');
assert(scene.includes('const hydroxyls = [[.23,.4,0],[.23,-.4,0]];') && scene.includes('addScaledVector(productAxis, .23)') && scene.includes('addScaledVector(productAxis, -.23)'), 'Suzuki boronate geometry must remain trigonal planar and the final biaryl bond must match the arene bond scale.');
assert(scene.includes('pdZero.position.set(0, .78, .14)') && scene.includes('pdTwo.position.set(.74, -.55, .12)'), 'Suzuki oxidation-state labels must stay clear of the oblique square-planar coordination positions.');
assert(app.includes('progressSignal={progressRef}') && scene.includes('progressSignal?.current ?? progressRef.current'), 'Mechanism autoplay must drive the scene from a per-frame progress signal.');
assert(scene.includes('const cameraIndex = Math.max(0, Math.min((activeCameraViews?.length || 1) - 1, step));'), 'Mechanism knowledge checks must retain the final-product camera framing.');
assert(app.includes('O2* + 2 CO(g) -> O2* + 2 CO*') && app.includes('2 CO* + O2* -> 2 CO* + 2 O*'), 'Catalyst site ledger must conserve adsorbed oxygen and carbon through adsorption and dissociation.');
const electrochemLesson = lessons.find((lesson) => lesson.id === 'electrochem');
assert(electrochemLesson.evidence.includes('E°cell = +1.10 V under standard conditions'), 'Electrochemical standard potential must be scoped to standard conditions.');
assert(electrochemLesson.parts['Nitrate ion']?.includes('Two NO3-') && electrochemLesson.parts['Potassium ion']?.includes('Two K+'), 'Salt-bridge counterion stoichiometry is missing.');
assert(scene.includes('SWITCH OPEN: NO CURRENT') && scene.includes('SWITCH CLOSED: 2 e- THROUGH WIRE'), 'Electrochemical scene must distinguish open circuit from a closed electron path.');
assert(scene.includes('CLOSED-CIRCUIT EVENT: Zn(s) + Cu2+(aq)') && scene.includes('ledger.visible = circuitClosed;'), 'Electrochemical ledger must not imply a reaction while the circuit is open.');
assert(scene.includes('2 NO3-') && scene.includes('2 K+') && scene.includes("'Nitrate ion'") && scene.includes("'Potassium ion'"), 'Electrochemical scene must track both counterion pairs explicitly.');
assert(scene.includes('const deposit = THREE.MathUtils.smoothstep(event, .6, .76);') && scene.includes('const cathodeCharged = deposit > .6 && balance < .92'), 'Copper deposition and cathode charge must follow electron arrival rather than precede it.');
assert(scene.includes("{ transparent: true, opacity: 0, emissive: 0xf1c444") && scene.includes('const counterionFade = THREE.MathUtils.smoothstep(event, .62, .7);'), 'Electrons and counterions must fade rather than pop into the electrochemical scene.');
assert(app.includes("lesson.id === 'electrochem' && stepIndex > 0") && app.includes("lesson.id === 'electrochem' && stepIndex === 0"), 'Electrochemical switch state must follow the guided transition rather than reset the scene before it rewinds.');
assert(app.includes('circuitFrozenProgress') && scene.includes('parameters.circuitFrozenProgress ?? 0'), 'Opening the external switch must hold the completed redox state instead of undoing it at the current slider position.');
assert(app.includes('circuitClosed') && app.includes('External switch'), 'Electrochemical control must expose the circuit state.');
const synthesisLesson = lessons.find((lesson) => lesson.id === 'synthesis');
assert(synthesisLesson?.steps.length === 4 && synthesisLesson.evidence.includes('LC/MS-style analytical response'), 'Synthesis workflow must disclose its illustrative analytical metric.');
assert(synthesisLesson.parts.Replicate && synthesisLesson.parts['Control well'] && synthesisLesson.parts.Analysis, 'Synthesis workflow must distinguish conditions, replicates, controls, and analysis.');
assert(synthesisLesson.evidence.includes('coupling reagent') && scene.includes('COUPLING REAGENT') && app.includes('coupling reagent -> ArCONHR'), 'Synthesis reaction shorthand must disclose the coupling reagent.');
assert(scene.includes(".04, .19, .36, .88, .22, .02") && scene.includes('D4: REPLICATE OF D3') && scene.includes('ROWS: BASE | D4 REPEAT | F4 BLANK'), 'Synthesis replicate must agree with the highlighted candidate condition and identify both screen axes.');
assert(scene.includes('function synthesisExhibit') && scene.includes('4 x 6 INDEPENDENT WELLS') && scene.includes('CANDIDATE -> VERIFY IN FLASK'), 'Synthesis workflow scene is incomplete.');
assert(app.includes("synthesis: [['Workflow stage'") && app.includes("'independent wells, not one mixture'"), 'Synthesis readout must explain independent wells rather than a shared mixture.');
assert(!scene.includes('new THREE.Color(0x416e70).lerp(new THREE.Color(0xd1b75a)'), 'Synthesis updates must not allocate response colours on every animation frame.');
assert(styles.includes('overflow-y:auto') && styles.includes('.lesson-electrochem .scene-legend { display:grid; top:230px; }'), 'Navigation and electrochemical teaching context must remain accessible on compact viewports.');
assert(scene.includes('const wasCompactMode = compactMode;') && scene.includes('if (wasCompactMode && !nextCompactMode) replaceModel'), 'World labels must be rebuilt after returning from compact mode.');
assert(pdb5mzp.includes(' CFF '), '5MZP caffeine ligand CFF is missing.');
assert(pdb8f76.includes(' PPI '), '8F76 propionate ligand PPI is missing.');

console.log('Science integrity checks passed for 18 exhibits and 7 mechanism variants.');

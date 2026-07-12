export const lessons = [
  {
    id: 'battery', number: '01', title: 'Ion & electron choreography', short: 'Two carriers, one circuit', category: 'Everyday chemistry', color: '#d65f38',
    question: 'Why must lithium ions and electrons take different paths during charging?',
    summary: 'Track matched Li+ and electron motion between graphite and an idealized layered-oxide host.',
    evidence: 'Schematic layered-carbon/idealized layered-oxide teaching cutaway with an external charger · topology and particle sizes enlarged · not a crystal-derived composition, wound-stack engineering cross-section, or oxidation-state model',
    control: ['Start: Li in layered oxide', 'End: Li in graphite'],
    parts: {
      'Positive electrode': 'An idealized layered-oxide host. During charge, Li+ leaves this host while electrons leave through the external circuit. The diagram does not specify a particular oxide composition, oxidation state, or crystal structure. It is the cathode during discharge and the anode during charging.',
      'Negative electrode': 'The graphite host. During charge: C6 + xLi+ + xe- -> LixC6. It is the anode during discharge and the cathode during charging.',
      Separator: 'A porous electrical insulator that lets ions pass while preventing an internal short circuit.',
      Electrolyte: 'An ion-conducting liquid that carries Li+ between electrodes but does not carry electrons.',
      'Lithium ion': 'Li+ crosses the electrolyte and porous separator, then occupies sites in an electrode host structure.',
      'Metallic lithium': 'In this illustrative high-rate condition, Li(s) forms when Li+ accepts electrons at the negative-electrode surface faster than it can intercalate into graphite.',
      Electron: 'Electrons cannot cross the separator. During charging, the external charger drives them through the wire while Li+ moves internally.',
      'External charger': 'A power source in series with the external circuit supplies energy to drive lithium from the layered-oxide host toward graphite during charging.',
      Casing: 'The steel enclosure and terminal hardware protect the wound cell. They are not the cathode active material.'
    },
    steps: [
      ['Two paths, one circuit', 'The external charger drives electrons through the wire while Li+ moves through the electrolyte. Charge remains balanced on both sides.'],
      ['Stored between layers', 'Lithium does not plate onto graphite during normal charging; Li+ is inserted between layered carbon sheets, a process called intercalation.'],
      ['Redox drives the motion', 'Oxidation at one electrode releases electrons and reduction at the other consumes them. The voltage reflects the difference in chemical potential.'],
      ['When charging is too fast', 'Raise the separate charge-rate control. If Li+ arrives faster than graphite can intercalate it, metallic lithium can plate on the negative electrode and increase safety risk.']
    ],
    check: { q: 'In the model, which paired paths keep charge transfer coupled?', options: ['Li+ and electrons both cross the separator', 'Li+ crosses the electrolyte while electrons use the external circuit', 'Only Li+ moves; electrons remain fixed'], answer: 1, explanation: 'The gold Li+ path crosses the porous separator while the yellow electron path stays in the wire.' }
  },
  {
    id: 'binding', number: '02', title: 'Molecular recognition', short: 'Shape meets chemistry', category: 'Medicinal chemistry', color: '#c94d68',
    question: 'How does caffeine block a receptor without forming a covalent bond?',
    summary: 'Enter the human A2A adenosine receptor and inspect experimentally determined contacts around caffeine.',
    evidence: 'PDB 5MZP · caffeine alternate conformer A · engineered thermostabilized A2A construct · X-ray diffraction · 2.1 Å',
    control: ['Whole receptor', 'Binding pocket'],
    parts: {
      Ligand: 'Caffeine, shown from its experimental coordinates. It occupies the receptor pocket as a non-covalent antagonist.',
      'Binding pocket': 'The cavity in the A2A receptor surrounding caffeine. Nearby residue side chains are shown as sticks.',
      'Hydrogen bond': 'A potential polar contact. This view reports nearest heavy-atom distances; a full donor/acceptor geometry test is outside the display.',
      'Hydrophobic region': 'A non-polar surface where excluding ordered water can favour binding.'
    },
    steps: [
      ['An experimental structure', 'This model is based on a 2.1 Å X-ray structure of a stabilized human A2A receptor with caffeine in its binding pocket.'],
      ['Many weak contacts', 'Hydrogen bonding, dispersion interactions and close shape complementarity act together; no new covalent bond is required. The selected heavy-atom separations are ASN253 ND2-O11: 2.89 Å, PHE168 CD1-N3: 3.41 Å, and ILE274 CD1-C8: 3.35 Å; they are contact distances, not all hydrogen bonds.'],
      ['Antagonism by occupation', 'Caffeine occupies an adenosine-receptor pocket without activating it in the same way as the natural signalling molecule.'],
      ['Binding is an equilibrium', 'The inset separates a concentration–occupancy model from the single experimental structure. Increasing ligand concentration raises average occupancy; 5MZP itself is one bound conformer.']
    ],
    check: { q: 'Which observation best supports non-covalent pocket binding?', options: ['Caffeine becomes part of the receptor backbone', 'Every nearby residue makes the same interaction', 'Several named residues approach different caffeine atoms without a new covalent link'], answer: 2, explanation: 'The contact view shows several short, chemically different contacts around an intact caffeine ligand.' }
  },
  {
    id: 'snowflake', number: '03', title: 'Snowflake growth', short: 'Symmetry from water', category: 'Physical chemistry', color: '#287f98',
    question: 'How do ice structure and vapour transport together produce six-fold branches?',
    summary: 'Connect hydrogen bonding at the molecular scale to the branching symmetry of atmospheric ice.',
    evidence: 'Representative ice-growth regimes informed by a qualitative Nakaya-style habit map · local ice-Ih motif and vapour flux are schematic · not a predictive weather model or a phase-transition simulation',
    control: ['Nucleation', 'Branch growth'],
    parts: {
      Branch: 'A crystal tip grows rapidly because water vapour reaches protruding regions more readily.',
      'Hexagonal lattice': 'Ordinary atmospheric ice arranges oxygen atoms in a structure with six-fold symmetry.',
      'Hydrogen bond': 'Each water molecule can participate in an extended directional network. The local motif shows the orientation idea, not an Ice Ih coordinate file or a complete molecular-dynamics model.',
      Facet: 'A flat crystal face whose growth rate depends strongly on temperature and water-vapour supersaturation.'
    },
    steps: [
      ['Molecules join a lattice', 'Water vapour parcels approach the growth front. The particle view is schematic; real incorporation requires molecular reorientation into an ordered hydrogen-bond network.'],
      ['Six directions emerge', 'The molecular arrangement in hexagonal ice makes six equivalent growth directions visible at the crystal scale.'],
      ['Instability creates branches', 'A tiny protrusion collects vapour faster than a flat region, so it grows and amplifies itself.'],
      ['Weather selects a regime', 'Temperature and humidity favour different growth habits. Moving the controls compares representative plate, column and dendritic regimes; it does not make one finished crystal undergo a phase transition.']
    ],
    check: { q: 'Why do protruding tips branch first in the growth view?', options: ['They intercept a larger vapour flux than recessed regions', 'Their water molecules contain more hydrogen', 'They are warmer than every flat facet'], answer: 0, explanation: 'The inward flux arrows converge on exposed tips, so a small protrusion amplifies during deposition.' }
  },
  {
    id: 'catalyst', number: '04', title: 'Pt catalyst: CO oxidation', short: 'A surface that cleans air', category: 'Surface chemistry', color: '#9a6b22',
    question: 'How can a platinum-group surface convert carbon monoxide into carbon dioxide?',
    summary: 'Follow one marked channel-wall patch into its porous washcoat, one supported Pt nanoparticle, and an idealized Pt(111) top facet before tracking CO oxidation.',
    evidence: 'Multiscale teaching model · representative scale rail: mm channel -> um washcoat -> nm Pt particle -> atomic terrace · idealized Langmuir-Hinshelwood sequence on a Pt(111) facet · atom positions are a teaching animation, not an atomistic trajectory or a full three-way converter',
    control: ['Marked channel wall', 'Pt(111) terrace'],
    parts: {
      Honeycomb: 'Thousands of narrow channels provide a large coated area without greatly restricting gas flow. This is the macroscopic context for the selected coating patch.',
      'Selected channel wall': 'The amber strip is one selected inner-wall patch of a representative monolith channel. The next view magnifies this exact marked region; it is not a separate floating object.',
      Washcoat: 'The amber outline encloses the porous oxide layer on that selected channel wall. It spreads catalytic nanoparticles over a large accessible area.',
      'Selected Pt nanoparticle': 'The amber halo selects one finite Pt nanoparticle supported on the washcoat. The next view magnifies its top facet; the small contextual particles are not additional active-site models.',
      'Pt(111) terrace': 'An idealized top facet of the selected Pt nanoparticle. Its silver atoms provide a local surface context for the four displayed adsorption sites.',
      'Metal site': 'Only exposed Pt atoms participate. Real particles also contain edges, steps, supports and coverage effects that change rates.',
      'Adsorbed molecule': 'A molecule temporarily held at a surface site. Adsorption changes molecule-surface interactions and makes a surface pathway possible; its effect on an internal bond depends on the molecule and site.'
    },
    steps: [
      ['One channel wall is marked', 'The amber lining is one inner-wall strip in a representative monolith channel. Follow that mark as the view magnifies: channel wall to porous washcoat to one supported Pt nanoparticle to its top facet.'],
      ['The same wall becomes a washcoat patch', 'The amber outline encloses the porous oxide layer on the marked wall. Its selected Pt nanoparticle is the object that expands in the next view; the ceramic does not transform into platinum.'],
      ['One Pt particle resolves into a terrace', 'The amber halo around one supported Pt particle becomes an idealized Pt(111) top facet. Only after this scale handoff do CO and O2 approach four displayed surface sites.'],
      ['O* adds to CO*; Pt is regenerated', 'Each O* moves toward a neighbouring CO* and a new C-O bond forms. The same two carbon atoms and four oxygen atoms become two CO2 molecules, which desorb. Four displayed Pt sites are vacant again, so the surface can repeat the cycle rather than being consumed.']
    ],
    check: { q: 'Which frame demonstrates that the Pt surface is a catalyst rather than a reactant?', options: ['O2 is visible above the surface', 'CO molecules move closer together', 'Two CO2 molecules leave and the same vacant metal sites reappear'], answer: 2, explanation: 'The final stage conserves C and O atoms and leaves the Pt sites available for another cycle.' }
  },
  {
    id: 'smell', number: '05', title: 'Chemistry of smell', short: 'Molecules become sensation', category: 'Sensory chemistry', color: '#5c7940',
    question: 'How can a three-carbon acid activate a human smell receptor?',
    summary: 'Inspect propionate inside the experimentally determined human olfactory receptor OR51E2.',
    evidence: 'PDB 8F76 · active OR51E2–miniGs complex · cryo-EM · 3.1 Å · display isolates receptor and ligand',
    control: ['Whole receptor', 'Odorant pocket'],
    parts: {
      Odorant: 'Propionate (propanoate/propionic acid depending on protonation), the three-carbon ligand resolved in this receptor pocket.',
      Receptor: 'Human OR51E2, a seven-transmembrane G-protein-coupled odorant receptor shown without its attached signalling proteins.',
      'Binding cavity': 'An occluded pocket whose close packing and polar contacts help OR51E2 recognize short-chain fatty acids.',
      Activation: 'Ligand-dependent structural changes enable the receptor to communicate with an intracellular G protein.'
    },
    steps: [
      ['A real odorant complex', 'This 3.1 Å cryo-EM structure contains human OR51E2 bound to propionate, a short-chain fatty acid with a pungent odour.'],
      ['An occluded pocket', 'Propionate is packed inside the receptor rather than resting on its outer surface. Three selected heavy-atom separations are HIS180 ND1-O1: 2.40 Å, GLN181 NE2-O2: 2.65 Å, and ARG262 NH1-O2: 2.66 Å. They identify nearby atoms, while interaction assignment still requires chemical geometry.'],
      ['An active-state structure', 'The experiment captured OR51E2 with miniGs on its intracellular side. This display isolates receptor and ligand, so it identifies a compatible active-state pocket but does not by itself show the conformational change.'],
      ['One component of a code', 'The separate response inset makes the scale change explicit: perceived smell reflects patterns across receptor types. Its bars are illustrative and are not measurements from 8F76.']
    ],
    check: { q: 'What can the 8F76 structure establish directly?', options: ['The complete perceived smell of propionate', 'Which OR51E2 residues lie close to bound propionate', 'How every human olfactory receptor responds'], answer: 1, explanation: 'The experimental coordinates support a residue-contact map, while perception and receptor-array responses require additional evidence.' }
  },
  {
    id: 'mechanism', number: '06', title: 'Reaction mechanism', short: 'Bonds in transition', category: 'Organic chemistry', color: '#b55430',
    question: 'What happens between reactants and products?',
    summary: 'Scrub through an SN2 substitution and connect electron movement, geometry and activation energy.',
    evidence: 'Idealized SN2 reaction coordinate · geometry and energy not from a quantum calculation',
    control: ['Reactants', 'Products'],
    parts: {
      Nucleophile: 'An electron-pair donor attracted to an electron-poor site.',
      Electrophile: 'The carbon atom accepting an electron pair as the new bond forms.',
      'Leaving group': 'The atom or group departing with the shared electron pair from the breaking bond.',
      'Transition state': 'A fleeting maximum-energy arrangement with partial bonds to both incoming and leaving groups.'
    },
    steps: [
      ['Backside approach', 'The nucleophile approaches opposite the leaving group, aligning its electron pair with the C–X antibonding orbital.'],
      ['One concerted event', 'Bond formation and bond breaking occur together. There is no stable intermediate in an elementary SN2 step.'],
      ['The energy barrier', 'The transition state is less stable than reactants or products, producing the activation-energy maximum.'],
      ['Configuration inverts', 'The three substituents turn through the carbon centre like an umbrella, giving inversion of stereochemistry.']
    ],
    check: { q: 'At the energy maximum, what must the bond display show?', options: ['Only a complete C-O bond', 'A stable carbocation between two separate steps', 'Partial C-O formation and partial C-Cl cleavage at the same time'], answer: 2, explanation: 'The synchronized midpoint shows the concerted transition state rather than a stable intermediate.' }
  },
  {
    id: 'orbitals', number: '07', title: 'Orbitals & hybridization', short: 'The shapes of bonding', category: 'Quantum chemistry', color: '#7a58a0',
    question: 'How can the same four basis functions be redrawn as four directional hybrids?',
    summary: 'Inspect 2s and 2p nodes, then compare them with the phase and directions of four sp3 combinations.',
    evidence: 'Phase-coloured qualitative isosurfaces · smooth teaching geometry, not a quantum-chemistry calculation',
    control: ['2s orbital', '2p orbital', '4 sp³ hybrids'],
    parts: {
      's orbital': 'A spherical wavefunction whose sign can change across a radial node. The probability density is proportional to the square of its magnitude and has no sign.',
      'p orbital': 'Two lobes of opposite wavefunction phase separated by a nodal plane.',
      'Hybrid orbital': 'A directional combination of atomic-orbital wavefunctions used as a bonding model.',
      Node: 'A region where the wavefunction is zero; wavefunction phase changes across a node.'
    },
    steps: [
      ['Orbitals are wavefunctions', 'The smooth surfaces mark a chosen |ψ| isovalue; ψ sign is phase, while |ψ|² gives probability density. They are not solid electron shells.'],
      ['Mixing preserves number', 'One s and three p orbitals can be recombined mathematically into four equivalent sp3 hybrids.'],
      ['Recombination changes direction', 'The four sp3 combinations point toward tetrahedral directions. This is a change of mathematical basis, not a time animation of orbitals physically transforming.'],
      ['A model with limits', 'Hybridization is a useful localized description, while molecular-orbital theory treats electrons across the whole molecule.']
    ],
    check: { q: 'What is conserved when the 2s/2p basis is redrawn as sp3 hybrids?', options: ['The number of orbitals', 'The direction of every original p lobe', 'The absence of wavefunction nodes'], answer: 0, explanation: 'One 2s plus three 2p functions are recombined into four sp3 functions; no orbital is created or destroyed.' }
  },
  {
    id: 'geometry', number: '08', title: 'Molecular geometry', short: 'Electron domains arrange', category: 'Chemical bonding', color: '#28736d',
    question: 'Why are methane and water shaped differently?',
    summary: 'Compare bonding and lone-pair domains across CH4, NH3 and H2O to see VSEPR shape and polarity change.',
    evidence: 'VSEPR teaching model · water angle shown at 104.5°',
    control: ['Methane · CH₄', 'Ammonia · NH₃', 'Water · H₂O'],
    parts: {
      'Central atom': 'The atom around which electron domains are counted for a local VSEPR prediction.',
      'Bonding pair': 'Electron density shared between two nuclei; multiple bonds count as one VSEPR domain.',
      'Lone pair': 'A non-bonding electron pair that occupies space and usually repels bonding domains more strongly.',
      'Bond angle': 'The angle between two bonds at the central atom, influenced by domain geometry and lone-pair repulsion.'
    },
    steps: [
      ['Count electron domains', 'Regions of electron density around a central atom adopt arrangements that reduce repulsion.'],
      ['Distinguish two geometries', 'Electron-domain geometry includes lone pairs; molecular geometry names only the positions of atoms.'],
      ['Lone pairs compress angles', 'A lone pair is attracted by only one nucleus and spreads more broadly, pushing bonding pairs closer together.'],
      ['Shape influences polarity', 'Bond dipoles may reinforce or cancel depending on three-dimensional molecular symmetry.']
    ],
    check: { q: 'Which comparison explains why water has a net dipole but methane does not?', options: ['Water contains fewer total electrons', 'Methane has four bonds while water has two bonds and two lone-pair domains', 'Only water has covalent bonds'], answer: 1, explanation: 'Tetrahedral methane is symmetric, while the two visible O-H bond dipoles do not cancel in bent water.' }
  },
  {
    id: 'lattice', number: '09', title: 'Crystal lattices', short: 'Order repeated in space', category: 'Solid-state chemistry', color: '#486d9b',
    question: 'How can one repeating unit determine a material’s properties?',
    summary: 'Build a three-dimensional ionic lattice and expose coordination, cleavage and repeating unit cells.',
    evidence: 'Ideal rock-salt lattice · thermal motion and defects omitted',
    control: ['Conventional cell', 'Coordination shell', '(001) cleavage'],
    parts: {
      Cation: 'A positively charged ion. In an ionic solid it is surrounded by oppositely charged neighbours.',
      'Central cation': 'The selected Na+ at the centre of the coordination shell. Six Cl- neighbours lie along the three axes.',
      Anion: 'A negatively charged ion whose size often dominates how the lattice packs.',
      'Unit cell': 'A repeating volume that reproduces the crystal by translation. The model shows a conventional rock-salt cell, not the primitive cell.',
      'Coordination shell': 'The nearest neighbouring particles around a chosen lattice site.',
      'Cleavage plane': 'The displayed (001) plane is one member of the {100} family. Its halves open normal to [001], exposing neutral ideal surfaces. This is cleavage, not lateral shear.'
    },
    steps: [
      ['A pattern without molecules', 'An ionic crystal is best described as an extended charge-balanced lattice, not separate NaCl molecules.'],
      ['Local coordination repeats', 'In the rock-salt structure each ion has six nearest neighbours of opposite charge.'],
      ['Electrostatics stabilizes the solid', 'Attractions extend throughout the lattice while short-range repulsion prevents collapse.'],
      ['A neutral plane can cleave', 'The displayed (001) plane belongs to the {100} family. Its halves separate normal to [001], exposing neutral ideal surfaces. This opening is cleavage, not a lateral shear that aligns like charges.']
    ],
    check: { q: 'After selecting the central ion, what does its highlighted shell show?', options: ['Four like-charged neighbours', 'Eight nearest neighbours of mixed charge', 'Six nearest neighbours of opposite charge'], answer: 2, explanation: 'Rock salt has octahedral coordination: six opposite-charge nearest neighbours along three axes.' }
  },
  {
    id: 'electrochem', number: '10', title: 'Electrochemical cell', short: 'Chemical change, electric work', category: 'Electrochemistry', color: '#9b6428',
    question: 'How does a spontaneous redox reaction push electrons through a wire?',
    summary: 'Close a Daniell-cell circuit and follow one zinc atom, one copper ion, two electrons, and the counterions that preserve charge balance.',
    evidence: 'Zn(s) | Zn2+(aq) || KNO3(aq) || Cu2+(aq) | Cu(s) teaching model · E°cell = +1.10 V under standard conditions · particle sizes, counts, and migration paths are schematic',
    control: ['Circuit open', 'One balanced transfer'],
    parts: {
      Anode: 'The negative zinc electrode where oxidation occurs. One Zn atom becomes Zn2+(aq), so the zinc electrode loses mass and releases two electrons.',
      Cathode: 'The positive copper electrode where reduction occurs. One Cu2+(aq) ion accepts two electrons and joins the copper metal, so this electrode gains mass.',
      'External circuit': 'The metallic path between the electrodes. Electrons travel from zinc to copper only when the switch is closed; ions do not travel through this wire.',
      'Salt bridge': 'KNO3 provides an ionic connection that limits charge buildup without directly mixing the half-cell solutions or carrying electrons.',
      Electron: 'Two electrons leave the zinc anode through the external circuit and are accepted at the copper cathode.',
      'Zinc ion': 'Zn2+(aq) produced when a zinc atom is oxidized at the anode.',
      'Copper ion': 'Cu2+(aq) that accepts two electrons and becomes Cu(s) at the cathode.',
      'Nitrate ion': 'Two NO3- counterions move into the zinc half-cell as Zn2+ accumulates, offsetting its positive-charge tendency.',
      'Potassium ion': 'Two K+ counterions move into the copper half-cell as Cu2+ is consumed, offsetting its negative-charge tendency.'
    },
    steps: [
      ['Potential is not current', 'With the switch open, the separated Zn/Cu half-cells have a standard potential difference, but no sustained electron path and no net cell event.'],
      ['Oxidation at the negative anode', 'Close the switch: Zn(s) -> Zn2+(aq) + 2e-. One zinc atom enters solution, the zinc electrode loses mass, and the anode solution tends toward excess positive charge.'],
      ['Reduction at the positive cathode', 'The same two electrons reach the copper electrode. Cu2+(aq) + 2e- -> Cu(s), so copper deposits and the cathode solution tends toward excess negative charge as Cu2+ is removed.'],
      ['Counterions preserve neutrality', 'Two NO3- ions move into the zinc half-cell and two K+ ions move into the copper half-cell. The salt bridge carries ions, never electrons; without that compensation, current quickly stops.']
    ],
    check: { q: 'Which changes complete one balanced Daniell-cell event?', options: ['Zn enters solution, two electrons cross the wire, Cu2+ deposits, and counterions offset both half-cell charges', 'Both electrodes lose one atom and one electron', 'Cu dissolves while Zn2+ plates onto zinc'], answer: 0, explanation: 'One Zn oxidation is paired with one Cu2+ reduction, two electrons in the metal circuit, two nitrate ions to the anode, and two potassium ions to the cathode.' }
  },
  {
    id: 'synthesis', number: '11', title: 'From flask to reaction screen', short: 'One question, many conditions', category: 'Laboratory chemistry', color: '#4c7a72',
    question: 'What does automation change when chemists optimise one reaction?',
    summary: 'Compare a serial manual experiment with a parallel microscale condition screen for the same generic amide-forming reaction.',
    evidence: 'Illustrative reaction-optimisation workflow · generic ArCO2H + RNH2 + coupling reagent -> ArCONHR condition screen · response colours represent LC/MS-style analytical response, not isolated yield, kinetics, or a predictive model',
    control: ['One planned flask', 'Analysed 24-well screen'],
    parts: {
      'Manual flask': 'One serial microscale reaction run. Manual work can be precise and informative, especially when a chemist chooses conditions from observations and prior data.',
      Pipette: 'A transfer tool used to add measured stock solutions. It does not determine whether a reaction will work; experimental design and analysis do.',
      'Reaction plate': 'Twenty-four independent microscale reactions. Each well contains its own condition and must not be read as a shared reaction mixture.',
      'Liquid handler': 'Automation can dispense consistent volumes and start a parallel batch. It improves throughput and traceability, not the intrinsic reaction rate inside a well.',
      Condition: 'One defined combination of variables such as solvent, base, temperature, catalyst, or reagent ratio. A condition is not a replicate.',
      Replicate: 'A repeated measurement of the same condition used to assess consistency. It is not a second chemical variable.',
      'Control well': 'A deliberate comparison, such as a blank or no-coupling-reagent well, that helps distinguish a real signal from background.',
      Analysis: 'A measured response is required before choosing the next experiment. The coloured plate is an illustrative LC/MS-style response map, not proof of isolated yield or scale-up success.',
      'Candidate condition': 'A promising microscale result that still needs confirmation, analysis, and scale-up before it can become a reliable procedure.'
    },
    steps: [
      ['One chemical question', 'Both paths begin with the same generic amide-forming question. The comparison is about how conditions are explored, not about different molecules or a robot changing the reaction mechanism.'],
      ['Manual work is serial and deliberate', 'A chemist dispenses one planned condition into one flask, then reacts, works up, analyses, and decides what to test next. The value is controlled observation, not speed alone.'],
      ['Automation runs independent wells in parallel', 'A liquid handler can start a 4 x 6 microscale condition screen from the same stock solutions. Columns vary solvent, rows vary base, D4 repeats the D3 condition, and F4 is a blank control. Parallel work reduces wall-clock time for a batch, not the reaction time inside each well.'],
      ['Analyse, choose, verify', 'An illustrative response map highlights a candidate condition only after analysis. A microscale hit needs identity checks, repeat data, and flask-scale confirmation; automation supports judgement rather than replacing it.']
    ],
    check: { q: 'What can a parallel condition screen establish directly?', options: ['That the highlighted well will give the same isolated yield at scale', 'Which tested microscale condition has the strongest illustrative analytical response and should be verified next', 'That a robot changes the reaction mechanism inside each well'], answer: 1, explanation: 'Parallel automation can efficiently compare defined small-scale conditions, but analytical confirmation, replication, and scale-up are still required.' }
  }
];

import { useEffect, useRef, useState } from 'react';
import * as $3Dmol from '3dmol';

const structures = {
  binding: {
    path: 'data/5mzp.pdb',
    ligand: 'CFF',
    receptor: { chain: 'A', resi: '0-317', hetflag: false },
    selectedLigand: 'Ligand',
    selectedPocket: 'Binding pocket',
    surface: '#5e8576',
    pocketSurface: '#7ba793',
    pocketResidues: [84, 168, 177, 249, 253, 274],
    contacts: [
      { resn: 'ASN', resi: 253, atom: 'ND2', ligandAtom: 'O11', type: 'polar contact', category: 'polar', color: '#d7ae48' },
      { resn: 'PHE', resi: 168, atom: 'CD1', ligandAtom: 'N3', type: 'aromatic close packing', category: 'packing', color: '#a8735d' },
      { resn: 'ILE', resi: 274, atom: 'CD1', ligandAtom: 'C8', type: 'non-polar packing', category: 'packing', color: '#66958c' },
    ],
  },
  smell: {
    path: 'data/8f76.pdb',
    ligand: 'PPI',
    receptor: { chain: 'A', hetflag: false },
    selectedLigand: 'Odorant',
    selectedPocket: 'Binding cavity',
    surface: '#697f58',
    pocketSurface: '#91a86e',
    pocketResidues: [155, 158, 180, 181, 202, 262],
    contacts: [
      { resn: 'HIS', resi: 180, atom: 'ND1', ligandAtom: 'O1', type: 'short polar contact', category: 'polar', color: '#d7ae48' },
      { resn: 'GLN', resi: 181, atom: 'NE2', ligandAtom: 'O2', type: 'short polar contact', category: 'polar', color: '#78a99a' },
      { resn: 'ARG', resi: 262, atom: 'NH1', ligandAtom: 'O2', type: 'basic/polar contact', category: 'polar', color: '#bf7276' },
    ],
  },
};

const point = (atom) => ({ x: atom.x, y: atom.y, z: atom.z });

const atomDistance = (first, second) => Math.hypot(
  first.x - second.x,
  first.y - second.y,
  first.z - second.z,
);

const pocketShellSelection = (structure, distance = 3.8) => ({
  within: { distance, sel: { resn: structure.ligand } },
  hetflag: false,
});

const pocketSelection = (structure, distance = 3.8) => ({
  ...pocketShellSelection(structure, distance),
  byres: true,
});

const focusedPocketSelection = (structure) => ({
  or: [
    { resn: structure.ligand },
    pocketShellSelection(structure, 4.4),
  ],
});

const viewForStep = (stepIndex, progress) => {
  if (stepIndex <= 0) return progress > .5 ? 'pocket' : 'overview';
  if (stepIndex === 1) return 'pocket';
  if (stepIndex === 2) return 'contacts';
  return 'context';
};

const hasPocketSelection = (structure, selectedPart) => (
  selectedPart === structure.selectedPocket
  || selectedPart === 'Hydrogen bond'
  || selectedPart === 'Hydrophobic region'
);

function materializeContacts(model, structure) {
  const atoms = model.selectedAtoms({});

  return structure.contacts.flatMap((manifest) => {
    const residueAtom = atoms.find((atom) => (
      atom.chain === 'A'
      && String(atom.resi) === String(manifest.resi)
      && atom.resn === manifest.resn
      && atom.atom === manifest.atom
    ));
    const ligandAtom = atoms.find((atom) => (
      atom.resn === structure.ligand && atom.atom === manifest.ligandAtom
    ));

    if (!residueAtom || !ligandAtom) return [];

    return [{
      ...manifest,
      distance: atomDistance(residueAtom, ligandAtom).toFixed(2),
      start: point(residueAtom),
      end: point(ligandAtom),
    }];
  });
}

function applyVisualState({ viewer, structure, contacts, selectedPart, viewState }) {
  const ligandSelected = selectedPart === structure.selectedLigand;
  const receptorSelected = selectedPart === 'Receptor';
  const polarSelected = selectedPart === 'Hydrogen bond';
  const packingSelected = selectedPart === 'Hydrophobic region';
  const pocketSelected = hasPocketSelection(structure, selectedPart);
  const showPocket = viewState !== 'overview' || pocketSelected;
  const showNetwork = viewState === 'pocket' || viewState === 'contacts' || pocketSelected;
  const highlightedContacts = polarSelected
    ? contacts.filter((contact) => contact.category === 'polar')
    : packingSelected
      ? contacts.filter((contact) => contact.category === 'packing')
      : contacts;

  let receptorOpacity = .22;
  if (viewState === 'overview') receptorOpacity = ligandSelected ? .5 : .9;
  if (viewState === 'pocket') receptorOpacity = .18;
  if (viewState === 'contacts') receptorOpacity = .14;
  if (receptorSelected && (viewState === 'overview' || viewState === 'context')) receptorOpacity = .96;

  const ligandRadius = ligandSelected ? .36 : viewState === 'contacts' || viewState === 'pocket' ? .31 : .28;
  const ligandScale = ligandSelected ? .5 : viewState === 'contacts' || viewState === 'pocket' ? .44 : .38;
  const nearbyOpacity = viewState === 'contacts' ? .72 : .92;

  viewer.removeAllLabels();
  viewer.removeAllShapes();
  viewer.setStyle({}, {});
  viewer.setStyle(structure.receptor, {
    cartoon: { color: structure.surface, thickness: .38, arrows: true, opacity: receptorOpacity },
  });
  viewer.addStyle({ resn: structure.ligand }, {
    stick: { colorscheme: 'Jmol', radius: ligandRadius, opacity: 1, doubleBondScaling: .32 },
    sphere: { colorscheme: 'Jmol', scale: ligandScale, opacity: 1 },
  });

  if (showPocket) {
    viewer.addStyle(pocketSelection(structure), {
      stick: { colorscheme: 'amino', radius: viewState === 'contacts' ? .14 : .17, opacity: nearbyOpacity },
    });
  }

  if (showPocket || showNetwork) {
    contacts.forEach((contact) => {
      const isHighlighted = highlightedContacts.includes(contact);
      viewer.addStyle({ chain: 'A', resi: contact.resi, atom: contact.atom }, {
        stick: { color: isHighlighted ? contact.color : '#8e9890', radius: isHighlighted ? .26 : .18, opacity: isHighlighted ? 1 : .5 },
        sphere: { color: isHighlighted ? contact.color : '#8e9890', scale: isHighlighted ? .28 : .18, opacity: isHighlighted ? 1 : .42 },
      });
    });
  }

  if (showNetwork) {
    highlightedContacts.forEach((contact) => {
      viewer.addCylinder({
        start: contact.start,
        end: contact.end,
        color: contact.color,
        opacity: viewState === 'contacts' ? 1 : .84,
        dashed: true,
        dashLength: .18,
        gapLength: .1,
        radius: viewState === 'contacts' ? .045 : .035,
        fromCap: true,
        toCap: true,
      });
      viewer.addSphere({ center: contact.start, radius: .16, color: contact.color, opacity: .92 });
      viewer.addSphere({ center: contact.end, radius: .15, color: contact.color, opacity: .96 });
    });
  }

  viewer.render();
}

function frame(viewer, structure, viewState, mount, frameRef) {
  const mobile = mount?.clientWidth < 600;
  const from = viewer.getView();

  if (viewState === 'overview') {
    viewer.zoomTo(structure.receptor);
    viewer.zoom(structure.ligand === 'PPI' ? (mobile ? .62 : .72) : (mobile ? .66 : .78));
  } else {
    // Keep the ligand and named pocket residues in one frame. Calling the
    // camera methods synchronously yields a target view for our interruptible
    // requestAnimationFrame tween below.
    viewer.zoomTo(focusedPocketSelection(structure));
    const caffeine = structure.ligand === 'CFF';
    if (viewState === 'contacts') viewer.zoom(caffeine ? (mobile ? .36 : .52) : (mobile ? .29 : .45));
    else if (viewState === 'context') viewer.zoom(caffeine ? (mobile ? .34 : .5) : (mobile ? .27 : .42));
    else viewer.zoom(caffeine ? (mobile ? .36 : .53) : (mobile ? .29 : .45));
    if (mobile) viewer.translate(0, caffeine ? 40 : 70);
  }
  const target = viewer.getView();
  viewer.setView(from, true);
  if (frameRef.current) cancelAnimationFrame(frameRef.current);
  const startedAt = performance.now();
  const animate = (now) => {
    const amount = Math.min(1, (now - startedAt) / 720);
    const eased = amount * amount * (3 - 2 * amount);
    const view = from.map((value, index) => value + (target[index] - value) * eased);
    const quaternionLength = Math.hypot(view[4], view[5], view[6], view[7]) || 1;
    view[4] /= quaternionLength; view[5] /= quaternionLength; view[6] /= quaternionLength; view[7] /= quaternionLength;
    viewer.setView(view, true);
    if (amount < 1) frameRef.current = requestAnimationFrame(animate);
    else frameRef.current = undefined;
  };
  frameRef.current = requestAnimationFrame(animate);
}

export default function MoleculeScene({ kind = 'binding', progress, stepIndex = 0, resetToken = 0, selectedPart, onSelect }) {
  const mountRef = useRef(null);
  const viewerRef = useRef(null);
  const loadedRef = useRef(false);
  const contactAtomsRef = useRef([]);
  const renderSceneRef = useRef(null);
  const frameSceneRef = useRef(null);
  const cameraFrameRef = useRef();
  const viewTransitionFrameRef = useRef();
  const [viewTransitioning, setViewTransitioning] = useState(false);
  const [loadState, setLoadState] = useState('loading');
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const structure = structures[kind];
  const viewState = viewForStep(stepIndex, progress);

  renderSceneRef.current = () => {
    const viewer = viewerRef.current;
    if (!viewer || !loadedRef.current) return;
    applyVisualState({
      viewer,
      structure,
      contacts: contactAtomsRef.current,
      selectedPart,
      viewState,
    });
  };

  frameSceneRef.current = () => {
    const viewer = viewerRef.current;
    if (!viewer || !loadedRef.current) return;
    frame(viewer, structure, viewState, mountRef.current, cameraFrameRef);
  };

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const viewer = $3Dmol.createViewer(mountRef.current, {
      backgroundColor: '#eef1e9',
      antialias: true,
      cartoonQuality: 10,
    });
    viewerRef.current = viewer;
    loadedRef.current = false;
    contactAtomsRef.current = [];
    setLoadState('loading');

    fetch(import.meta.env.BASE_URL + structure.path, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Structure request failed: ${response.status}`);
        return response.text();
      })
      .then((pdb) => {
        if (cancelled) return;
        const model = viewer.addModel(pdb, 'pdb', { keepH: false, altLoc: 'A' });
        contactAtomsRef.current = materializeContacts(model, structure);
        loadedRef.current = true;
        setLoadState('ready');
        window.__chemAtlasMolecule = {
          atoms: model.selectedAtoms({}).length,
          ligandAtoms: model.selectedAtoms({ resn: structure.ligand }).length,
          curatedContacts: contactAtomsRef.current.map((contact) => ({
            residue: `${contact.resn}${contact.resi}:${contact.atom}`,
            ligand: `${structure.ligand}:${contact.ligandAtom}`,
            distance: contact.distance,
            type: contact.type,
          })),
        };

        viewer.setClickable(structure.receptor, true, () => onSelectRef.current('Receptor'));
        viewer.setClickable(pocketSelection(structure), true, () => onSelectRef.current(structure.selectedPocket));
        viewer.setClickable({ resn: structure.ligand }, true, () => onSelectRef.current(structure.selectedLigand));
        if (kind === 'smell') viewer.rotate(90, 'x', 0);

        renderSceneRef.current?.();
        frameSceneRef.current?.();

        const surface = viewer.addSurface(
          $3Dmol.SurfaceType.VDW,
          { color: structure.pocketSurface, opacity: .13 },
          pocketSelection(structure),
        );
        surface?.then?.(() => {
          if (!cancelled) viewer.render();
        });
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setLoadState('error');
      });

    const resize = () => viewer.resize();
    window.addEventListener('resize', resize);
    return () => {
      cancelled = true;
      controller.abort();
      window.removeEventListener('resize', resize);
      if (cameraFrameRef.current) cancelAnimationFrame(cameraFrameRef.current);
      if (viewTransitionFrameRef.current) cancelAnimationFrame(viewTransitionFrameRef.current);
      viewer.removeAllSurfaces();
      viewer.clear();
      loadedRef.current = false;
      contactAtomsRef.current = [];
      viewerRef.current = null;
      mountRef.current?.replaceChildren();
    };
  }, [kind]);

  useEffect(() => {
    renderSceneRef.current?.();
  }, [selectedPart]);

  useEffect(() => {
    setViewTransitioning(true);
    const timer = window.setTimeout(() => {
      renderSceneRef.current?.();
      frameSceneRef.current?.();
      viewTransitionFrameRef.current = requestAnimationFrame(() => {
        viewTransitionFrameRef.current = undefined;
        setViewTransitioning(false);
      });
    }, 140);
    return () => {
      window.clearTimeout(timer);
      if (viewTransitionFrameRef.current) cancelAnimationFrame(viewTransitionFrameRef.current);
    };
  }, [viewState]);

  useEffect(() => {
    frameSceneRef.current?.();
  }, [resetToken]);

  return (
    <div className={`scene molecular-scene ${viewTransitioning ? 'is-view-transitioning' : ''}`} aria-label={kind === 'binding' ? 'Experimental structure of caffeine bound to the A2A adenosine receptor' : 'Experimental structure of propionate bound to human olfactory receptor OR51E2'}>
      <div className="molecular-canvas" ref={mountRef} />
      {loadState === 'loading' && <div className="molecule-status">Loading experimental structure...</div>}
      {loadState === 'error' && <div className="molecule-status is-error">The experimental structure could not be rendered. Reload this exhibit to try again.</div>}
    </div>
  );
}

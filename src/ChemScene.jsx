import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const C = {
  carbon: 0x263238, oxygen: 0xd94a43, hydrogen: 0xe7e4dc, nitrogen: 0x4267a8,
  lithium: 0xe9aa3a, copper: 0xb86436, zinc: 0x8996a0, chlorine: 0x67a85f, bromine: 0x7a3e2b, boron: 0xd48152,
  gold: 0xb98b38, protein: 0xbe6e7f, ice: 0x8ac5d2, violet: 0x7957a5,
};

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.48, metalness: 0.05, ...options });
}

function tag(object, part) {
  object.userData.part = part;
  object.traverse?.((child) => { child.userData.part = part; });
  return object;
}

function atom(group, position, radius, color, part, options = {}) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 28, 20), material(color, options));
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (part) tag(mesh, part);
  group.add(mesh);
  return mesh;
}

function bond(group, a, b, radius = 0.055, color = 0x64706d, part) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, start.distanceTo(end), 14), material(color));
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
  if (part) tag(mesh, part);
  group.add(mesh);
  return mesh;
}

function ring(group, center, radius, count, color, part, z = 0) {
  const points = [];
  for (let i = 0; i < count; i += 1) {
    const angle = i * Math.PI * 2 / count;
    points.push([center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius, center[2] + z]);
  }
  points.forEach((p, i) => {
    atom(group, p, 0.17, color, part);
    bond(group, p, points[(i + 1) % points.length], 0.045, 0x56615f, part);
  });
  return points;
}

function seeded(index, salt = 0) {
  const value = Math.sin((index + 1) * 12.9898 + (salt + 1) * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function battery(progress) {
  const g = new THREE.Group();
  const lithiumIons = [];
  const ionMatrix = new THREE.Object3D();
  const start = .38;
  const sweep = Math.PI * 1.55;
  const height = 4.25;
  const layerTypes = [
    { color: 0xb76836, part: 'Anode', metalness: .55 },
    { color: 0x343b38, part: 'Anode', metalness: .08 },
    { color: 0xe8dfbd, part: 'Separator', metalness: 0 },
    { color: 0x5c766d, part: 'Cathode', metalness: .05 },
    { color: 0xb7bcc0, part: 'Cathode', metalness: .72 },
    { color: 0xe8dfbd, part: 'Separator', metalness: 0 },
  ];

  const spiralRibbonGeometry = (layerOffset, width) => {
    const turns = 6;
    const segments = 480;
    const thetaStart = .25;
    const thetaLength = turns * Math.PI * 2;
    const stackPitch = .245 / (Math.PI * 2);
    const positions = new Float32Array((segments + 1) * 4 * 3);
    const indices = [];
    for (let index = 0; index <= segments; index += 1) {
      const theta = thetaStart + thetaLength * index / segments;
      const centerRadius = .28 + stackPitch * (theta - thetaStart) + layerOffset;
      const innerRadius = centerRadius - width / 2;
      const outerRadius = centerRadius + width / 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const values = [
        innerRadius * cos, -height / 2, innerRadius * sin,
        outerRadius * cos, -height / 2, outerRadius * sin,
        innerRadius * cos, height / 2, innerRadius * sin,
        outerRadius * cos, height / 2, outerRadius * sin,
      ];
      positions.set(values, index * 12);
      if (index === segments) continue;
      const phase = ((theta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      if (phase > 5.1 || phase < 1.2) continue;
      const a = index * 4;
      const b = a + 4;
      indices.push(
        a, b, a + 2, b, b + 2, a + 2,
        a + 1, a + 3, b + 1, b + 1, a + 3, b + 3,
        a + 2, b + 2, a + 3, b + 2, b + 3, a + 3,
        a, a + 1, b, b, a + 1, b + 1,
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  };
  layerTypes.forEach((type, index) => {
    const layerOffset = (index - (layerTypes.length - 1) / 2) * .04;
    const mesh = new THREE.Mesh(
      spiralRibbonGeometry(layerOffset, .034),
      material(type.color, {
        side: THREE.DoubleSide,
        roughness: type.metalness > .5 ? .28 : .64,
        metalness: type.metalness,
        transparent: type.part === 'Separator',
        opacity: type.part === 'Separator' ? .68 : 1,
        depthWrite: type.part !== 'Separator',
      }),
    );
    tag(mesh, type.part); g.add(mesh);
  });

  const can = new THREE.Mesh(
    new THREE.CylinderGeometry(2.08, 2.08, 4.72, 128, 1, true, start + .08, Math.PI * 1.38),
    material(0xb5bfbb, { side: THREE.DoubleSide, roughness: .32, metalness: .62, transparent: true, opacity: .24, depthWrite: false }),
  );
  tag(can, 'Casing'); g.add(can);
  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(2.08, 2.08, .1, 128, 1, false, start + .08, Math.PI * 1.38), material(0x9ea8a5, { metalness: .7, roughness: .3, transparent:true, opacity:.55 }));
  bottom.position.y = -2.36; tag(bottom, 'Casing'); g.add(bottom);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.94, 1.94, .14, 128, 1, false, start + .08, Math.PI * 1.38), material(0xaeb6b3, { metalness: .8, roughness: .22, transparent:true, opacity:.72 }));
  cap.position.y = 2.38; tag(cap, 'Casing'); g.add(cap);
  const terminal = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .24, 64), material(0xc4cac7, { metalness: .9, roughness: .18 }));
  terminal.position.y = 2.56; tag(terminal, 'Casing'); g.add(terminal);
  const seal = new THREE.Mesh(new THREE.TorusGeometry(.72, .08, 16, 72), material(0x202623, { roughness: .82 }));
  seal.rotation.x = Math.PI / 2; seal.position.y = 2.45; tag(seal, 'Separator'); g.add(seal);

  const tabA = new THREE.Mesh(new THREE.BoxGeometry(.14, 3.7, .48), material(0xb76435, { metalness: .7, roughness: .3 }));
  tabA.position.set(1.05, .12, .55); tabA.rotation.y = -.35; tag(tabA, 'Negative electrode'); g.add(tabA);
  const tabC = new THREE.Mesh(new THREE.BoxGeometry(.14, 3.8, .48), material(0xb9c0bf, { metalness: .8, roughness: .24 }));
  tabC.position.set(.65, .18, 1.24); tabC.rotation.y = -.72; tag(tabC, 'Positive electrode'); g.add(tabC);

  const ionInstances = new THREE.InstancedMesh(
    new THREE.SphereGeometry(.075, 16, 12),
    material(C.lithium, { emissive: C.lithium, emissiveIntensity: .34, metalness: .08 }),
    42,
  );
  tag(ionInstances, 'Electrolyte');
  g.add(ionInstances);
  for (let i = 0; i < 42; i += 1) {
    const row = Math.floor(i / 7);
    const column = i % 7;
    const baseRadius = .78 + row * .19;
    const angle = -.18 + column * .055;
    lithiumIons.push({index:i,baseRadius,angle,y:-1.65+row*.58,direction:i%2?1:-1});
  }
  g.userData.update=(value)=>{
    lithiumIons.forEach(({index,baseRadius,angle,y,direction})=>{
      const radius=baseRadius+(value-.5)*.11*direction;
      ionMatrix.position.set(Math.cos(angle)*radius,y,Math.sin(angle)*radius);
      ionMatrix.updateMatrix();
      ionInstances.setMatrixAt(index,ionMatrix.matrix);
    });
    ionInstances.instanceMatrix.needsUpdate=true;
  };
  g.userData.update(progress);
  g.scale.setScalar(.66);
  g.rotation.set(-.16, .72, .09);
  return g;
}

function binding(progress) {
  const g = new THREE.Group();
  const pocket = new THREE.Group();
  for (let i = 0; i < 42; i += 1) {
    const a = i * 2.399;
    const y = 1 - (i / 41) * 2;
    const r = Math.sqrt(1 - y * y);
    const p = [Math.cos(a) * r * 1.65, y * 1.65, Math.sin(a) * r * 1.65];
    if (p[2] > .55 && Math.abs(p[0]) < .8) continue;
    atom(pocket, p, .32 + (i % 3) * .03, i % 5 === 0 ? 0xd69b63 : C.protein, 'Binding pocket', { transparent: true, opacity: .88 });
  }
  g.add(pocket);
  const ligand = new THREE.Group();
  const z = 2.9 - progress * 2.2;
  const pts = ring(ligand, [0, 0, z], .64, 6, C.carbon, 'Ligand');
  atom(ligand, [0, .95, z], .2, C.oxygen, 'Ligand');
  bond(ligand, pts[1], [0, .95, z], .055, 0x66706d, 'Ligand');
  g.add(ligand);
  for (let i = 0; i < 3; i += 1) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(.035, .035, .22), material(0xe0b24e, { emissive: 0xe0b24e, emissiveIntensity: .25 }));
    dash.position.set(-.45 + i * .45, .55 - i * .15, .95 + i * .08); dash.rotation.x = .4; tag(dash, 'Hydrogen bond'); g.add(dash);
  }
  g.rotation.y = -.25;
  return g;
}

function snowflake(progress) {
  const g = new THREE.Group();
  const crystal = new THREE.Group();
  const waters = [];
  g.add(crystal);
  const length = 2.5;
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.12,6),material(0xaed7df,{transparent:true,opacity:.58,roughness:.18,metalness:.04}));
  plate.rotation.x=Math.PI/2; tag(plate,'Hexagonal lattice'); crystal.add(plate);
  for (let arm = 0; arm < 6; arm += 1) {
    const a = arm * Math.PI / 3;
    const end = [Math.cos(a) * length, Math.sin(a) * length, 0];
    bond(crystal, [0, 0, 0], end, .072, C.ice, 'Branch');
    for (let j = 1; j <= 6; j += 1) {
      const d = length * j / 7;
      const base = [Math.cos(a) * d, Math.sin(a) * d, 0];
      [-1, 1].forEach((side) => {
        const ba = a + side * Math.PI / 3;
        const branchLength=.4+j*.022;
        const tip = [base[0] + Math.cos(ba) * branchLength, base[1] + Math.sin(ba) * branchLength, (j%2?1:-1)*.018];
        bond(crystal, base, tip, .035, 0x72aebd, 'Facet');
        if(j>2){
          [-1,1].forEach((subSide)=>{
            const subAngle=ba+subSide*Math.PI/3;
            const subBase=[base[0]+Math.cos(ba)*branchLength*.58,base[1]+Math.sin(ba)*branchLength*.58,tip[2]];
            const subTip=[subBase[0]+Math.cos(subAngle)*branchLength*.28,subBase[1]+Math.sin(subAngle)*branchLength*.28,tip[2]];
            bond(crystal,subBase,subTip,.018,0x8fc6d2,'Facet');
          });
        }
      });
      if(j%2===0){
        const facet=new THREE.Mesh(new THREE.CylinderGeometry(.1+j*.007,.1+j*.007,.035,6),material(0xc1e1e5,{transparent:true,opacity:.38,roughness:.16}));
        facet.rotation.x=Math.PI/2; facet.position.set(...base); tag(facet,'Facet'); crystal.add(facet);
      }
    }
  }
  const latticePoints=[];
  for(let ringIndex=1;ringIndex<=2;ringIndex+=1){
    for(let i=0;i<6;i+=1){
      const a=i*Math.PI/3+(ringIndex===2?Math.PI/6:0);
      const p=[Math.cos(a)*ringIndex*.22,Math.sin(a)*ringIndex*.22,(i%2?1:-1)*.07];
      latticePoints.push(p); atom(crystal,p,.065,C.oxygen,'Hydrogen bond',{roughness:.24});
    }
  }
  latticePoints.forEach((p,i)=>{
    const candidates=latticePoints.map((q,j)=>({j,d:new THREE.Vector3(...p).distanceTo(new THREE.Vector3(...q))})).filter((x)=>x.j>i&&x.d<.38).slice(0,2);
    candidates.forEach(({j})=>bond(crystal,p,latticePoints[j],.011,0xd9ac43,'Hydrogen bond'));
  });
  for(let i=0;i<15;i+=1){
    const water = new THREE.Group();
    const a=i*2.399, baseRadius=2.65+(i%3)*.18, z=(i%4)*.16-.24;
    atom(water,[0,0,0],.07,C.oxygen,'Hydrogen bond',{transparent:true,opacity:.76});
    atom(water,[.09,.055,0],.037,C.hydrogen,'Hydrogen bond',{transparent:true,opacity:.75});
    atom(water,[-.03,.1,0],.037,C.hydrogen,'Hydrogen bond',{transparent:true,opacity:.75});
    bond(water,[0,0,0],[.09,.055,0],.014,0x8d9996,'Hydrogen bond'); bond(water,[0,0,0],[-.03,.1,0],.014,0x8d9996,'Hydrogen bond');
    waters.push({water,a,baseRadius,z}); g.add(water);
  }
  g.userData.update=(value)=>{
    crystal.scale.setScalar(.68+.32*value);
    waters.forEach(({water,a,baseRadius,z})=>{
      const radius=baseRadius-value*.22;
      water.position.set(Math.cos(a)*radius,Math.sin(a)*radius,z);
    });
  };
  g.userData.update(progress);
  g.scale.setScalar(.9);
  g.rotation.set(.72, .1, .15);
  return g;
}

function catalyst(progress) {
  const g = new THREE.Group();
  const honey = new THREE.Group();
  for (let x = -3; x <= 3; x += 1) for (let y = -3; y <= 3; y += 1) {
    const geo = new THREE.CylinderGeometry(.3, .3, 2.6, 6, 1, true);
    const m = new THREE.Mesh(geo, material(0xb9a786, { side: THREE.DoubleSide, roughness: .8 }));
    m.rotation.x = Math.PI / 2; m.position.set(x * .51 + (y % 2) * .255, y * .44, 0); tag(m, 'Honeycomb'); honey.add(m);
  }
  honey.scale.setScalar(.68); honey.position.x = -1.42 - progress * .32; g.add(honey);
  const surface = new THREE.Group(); surface.position.x = 1.15;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, .18), material(0x8a806d, { roughness: .9 })); tag(slab, 'Washcoat'); surface.add(slab);
  for(let i=0;i<74;i+=1){
    const a=i*2.399, r=.22+Math.sqrt(i/74)*1.62;
    const x=Math.cos(a)*r, y=Math.sin(a)*r;
    atom(surface,[x,y,.08+(i%4)*.035],.085+(i%3)*.018,i%5===0?0x9e8058:0xa7a08d,'Washcoat',{roughness:.82,transparent:true,opacity:.86});
  }
  for(let z=0;z<3;z+=1) for(let x=-3;x<=3;x+=1) for(let y=-3;y<=3;y+=1){
    if(Math.abs(x)+Math.abs(y)+z>6) continue;
    atom(surface,[x*.2,y*.2,.24+z*.17],.115,z===2?0xc5cdcf:0x919b9e,'Metal site',{metalness:.88,roughness:.16,emissive:progress>.55&&z===2?0x434b4d:0x000000,emissiveIntensity:progress*.18});
  }
  const addMolecule=(atoms,bonds,opacity,part='Adsorbed molecule')=>{
    atoms.forEach(({p,r,c})=>atom(surface,p,r,c,part,{transparent:true,opacity,roughness:.25}));
    bonds.forEach(([a,b])=>{const m=bond(surface,a,b,.045,0x5d6563,part);m.material.transparent=true;m.material.opacity=opacity;});
  };
  const incomingZ=1.65-progress*.9;
  addMolecule([
    {p:[-1.05,.5,incomingZ],r:.15,c:C.carbon},{p:[-.75,.5,incomingZ],r:.17,c:C.oxygen},
  ],[[[-1.05,.5,incomingZ],[-.75,.5,incomingZ]]],1-progress*.55);
  addMolecule([
    {p:[.55,-.55,1.55-progress*.72],r:.17,c:C.oxygen},{p:[.88,-.55,1.55-progress*.72],r:.17,c:C.oxygen},
  ],[[[.55,-.55,1.55-progress*.72],[.88,-.55,1.55-progress*.72]]],1-progress*.72);
  const productZ=.75+progress*1.15;
  addMolecule([
    {p:[.12,.55,productZ],r:.15,c:C.carbon},{p:[-.23,.55,productZ],r:.17,c:C.oxygen},{p:[.47,.55,productZ],r:.17,c:C.oxygen},
  ],[[[-.23,.55,productZ],[.12,.55,productZ]],[[.12,.55,productZ],[.47,.55,productZ]]],Math.max(.08,progress));
  g.add(surface); g.scale.setScalar(.76); g.rotation.set(-.25, -.35, .08); return g;
}

function smell(progress) {
  const g = new THREE.Group();
  const receptor = new THREE.Group();
  for (let h = 0; h < 7; h += 1) {
    const curve = [];
    for (let i = 0; i < 42; i += 1) {
      const t = i / 41; const a = t * Math.PI * 8 + h;
      curve.push(new THREE.Vector3(Math.cos(a) * .13 + (h - 3) * .43, t * 3 - 1.5, Math.sin(a) * .13));
    }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curve), 70, .055, 8, false), material(h % 2 ? 0x557c69 : 0x76926a));
    tag(tube, h === 3 ? 'Binding cavity' : 'Receptor'); receptor.add(tube);
  }
  receptor.rotation.z = Math.PI / 2; receptor.position.y = -.4; g.add(receptor);
  const ligand = new THREE.Group();
  const z = 2.7 - progress * 2.25;
  const pts = ring(ligand, [-.1, .45, z], .48, 6, C.carbon, 'Odorant');
  atom(ligand, [.55, .85, z], .18, C.oxygen, 'Enantiomer'); bond(ligand, pts[1], [.55, .85, z], .045, 0x5c6663, 'Enantiomer');
  g.add(ligand); g.rotation.set(.15, -.15, -.05); return g;
}

function sn2Mechanism(progress) {
  const g = new THREE.Group();
  const carbon = [0, .35, 0];
  atom(g, carbon, .26, C.carbon, 'Electrophile', { roughness: .28 });
  const hydrogenAtoms = [];
  const hydrogenBonds = [];
  const createDynamicBond = (radius, color, part) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 14), material(color));
    if (part) tag(mesh, part);
    g.add(mesh);
    return mesh;
  };
  const setDynamicBond = (mesh, a, b) => {
    const startPoint = new THREE.Vector3(...a);
    const endPoint = new THREE.Vector3(...b);
    const direction = endPoint.clone().sub(startPoint);
    mesh.position.copy(startPoint).add(endPoint).multiplyScalar(.5);
    mesh.scale.set(1, direction.length(), 1);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  };
  const substituents = [{ label: 'H', color: C.hydrogen, radius: .18 }, { label: 'D', color: 0x9fc9d2, radius: .18 }, { label: 'CH3', color: 0x4b5552, radius: .24 }];
  for (let i = 0; i < 3; i += 1) {
    const mesh = atom(g, [0,0,0], substituents[i].radius, substituents[i].color, undefined, { roughness: .34 });
    const substituentLabel = labelSprite(substituents[i].label, '#f4f0e5', .14); substituentLabel.position.set(0, .32, 0); mesh.add(substituentLabel);
    hydrogenAtoms.push(mesh);
    hydrogenBonds.push(createDynamicBond(.06, 0x68716e));
  }
  const oxygenMesh = atom(g, [0,0,0], .3, C.oxygen, 'Nucleophile', { roughness: .28 });
  const oxygenHydrogenMesh = atom(g, [0,0,0], .17, C.hydrogen, 'Nucleophile');
  const oxygenHydrogenBond = createDynamicBond(.055, 0x69716e, 'Nucleophile');
  const chlorineMesh = atom(g, [0,0,0], .36, C.chlorine, 'Leaving group', { roughness: .3 });
  const incomingBond = createDynamicBond(.055, 0x69736f, 'Transition state');
  const outgoingBond = createDynamicBond(.055, 0x69736f, 'Transition state');
  incomingBond.material.transparent = true;
  outgoingBond.material.transparent = true;
  const incomingDashes = [];
  const outgoingDashes = [];
  for (let index = 0; index < 5; index += 1) {
    incomingDashes.push(atom(g,[0,0,0],.047,0xd4ae45,'Transition state',{emissive:0x8d6817,emissiveIntensity:.3}));
    outgoingDashes.push(atom(g,[0,0,0],.047,0xd4ae45,'Transition state',{emissive:0x8d6817,emissiveIntensity:.3}));
  }
  const lonePairs = [
    atom(g,[0,0,0],.055,0xe9bd43,'Nucleophile',{emissive:0xe9bd43,emissiveIntensity:.7}),
    atom(g,[0,0,0],.055,0xe9bd43,'Nucleophile',{emissive:0xe9bd43,emissiveIntensity:.7}),
  ];
  const electronPositions = new Float32Array(32 * 3);
  const electronGeometry = new THREE.BufferGeometry();
  electronGeometry.setAttribute('position', new THREE.BufferAttribute(electronPositions, 3));
  const electronArrow = new THREE.Line(electronGeometry, new THREE.LineBasicMaterial({color:0xe0ad35}));
  tag(electronArrow, 'Nucleophile'); g.add(electronArrow);
  const electronHead = new THREE.Mesh(new THREE.ConeGeometry(.075,.2,16),material(0xe0ad35,{emissive:0x8a5d0d,emissiveIntensity:.25}));
  tag(electronHead,'Nucleophile');g.add(electronHead);
  const leavingElectronPositions = new Float32Array(30 * 3);
  const leavingElectronGeometry = new THREE.BufferGeometry();
  leavingElectronGeometry.setAttribute('position', new THREE.BufferAttribute(leavingElectronPositions, 3));
  const leavingElectronArrow = new THREE.Line(leavingElectronGeometry, new THREE.LineBasicMaterial({ color: 0xe0ad35 }));
  tag(leavingElectronArrow, 'Leaving group'); g.add(leavingElectronArrow);
  const leavingElectronHead = new THREE.Mesh(new THREE.ConeGeometry(.075,.2,16),material(0xe0ad35,{emissive:0x8a5d0d,emissiveIntensity:.25}));
  tag(leavingElectronHead,'Leaving group'); g.add(leavingElectronHead);
  const nucleophileCharge = labelSprite('HO-', '#ffd36b', .2); oxygenMesh.add(nucleophileCharge); nucleophileCharge.position.set(0, .55, 0);
  const leavingCharge = labelSprite('Cl-', '#ffd36b', .2); chlorineMesh.add(leavingCharge); leavingCharge.position.set(0, .58, 0);
  const transitionCharge = labelSprite('OVERALL CHARGE -1  |  PARTIAL CHARGE SHARED', '#ffd36b', .42); transitionCharge.position.set(0, 1.85, 0); g.add(transitionCharge);

  const energyPoints = [];
  for (let i = 0; i <= 48; i += 1) {
    const t = i / 48;
    energyPoints.push(new THREE.Vector3(-2.7 + t * 5.4, -1.92 + Math.exp(-Math.pow((t - .5) / .2, 2)) * .92 - t * .28, -1.28));
  }
  const energyCurve = new THREE.CatmullRomCurve3(energyPoints);
  const energyPath = new THREE.Mesh(new THREE.TubeGeometry(energyCurve, 96, .024, 8, false), material(0xa57a31, { emissive: 0x6f4c10, emissiveIntensity: .14 }));
  tag(energyPath, 'Transition state'); g.add(energyPath);
  const markerPosition = energyCurve.getPoint(progress);
  const marker = atom(g, markerPosition.toArray(), .09, 0xe6b440, 'Transition state', { emissive: 0xe6b440, emissiveIntensity: .62 });
  const energyLabel = labelSprite('ENERGY', '#e3bd58', .22); energyLabel.position.set(-2.85, -1.35, -1.28); g.add(energyLabel);
  const coordinateLabel = labelSprite('REACTION COORDINATE', '#e3bd58', .34); coordinateLabel.position.set(0, -2.28, -1.28); g.add(coordinateLabel);

  g.userData.update = (value) => {
    const inversion = THREE.MathUtils.lerp(-.44, .44, value);
    hydrogenAtoms.forEach((mesh, index) => {
      const angle = index * Math.PI * 2 / 3 + Math.PI / 6;
      const position = [inversion, .35 + Math.cos(angle) * 1.02, Math.sin(angle) * 1.02];
      mesh.position.set(...position);
      setDynamicBond(hydrogenBonds[index], carbon, position);
    });
    const approach = THREE.MathUtils.smoothstep(value, 0, .55);
    const departure = THREE.MathUtils.smoothstep(value, .45, 1);
    const oxygen = [-2.55 + approach * 1.22, .35, 0];
    const oxygenH = [oxygen[0] - .48, oxygen[1] + .62, 0];
    const chlorine = [1.32 + departure * 1.23, .35, 0];
    oxygenMesh.position.set(...oxygen);
    oxygenHydrogenMesh.position.set(...oxygenH);
    chlorineMesh.position.set(...chlorine);
    setDynamicBond(oxygenHydrogenBond, oxygen, oxygenH);
    setDynamicBond(incomingBond, oxygen, carbon);
    setDynamicBond(outgoingBond, carbon, chlorine);
    incomingBond.material.opacity = .18 + value * .72;
    outgoingBond.material.opacity = .9 - value * .72;
    const oxygenVector = new THREE.Vector3(...oxygen);
    const carbonVector = new THREE.Vector3(...carbon);
    const chlorineVector = new THREE.Vector3(...chlorine);
    incomingDashes.forEach((mesh, index) => mesh.position.copy(oxygenVector).lerp(carbonVector,(index+.5)/5));
    outgoingDashes.forEach((mesh, index) => mesh.position.copy(carbonVector).lerp(chlorineVector,(index+.5)/5));
    lonePairs[0].position.set(oxygen[0]+.36,oxygen[1]-.22,.18);
    lonePairs[1].position.set(oxygen[0]+.36,oxygen[1]-.22,-.18);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(oxygen[0]+.4,oxygen[1]+.2,.18),
      new THREE.Vector3(oxygen[0]*.55,oxygen[1]+.72,.25),
      new THREE.Vector3(-.12,carbon[1]+.35,.08),
    ]);
    for(let index=0;index<32;index+=1){
      const point=curve.getPoint(index/31);
      electronPositions[index*3]=point.x;electronPositions[index*3+1]=point.y;electronPositions[index*3+2]=point.z;
    }
    electronGeometry.attributes.position.needsUpdate=true;
    const arrowPoint=curve.getPoint(1);
    const arrowTangent=curve.getTangent(1).normalize();
    electronHead.position.copy(arrowPoint);
    electronHead.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),arrowTangent);
    const leavingCurve = new THREE.CatmullRomCurve3([
      carbonVector.clone().lerp(chlorineVector, .48).add(new THREE.Vector3(0,.08,-.18)),
      chlorineVector.clone().add(new THREE.Vector3(-.12,.55,-.22)),
      chlorineVector.clone().add(new THREE.Vector3(.18,.38,-.08)),
    ]);
    for(let index=0;index<30;index+=1){
      const point=leavingCurve.getPoint(index/29);
      leavingElectronPositions[index*3]=point.x;leavingElectronPositions[index*3+1]=point.y;leavingElectronPositions[index*3+2]=point.z;
    }
    leavingElectronGeometry.attributes.position.needsUpdate=true;
    leavingElectronHead.position.copy(leavingCurve.getPoint(1));
    leavingElectronHead.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),leavingCurve.getTangent(1).normalize());
    nucleophileCharge.visible = value < .38;
    transitionCharge.visible = false;
    leavingCharge.visible = value > .62;
    marker.position.copy(energyCurve.getPoint(value));
  };
  g.userData.update(progress);

  g.scale.setScalar(.9); g.rotation.set(.08, -.28, -.04); return g;
}

function animatedMechanismBond(group, color = 0x64706d, radius = .04, part) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 14), material(color, { transparent: true, opacity: 0, roughness: .3 }));
  mesh.visible = false;
  if (part) tag(mesh, part);
  group.add(mesh);
  return (from, to, order = 1) => {
    const direction = to.clone().sub(from);
    const length = direction.length();
    mesh.visible = order > .015 && length > .001;
    if (!mesh.visible) return;
    mesh.position.copy(from).add(to).multiplyScalar(.5);
    // radius tracks bond order: a partial bond is visibly thin, a full bond is solid
    const r = .26 + .74 * Math.min(1, order);
    mesh.scale.set(r, length, r);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.material.opacity = Math.min(1, .35 + order * .65);
  };
}

function animatedMechanismDoubleBond(group, color = 0x64706d, radius = .018, separation = .055, part) {
  const first = animatedMechanismBond(group, color, radius, part);
  const second = animatedMechanismBond(group, color, radius, part);
  const offset = new THREE.Vector3();
  return (from, to, opacity = 1) => {
    const direction = to.clone().sub(from).normalize();
    offset.crossVectors(direction, new THREE.Vector3(0, 0, 1));
    if (offset.lengthSq() < .001) offset.crossVectors(direction, new THREE.Vector3(0, 1, 0));
    offset.normalize().multiplyScalar(separation / 2);
    first(from.clone().add(offset), to.clone().add(offset), opacity);
    second(from.clone().sub(offset), to.clone().sub(offset), opacity);
  };
}

function animatedMechanismDashedBond(group, color, part, dashSize = .075, gapSize = .045) {
  const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const line = new THREE.Line(geometry, new THREE.LineDashedMaterial({ color, dashSize, gapSize, transparent: true, opacity: 0 }));
  line.visible = false; tag(line, part); group.add(line);
  return (from, to, opacity = 1) => {
    line.visible = opacity > .004;
    if (!line.visible) return;
    const positions = line.geometry.attributes.position;
    positions.setXYZ(0, from.x, from.y, from.z);
    positions.setXYZ(1, to.x, to.y, to.z);
    positions.needsUpdate = true;
    line.computeLineDistances();
    line.material.opacity = opacity;
  };
}

function mechanismPhaseLobe(group, color, part) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), material(color, {
    transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide,
    roughness: .22, emissive: color, emissiveIntensity: .1,
  }));
  mesh.visible = false;
  tag(mesh, part);
  group.add(mesh);
  return (position, direction, scale, opacity) => {
    mesh.visible = opacity > .004;
    if (!mesh.visible) return;
    mesh.position.copy(position);
    mesh.scale.copy(scale);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    mesh.material.opacity = opacity;
  };
}

function suzukiMechanism(progress) {
  const g = new THREE.Group();
  const localIpsoAxis = new THREE.Vector3(1, 0, 0);
  const fragmentPoint = (fragment, local) => local.clone().applyQuaternion(fragment.group.quaternion).add(fragment.group.position);
  const setOpacity = (object, opacity) => object.traverse((child) => {
    if (!child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((item) => { item.transparent = true; item.opacity = opacity; });
  });
  const setSpriteOpacity = (sprite, opacity) => { sprite.material.opacity = opacity; sprite.visible = opacity > .004; };
  const makeArylFragment = (part, label) => {
    const group = new THREE.Group(); tag(group, part); g.add(group);
    const points = Array.from({ length: 6 }, (_, index) => {
      const angle = index * Math.PI / 3;
      return new THREE.Vector3(Math.cos(angle) * .46, Math.sin(angle) * .46, 0);
    });
    points.forEach((point, index) => {
      atom(group, point.toArray(), .12, C.carbon, part, { roughness: .3 });
      const next = points[(index + 1) % points.length];
      bond(group, point.toArray(), next.toArray(), .024, 0x4c5754, part);
      if (index % 2 === 0) {
        const inset = point.clone().add(next).multiplyScalar(.5).normalize().multiplyScalar(-.045);
        bond(group, point.clone().add(inset).toArray(), next.clone().add(inset).toArray(), .012, 0x4c5754, part);
      }
      if (index === 0) return;
      const hydrogen = point.clone().normalize().multiplyScalar(.63);
      atom(group, hydrogen.toArray(), .046, C.hydrogen, part, { roughness: .38 });
      bond(group, point.toArray(), hydrogen.toArray(), .011, 0xc5cbc8, part);
    });
    const text = labelSprite(label, '#f3dfb3', .15); text.position.set(0, .68, .12); group.add(text);
    return { group, ipso: points[0], text };
  };
  const placeAryl = (fragment, ipsoPosition, ipsoAxis, torsion) => {
    const axis = ipsoAxis.clone().normalize();
    const orient = new THREE.Quaternion().setFromUnitVectors(localIpsoAxis, axis);
    const twist = new THREE.Quaternion().setFromAxisAngle(axis, torsion);
    fragment.group.quaternion.copy(twist.multiply(orient));
    fragment.group.position.copy(ipsoPosition).sub(fragment.ipso.clone().applyQuaternion(fragment.group.quaternion));
    return axis;
  };
  const arylBromide = makeArylFragment('Aryl bromide', 'Ar-Br');
  const arylBoronate = makeArylFragment('Arylboronic acid', "Ar'-B(OH)2");

  // Pd(II) is square planar. The plane is deliberately oblique to the camera,
  // while each aryl ring is torsioned around its own Pd-C axis.
  const planeNormal = new THREE.Vector3(.28, -.5, .82).normalize();
  const coordinationU = new THREE.Vector3(.94, .26, -.2).projectOnPlane(planeNormal).normalize();
  const coordinationV = new THREE.Vector3().crossVectors(planeNormal, coordinationU).normalize();
  const coordinationDistance = .72;
  const pdOrigin = new THREE.Vector3();
  const pdRegenerated = new THREE.Vector3(.08, .68, -.42);
  const site = (center, direction) => center.clone().addScaledVector(direction, coordinationDistance);
  const initialLigandA = new THREE.Vector3(-.42, .42, .22);
  const initialLigandB = new THREE.Vector3(.42, .28, -.26);
  const regeneratedLigandA = pdRegenerated.clone().add(new THREE.Vector3(-.34, .38, .22));
  const regeneratedLigandB = pdRegenerated.clone().add(new THREE.Vector3(.34, .2, -.26));
  const palladium = atom(g, [0,0,0], .22, 0xb9c0bf, 'Palladium catalyst', { metalness: .72, roughness: .2, emissive: 0x53605d, emissiveIntensity: .12 });
  const pdZero = labelSprite('FORMAL Pd(0)', '#d6dfdd', .16); pdZero.position.set(0, .78, .14); palladium.add(pdZero);
  const pdTwo = labelSprite('FORMAL Pd(II)', '#f0c86b', .16); pdTwo.position.set(.74, -.55, .12); palladium.add(pdTwo);
  const ligandA = atom(g, [0,0,0], .12, 0xa49786, 'Palladium catalyst', { metalness: .2, roughness: .32 });
  const ligandB = atom(g, [0,0,0], .12, 0xa49786, 'Palladium catalyst', { metalness: .2, roughness: .32 });
  const ligandALabel = labelSprite('L', '#f4e6c8', .11); ligandALabel.position.set(0, .22, .04); ligandA.add(ligandALabel);
  const ligandBLabel = labelSprite('L', '#f4e6c8', .11); ligandBLabel.position.set(0, .22, .04); ligandB.add(ligandBLabel);
  const bromine = atom(g, [0,0,0], .22, C.bromine, 'Aryl bromide', { transparent: true, opacity: 1, roughness: .3 });
  const bromineLabel = labelSprite('Br', '#d7f0d1', .13); bromineLabel.position.set(0, .35, 0); bromine.add(bromineLabel);
  const bromideLabel = labelSprite('Br- off-cycle', '#b8d8ef', .13); bromideLabel.position.set(0, .35, 0); bromine.add(bromideLabel);
  const boronate = new THREE.Group(); tag(boronate, 'Arylboronic acid'); g.add(boronate);
  atom(boronate, [0,0,0], .17, C.boron, 'Arylboronic acid', { roughness: .3, metalness: .08 });
  const hydroxyls = [[.23,.4,0],[.23,-.4,0]];
  hydroxyls.forEach((point) => {
    atom(boronate, point, .068, C.oxygen, 'Arylboronic acid', { roughness: .35 });
    bond(boronate, [0,0,0], point, .018, 0x9e7765, 'Arylboronic acid');
  });
  [[.36,.58,0],[.36,-.58,0]].forEach((point, index) => {
    atom(boronate, point, .04, C.hydrogen, 'Arylboronic acid', { roughness: .42 });
    bond(boronate, hydroxyls[index], point, .011, 0xc5cbc8, 'Arylboronic acid');
  });
  const boronateLabel = labelSprite('B(OH)2', '#f0ca78', .13); boronateLabel.position.set(0, .62, .08); boronate.add(boronateLabel);
  const borateLabel = labelSprite('borate by-product', '#d3b27f', .13); borateLabel.position.set(0, .62, .08); boronate.add(borateLabel);

  const framePoints = [-1, 1, 1, -1].map((sign, index) => {
    const direction = [coordinationU.clone().multiplyScalar(-1), coordinationV, coordinationU, coordinationV.clone().multiplyScalar(-1)][index];
    return direction.multiplyScalar(coordinationDistance);
  });
  const coordinationFrame = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(framePoints),
    new THREE.LineBasicMaterial({ color: 0x8eb9b1, transparent: true, opacity: 0, depthWrite: false }),
  );
  tag(coordinationFrame, 'cis-diaryl Pd'); g.add(coordinationFrame);
  const squareLabel = labelSprite('Pd(II): square planar', '#c5dbd6', .16); squareLabel.position.copy(planeNormal).multiplyScalar(.44).add(new THREE.Vector3(0, -.82, 0)); g.add(squareLabel);
  const equation = labelSprite("Ar-Br + Ar'-B(OH)2  ->  Ar-Ar'", '#f0ca78', .3); equation.position.set(0, 1.85, .08); g.add(equation);
  const productLabel = labelSprite('TWISTED BIARYL PRODUCT', '#f0ca78', .17); productLabel.position.set(0, .14, .68); g.add(productLabel);

  const cBrBond = animatedMechanismBond(g, 0x4f5d59, .032, 'Aryl bromide');
  const cBBond = animatedMechanismBond(g, 0x9b7951, .03, 'Arylboronic acid');
  const pdArylA = animatedMechanismBond(g, 0xa9b4b1, .035, 'cis-diaryl Pd');
  const pdArylB = animatedMechanismBond(g, 0xa9b4b1, .035, 'cis-diaryl Pd');
  const pdBrBond = animatedMechanismBond(g, 0x9cae89, .03, 'Palladium catalyst');
  const pdLigandA = animatedMechanismBond(g, 0x7e837d, .022, 'Palladium catalyst');
  const pdLigandB = animatedMechanismBond(g, 0x7e837d, .022, 'Palladium catalyst');
  const productBond = animatedMechanismBond(g, 0x45504d, .052, 'Biaryl product');
  const arylTransferTrace = animatedMechanismDashedBond(g, 0xf0ca78, 'Arylboronic acid', .06, .035);

  const leftStart = new THREE.Vector3(-1.72, .08, .5);
  const rightStart = new THREE.Vector3(1.58, -.28, -.58);
  const productCenter = new THREE.Vector3(0, -.72, .02);
  const productAxis = new THREE.Vector3(.94, .2, .28).normalize();
  const leftStartAxis = new THREE.Vector3(1, -.05, .18).normalize();
  const rightStartAxis = new THREE.Vector3(-1, .06, -.2).normalize();
  const eliminationStartA = site(pdOrigin, coordinationU.clone().multiplyScalar(-1));
  const eliminationStartB = site(pdOrigin, coordinationV);
  const eliminationStartMidpoint = eliminationStartA.clone().add(eliminationStartB).multiplyScalar(.5);
  const eliminationStartVector = eliminationStartB.clone().sub(eliminationStartA);
  const eliminationEndVector = productAxis.clone().multiplyScalar(-.46);
  const eliminationRotation = new THREE.Quaternion().setFromUnitVectors(
    eliminationStartVector.clone().normalize(), eliminationEndVector.clone().normalize(),
  );
  const bromideExit = new THREE.Vector3(-1.74, 1.04, .76);
  const borateExit = new THREE.Vector3(1.74, .82, -.78);

  g.userData.update = (value) => {
    const oxidativeAddition = THREE.MathUtils.smoothstep(value, .08, .3);
    const bromideDeparture = THREE.MathUtils.smoothstep(value, .3, .44);
    const arylTransfer = THREE.MathUtils.smoothstep(value, .44, .62);
    const reductiveElimination = THREE.MathUtils.smoothstep(value, .72, .9);
    const pdRegeneration = THREE.MathUtils.smoothstep(value, .82, .96);
    const pdPosition = pdOrigin.clone().lerp(pdRegenerated, pdRegeneration);
    const pdArylASite = site(pdPosition, coordinationU.clone().multiplyScalar(-1));
    const pdTransSite = site(pdPosition, coordinationV);
    const pdLigandASite = site(pdPosition, coordinationU);
    const pdLigandBSite = site(pdPosition, coordinationV.clone().multiplyScalar(-1));
    const productA = productCenter.clone().addScaledVector(productAxis, .23);
    const productB = productCenter.clone().addScaledVector(productAxis, -.23);
    const eliminationDirection = eliminationStartVector.clone().normalize().applyQuaternion(
      new THREE.Quaternion().slerp(eliminationRotation, reductiveElimination),
    );
    const eliminationDistance = THREE.MathUtils.lerp(eliminationStartVector.length(), eliminationEndVector.length(), reductiveElimination);
    const eliminationMidpoint = eliminationStartMidpoint.clone().lerp(productCenter, reductiveElimination);
    const leftEliminationPosition = eliminationMidpoint.clone().addScaledVector(eliminationDirection, -eliminationDistance / 2);
    const rightEliminationPosition = eliminationMidpoint.clone().addScaledVector(eliminationDirection, eliminationDistance / 2);
    const leftIpso = reductiveElimination > 0 ? leftEliminationPosition : leftStart.clone().lerp(eliminationStartA, oxidativeAddition);
    const rightIpso = reductiveElimination > 0 ? rightEliminationPosition : rightStart.clone().lerp(eliminationStartB, arylTransfer);
    const leftAxis = leftStartAxis.clone().lerp(coordinationU, oxidativeAddition).lerp(productAxis.clone().multiplyScalar(-1), reductiveElimination).normalize();
    const rightAxis = rightStartAxis.clone().lerp(coordinationV.clone().multiplyScalar(-1), arylTransfer).lerp(productAxis, reductiveElimination).normalize();
    const torsionA = THREE.MathUtils.lerp(.12, .58, Math.max(oxidativeAddition, reductiveElimination));
    const torsionB = THREE.MathUtils.lerp(-.18, -.58, Math.max(arylTransfer, reductiveElimination));
    placeAryl(arylBromide, leftIpso, leftAxis, torsionA);
    placeAryl(arylBoronate, rightIpso, rightAxis, torsionB);
    const leftCarbon = fragmentPoint(arylBromide, arylBromide.ipso);
    const rightCarbon = fragmentPoint(arylBoronate, arylBoronate.ipso);

    palladium.position.copy(pdPosition);
    ligandA.position.copy(initialLigandA).lerp(pdLigandASite, oxidativeAddition).lerp(regeneratedLigandA, pdRegeneration);
    ligandB.position.copy(initialLigandB).lerp(pdLigandBSite, oxidativeAddition).lerp(regeneratedLigandB, pdRegeneration);
    const bromineStart = leftCarbon.clone().addScaledVector(leftAxis, .58);
    bromine.position.copy(bromineStart).lerp(pdTransSite, oxidativeAddition).lerp(bromideExit, bromideDeparture);
    const boronateStart = rightCarbon.clone().addScaledVector(rightAxis, .58);
    const boronateOrient = new THREE.Quaternion().setFromUnitVectors(localIpsoAxis, rightAxis);
    boronate.quaternion.copy(boronateOrient);
    boronate.position.copy(boronateStart).lerp(borateExit, arylTransfer);

    const pdBondFade = 1 - THREE.MathUtils.smoothstep(value, .72, .86);
    cBrBond(leftCarbon, bromine.position, 1 - THREE.MathUtils.smoothstep(value, .12, .28));
    cBBond(rightCarbon, boronate.position, 1 - THREE.MathUtils.smoothstep(value, .44, .52));
    arylTransferTrace(boronate.position, pdTransSite, THREE.MathUtils.smoothstep(value, .45, .5) * (1 - arylTransfer) * .9);
    pdArylA(pdPosition, leftCarbon, oxidativeAddition * pdBondFade);
    pdArylB(pdPosition, rightCarbon, arylTransfer * pdBondFade);
    pdBrBond(pdPosition, bromine.position, oxidativeAddition * (1 - bromideDeparture));
    pdLigandA(pdPosition, ligandA.position, 1); pdLigandB(pdPosition, ligandB.position, 1);
    const cCBondClosure = THREE.MathUtils.smoothstep(reductiveElimination, .62, 1);
    productBond(leftCarbon, rightCarbon, cCBondClosure);

    const pdIIOpacity = THREE.MathUtils.smoothstep(value, .08, .16) * (1 - THREE.MathUtils.smoothstep(value, .76, .9));
    const pdZeroLabelOpacity = Math.max(1 - THREE.MathUtils.smoothstep(value, .08, .16), pdRegeneration);
    const pdTwoLabelOpacity = pdIIOpacity * (1 - THREE.MathUtils.smoothstep(value, .48, .56));
    const squareLabelOpacity = THREE.MathUtils.smoothstep(value, .48, .56) * (1 - THREE.MathUtils.smoothstep(value, .76, .84));
    setSpriteOpacity(pdZero, pdZeroLabelOpacity); setSpriteOpacity(pdTwo, pdTwoLabelOpacity);
    coordinationFrame.position.copy(pdPosition); coordinationFrame.material.opacity = pdIIOpacity * .8; coordinationFrame.visible = coordinationFrame.material.opacity > .004;
    setSpriteOpacity(squareLabel, squareLabelOpacity);
    setSpriteOpacity(arylBromide.text, 1 - THREE.MathUtils.smoothstep(value, .14, .26));
    setSpriteOpacity(arylBoronate.text, 1 - THREE.MathUtils.smoothstep(value, .44, .56));
    const byproductOpacity = 1 - THREE.MathUtils.smoothstep(value, .66, .8);
    setOpacity(boronate, byproductOpacity); boronate.visible = byproductOpacity > .004;
    setSpriteOpacity(boronateLabel, 0);
    setSpriteOpacity(borateLabel, THREE.MathUtils.smoothstep(value, .66, .72) * (1 - THREE.MathUtils.smoothstep(value, .78, .84)) * byproductOpacity);
    const bromineOpacity = 1 - THREE.MathUtils.smoothstep(value, .62, .78);
    bromine.material.opacity = bromineOpacity; bromine.visible = bromineOpacity > .004;
    setSpriteOpacity(bromineLabel, 0);
    setSpriteOpacity(bromideLabel, THREE.MathUtils.smoothstep(value, .34, .42) * (1 - THREE.MathUtils.smoothstep(value, .54, .62)) * bromineOpacity);
    setSpriteOpacity(productLabel, THREE.MathUtils.smoothstep(value, .88, .96));
    equation.visible = false;
  };
  g.userData.update(progress); g.scale.setScalar(.95); g.rotation.set(.1, -.3, -.04); return g;
}

function dielsAlderMechanism(progress) {
  const g = new THREE.Group();
  const phasePositive = 0xd37742; const phaseNegative = 0x456ba4;
  const dieneSTransPoints = [
    new THREE.Vector3(-1.05, .18, 0), new THREE.Vector3(-.46, .72, 0),
    new THREE.Vector3(.46, .72, 0), new THREE.Vector3(1.05, 1.26, 0),
  ];
  const dieneAxis = dieneSTransPoints[2].clone().sub(dieneSTransPoints[1]).normalize();
  // A coherent half-chair product geometry keeps the six C-C distances in the
  // same teaching-scale range while preserving the identity of every carbon.
  const dienePlanarProductPoints = [
    new THREE.Vector3(-.84, .15, 0), new THREE.Vector3(-.4, .75, 0),
    new THREE.Vector3(.4, .75, 0), new THREE.Vector3(.84, .15, 0),
  ];
  const dieneAtoms = dieneSTransPoints.map((point) => atom(g, point.toArray(), .17, C.carbon, 'Diene HOMO', { roughness: .28 }));
  const dienophileA = atom(g, [0,0,0], .17, C.carbon, 'Dienophile LUMO', { roughness: .28 });
  const dienophileB = atom(g, [0,0,0], .17, C.carbon, 'Dienophile LUMO', { roughness: .28 });
  const dieneDoubleLeft = animatedMechanismDoubleBond(g, 0x45504d, .015, .047, 'Diene HOMO');
  const dieneCentralSingle = animatedMechanismBond(g, 0x45504d, .026, 'Diene HOMO');
  const dieneDoubleRight = animatedMechanismDoubleBond(g, 0x45504d, .015, .047, 'Diene HOMO');
  const dieneSingleLeft = animatedMechanismBond(g, 0x45504d, .026, 'Cycloadduct');
  const dieneCentralDouble = animatedMechanismDoubleBond(g, 0x45504d, .015, .047, 'Cycloadduct');
  const dieneSingleRight = animatedMechanismBond(g, 0x45504d, .026, 'Cycloadduct');
  const dienophileDouble = animatedMechanismDoubleBond(g, 0x45504d, .015, .047, 'Dienophile LUMO');
  const dienophileSingle = animatedMechanismBond(g, 0x45504d, .026, 'Cycloadduct');
  const formingLeft = animatedMechanismDashedBond(g, 0xd4ae45, 'Transition state');
  const formingRight = animatedMechanismDashedBond(g, 0xd4ae45, 'Transition state');
  const productClosureLeft = animatedMechanismBond(g, 0x45504d, .03, 'Cycloadduct');
  const productClosureRight = animatedMechanismBond(g, 0x45504d, .03, 'Cycloadduct');
  // Qualitative p-orbital pairs expose the node-bearing pi frameworks. The
  // terminal faces that meet in the suprafacial approach are larger so the
  // constructive phase match remains readable without claiming an isosurface.
  const makePiOrbitals = (phasePairs, part) => phasePairs.map(([top, bottom]) => ({
    top: mechanismPhaseLobe(g, top, part), bottom: mechanismPhaseLobe(g, bottom, part),
  }));
  const dienePiOrbitals = makePiOrbitals([
    [phasePositive, phaseNegative], [phasePositive, phaseNegative],
    [phaseNegative, phasePositive], [phaseNegative, phasePositive],
  ], 'Diene HOMO');
  const dienophilePiOrbitals = makePiOrbitals([
    [phaseNegative, phasePositive], [phasePositive, phaseNegative],
  ], 'Dienophile LUMO');
  const placePiOrbital = (orbital, position, scale, offset, opacity) => {
    const upper = new THREE.Vector3(0, 0, 1);
    const lower = new THREE.Vector3(0, 0, -1);
    orbital.top(position.clone().addScaledVector(upper, offset), upper, scale, opacity);
    orbital.bottom(position.clone().addScaledVector(lower, offset), lower, scale, opacity);
  };
  const phaseContactLeft = animatedMechanismDashedBond(g, phasePositive, 'Transition state', .045, .028);
  const phaseContactRight = animatedMechanismDashedBond(g, phaseNegative, 'Transition state', .045, .028);
  const reactionLabel = labelSprite('BUTADIENE + ETHENE  ->  CYCLOHEXENE', '#f0ca78', .31); reactionLabel.position.set(0, 1.8, 0); g.add(reactionLabel);
  const transLabel = labelSprite('s-trans diene', '#d6e4da', .15); transLabel.position.set(0, 1.42, 0); g.add(transLabel);
  const cisLabel = labelSprite('s-cis: reactive conformer', '#d6e4da', .15); cisLabel.position.set(0, 1.42, 0); g.add(cisLabel);
  const transitionLabel = labelSprite('concerted [4+2] arrangement', '#f0ca78', .15); transitionLabel.position.set(0, 1.42, 0); g.add(transitionLabel);
  const phaseLabel = labelSprite('ORANGE / BLUE = WAVEFUNCTION PHASE', '#f0ca78', .18); phaseLabel.position.set(0, -1.82, 0); g.add(phaseLabel);
  const productLabel = labelSprite('CYCLOADDUCT', '#f0ca78', .18); productLabel.position.set(0, -.75, .35); g.add(productLabel);
  const startA = new THREE.Vector3(-.41, -.5, 1.4); const startB = new THREE.Vector3(.41, -.5, 1.4);
  const planarProductA = new THREE.Vector3(-.4, -.52, .18); const planarProductB = new THREE.Vector3(.4, -.52, .18);
  const productA = new THREE.Vector3(-.4, -.52, .16); const productB = new THREE.Vector3(.4, -.52, -.16);

  g.userData.update = (value) => {
    const cisPreparation = THREE.MathUtils.smoothstep(value, .04, .24);
    const approach = THREE.MathUtils.smoothstep(value, .28, .52);
    const formation = THREE.MathUtils.smoothstep(value, .52, .78);
    const product = THREE.MathUtils.smoothstep(value, .72, .96);
    const pucker = THREE.MathUtils.smoothstep(value, .8, .96);
    // Rotate one vinyl end around the central single bond. A position lerp here
    // shortens C3-C4 midway through the rotation and makes an unphysical diene.
    const preparedDiene = dieneSTransPoints.map((point) => point.clone());
    preparedDiene[3] = dieneSTransPoints[3].clone()
      .sub(dieneSTransPoints[2])
      .applyAxisAngle(dieneAxis, Math.PI * cisPreparation)
      .add(dieneSTransPoints[2]);
    const dienePoints = preparedDiene.map((point, index) => point.clone().lerp(dienePlanarProductPoints[index], formation));
    dieneAtoms.forEach((atomMesh, index) => atomMesh.position.copy(dienePoints[index]));
    const dienophilePositionA = startA.clone().lerp(planarProductA, approach).lerp(productA, pucker);
    const dienophilePositionB = startB.clone().lerp(planarProductB, approach).lerp(productB, pucker);
    dienophileA.position.copy(dienophilePositionA); dienophileB.position.copy(dienophilePositionB);
    dieneDoubleLeft(dienePoints[0], dienePoints[1], 1 - product);
    dieneCentralSingle(dienePoints[1], dienePoints[2], 1 - product);
    dieneDoubleRight(dienePoints[2], dienePoints[3], 1 - product);
    dieneSingleLeft(dienePoints[0], dienePoints[1], product);
    dieneCentralDouble(dienePoints[1], dienePoints[2], product);
    dieneSingleRight(dienePoints[2], dienePoints[3], product);
    dienophileDouble(dienophilePositionA, dienophilePositionB, 1 - product);
    dienophileSingle(dienophilePositionA, dienophilePositionB, product);
    const partialBondOpacity = formation * (1 - product);
    formingLeft(dienePoints[0], dienophilePositionA, partialBondOpacity);
    formingRight(dienePoints[3], dienophilePositionB, partialBondOpacity);
    productClosureLeft(dienePoints[0], dienophilePositionA, product);
    productClosureRight(dienePoints[3], dienophilePositionB, product);
    const lobeOpacity = THREE.MathUtils.smoothstep(value, .25, .32) * (1 - THREE.MathUtils.smoothstep(value, .52, .64)) * .42;
    dienePiOrbitals.forEach((orbital, index) => {
      const terminal = index === 0 || index === 3;
      placePiOrbital(orbital, dienePoints[index], terminal ? new THREE.Vector3(.16, .22, .16) : new THREE.Vector3(.11, .16, .11), terminal ? .31 : .25, lobeOpacity * (terminal ? 1 : .56));
    });
    placePiOrbital(dienophilePiOrbitals[0], dienophilePositionA, new THREE.Vector3(.16, .22, .16), .31, lobeOpacity);
    placePiOrbital(dienophilePiOrbitals[1], dienophilePositionB, new THREE.Vector3(.16, .22, .16), .31, lobeOpacity);
    phaseContactLeft(dienePoints[0].clone().add(new THREE.Vector3(0, 0, .34)), dienophilePositionA.clone().add(new THREE.Vector3(0, 0, -.34)), lobeOpacity * .85);
    phaseContactRight(dienePoints[3].clone().add(new THREE.Vector3(0, 0, .34)), dienophilePositionB.clone().add(new THREE.Vector3(0, 0, -.34)), lobeOpacity * .85);
    reactionLabel.visible = true;
    phaseLabel.visible = lobeOpacity > .08;
    const transOpacity = 1 - THREE.MathUtils.smoothstep(value, .12, .18);
    const cisOpacity = THREE.MathUtils.smoothstep(value, .2, .26) * (1 - THREE.MathUtils.smoothstep(value, .5, .54));
    const transitionOpacity = THREE.MathUtils.smoothstep(value, .58, .64) * (1 - THREE.MathUtils.smoothstep(value, .78, .82));
    const productOpacity = THREE.MathUtils.smoothstep(value, .86, .96);
    transLabel.material.opacity = transOpacity; transLabel.visible = transOpacity > .004;
    cisLabel.material.opacity = cisOpacity; cisLabel.visible = cisOpacity > .004;
    transitionLabel.material.opacity = transitionOpacity; transitionLabel.visible = transitionOpacity > .004;
    productLabel.material.opacity = productOpacity; productLabel.visible = productOpacity > .004;
  };
  g.userData.update(progress); g.scale.setScalar(.94); g.rotation.set(.12, -.3, -.05); return g;
}

// Shared helpers for the simpler reaction-coordinate mechanisms (E2, SN1, additions).
function mechanismElectronArrow(group, part, color = 0xe0ad35, segments = 24) {
  const positions = new Float32Array(segments * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, linewidth: 3 }));
  line.visible = false; tag(line, part); group.add(line);
  const head = new THREE.Mesh(new THREE.ConeGeometry(.078, .2, 14), material(color, { emissive: color, emissiveIntensity: .35, transparent: true, opacity: 0 }));
  head.visible = false; tag(head, part); group.add(head);
  const FRONT = new THREE.Vector3(0, 0, .5);
  return (points, opacity = 1) => {
    const on = opacity > .012 && points.length >= 2;
    line.visible = on; head.visible = on;
    if (!on) return;
    // float the whole arrow toward the viewer so it never spears an atom
    const curve = new THREE.CatmullRomCurve3(points.map((pt) => pt.clone().add(FRONT)));
    for (let i = 0; i < segments; i += 1) {
      const p = curve.getPoint(i / (segments - 1));
      positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z;
    }
    geometry.attributes.position.needsUpdate = true;
    line.material.opacity = opacity;
    head.position.copy(curve.getPoint(1));
    head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangent(1).normalize());
    head.material.opacity = opacity;
  };
}

// heightAt(t) returns the energy profile height; SN1 passes a two-barrier profile.
function mechanismEnergyTrack(group, part, heightAt) {
  const z = -1.75;
  const pts = [];
  for (let i = 0; i <= 48; i += 1) { const t = i / 48; pts.push(new THREE.Vector3(-2.7 + t * 5.4, -2.5 + heightAt(t), z)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  const path = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, .024, 8, false), material(0xa57a31, { emissive: 0x6f4c10, emissiveIntensity: .14 }));
  tag(path, part); group.add(path);
  const marker = atom(group, curve.getPoint(0).toArray(), .09, 0xe6b440, part, { emissive: 0xe6b440, emissiveIntensity: .62 });
  const eLabel = labelSprite('ENERGY', '#e3bd58', .22); eLabel.position.set(-2.85, -1.95, z); group.add(eLabel);
  const cLabel = labelSprite('REACTION COORDINATE', '#e3bd58', .34); cLabel.position.set(0, -2.9, z); group.add(cLabel);
  return (value) => marker.position.copy(curve.getPoint(THREE.MathUtils.clamp(value, 0, 1)));
}

const BR_COLOR = 0x9c5a3c;
const NU_COLOR = 0x4f8f86;

// Three hydrogen positions splayed outward from a methyl carbon (roughly tetrahedral).
function tripodH(center, outward, len) {
  const o = outward.clone().normalize();
  const perp = Math.abs(o.y) < .9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const u = new THREE.Vector3().crossVectors(o, perp).normalize();
  const v = new THREE.Vector3().crossVectors(o, u).normalize();
  return [0, 1, 2].map((k) => {
    const a = k * 2 * Math.PI / 3;
    const dir = o.clone().multiplyScalar(.334).addScaledVector(u, Math.cos(a) * .943).addScaledVector(v, Math.sin(a) * .943).normalize();
    return center.clone().addScaledVector(dir, len);
  });
}

// Offset for the second line of a double bond: perpendicular to the bond AND to the view, so a
// pi bond reads as a parallel line rather than a stray diagonal stick.
function piOffset(a, b, sep = .13) {
  const dir = b.clone().sub(a).normalize();
  let off = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 0, 1));
  if (off.lengthSq() < .0015) off = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
  return off.normalize().multiplyScalar(sep);
}

// E2: concerted, anti-periplanar elimination. A base removes a beta-H while the
// leaving group departs anti to it and a C=C pi bond forms. One barrier.
function e2Mechanism(progress) {
  const g = new THREE.Group();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const LCH = .82, LCBR = 1.15;
  // Bromoethane, anti-periplanar. C-C along x; alpha carbon (right) bears Br + 2 H,
  // beta carbon (left) bears 3 H (one removed). Tetrahedral reactant -> planar ethene.
  const cAr = V(.5, 0, 0), cBr0 = V(-.5, 0, 0);
  const cAp = V(.46, 0, 0), cBp = V(-.46, 0, 0);
  const hA1d = V(.334, .471, .816), hA2d = V(.334, .471, -.816);   // alpha H's (kept)
  const hB2d = V(-.334, -.471, .816), hB3d = V(-.334, -.471, -.816); // beta H's (kept)
  const hBd = V(-.334, .943, 0), brd = V(.334, -.943, 0);          // removed H anti to Br
  const hA1p = cAp.clone().add(V(.5, .866, 0).multiplyScalar(LCH));
  const hA2p = cAp.clone().add(V(.5, -.866, 0).multiplyScalar(LCH));
  const hB2p = cBp.clone().add(V(-.5, .866, 0).multiplyScalar(LCH));
  const hB3p = cBp.clone().add(V(-.5, -.866, 0).multiplyScalar(LCH));

  const cAatom = atom(g, cAr.toArray(), .24, C.carbon, 'Electrophile', { roughness: .3 });
  const cBatom = atom(g, cBr0.toArray(), .24, C.carbon, 'Electrophile', { roughness: .3 });
  const hA1 = atom(g, [0, 0, 0], .15, C.hydrogen, 'Electrophile', { roughness: .4 });
  const hA2 = atom(g, [0, 0, 0], .15, C.hydrogen, 'Electrophile', { roughness: .4 });
  const hB2 = atom(g, [0, 0, 0], .15, C.hydrogen, 'Electrophile', { roughness: .4 });
  const hB3 = atom(g, [0, 0, 0], .15, C.hydrogen, 'Electrophile', { roughness: .4 });
  const betaH = atom(g, [0, 0, 0], .15, C.hydrogen, 'Transition state', { roughness: .4 });
  const brm = atom(g, [0, 0, 0], .3, BR_COLOR, 'Leaving group', { roughness: .3 });
  const baseO = atom(g, [0, 0, 0], .26, C.oxygen, 'Nucleophile', { roughness: .3 });
  const baseH = atom(g, [0, 0, 0], .14, C.hydrogen, 'Nucleophile', { roughness: .4 });
  const bCA1 = animatedMechanismBond(g, 0x68716e, .052, 'Electrophile');
  const bCA2 = animatedMechanismBond(g, 0x68716e, .052, 'Electrophile');
  const bCB2 = animatedMechanismBond(g, 0x68716e, .052, 'Electrophile');
  const bCB3 = animatedMechanismBond(g, 0x68716e, .052, 'Electrophile');
  const ccSigma = animatedMechanismBond(g, 0x69736f, .066, 'Electrophile');
  const ccPi = animatedMechanismBond(g, 0x67a85f, .05, 'Transition state');
  const cbH = animatedMechanismBond(g, 0x69716e, .052, 'Transition state');
  const cBrBond = animatedMechanismBond(g, 0x69736f, .06, 'Leaving group');
  const obH = animatedMechanismBond(g, 0x69716e, .052, 'Nucleophile');
  const obaseH = animatedMechanismBond(g, 0x69716e, .052, 'Nucleophile');
  const arrowBase = mechanismElectronArrow(g, 'Nucleophile');
  const arrowPi = mechanismElectronArrow(g, 'Transition state');
  const arrowBr = mechanismElectronArrow(g, 'Leaving group');
  const baseLabel = labelSprite('base OH-', '#ffd36b', .3); baseO.add(baseLabel); baseLabel.position.set(-.15, -.48, 0);
  const brLabel = labelSprite('Br⁻', '#ffd36b', .2); brm.add(brLabel); brLabel.position.set(.2, -.5, 0);
  const setMarker = mechanismEnergyTrack(g, 'Transition state', (t) => Math.exp(-Math.pow((t - .5) / .2, 2)) * .92 - t * .28);

  g.userData.update = (value) => {
    const planar = THREE.MathUtils.smoothstep(value, .3, .92);
    const hTransfer = THREE.MathUtils.smoothstep(value, .28, .82);
    const depart = THREE.MathUtils.smoothstep(value, .4, 1);
    const approach = THREE.MathUtils.smoothstep(value, 0, .62);
    const cA = cAr.clone().lerp(cAp, planar);
    const cB = cBr0.clone().lerp(cBp, planar);
    cAatom.position.copy(cA); cBatom.position.copy(cB);
    const pA1 = cAr.clone().add(hA1d.clone().multiplyScalar(LCH)).lerp(hA1p, planar);
    const pA2 = cAr.clone().add(hA2d.clone().multiplyScalar(LCH)).lerp(hA2p, planar);
    const pB2 = cBr0.clone().add(hB2d.clone().multiplyScalar(LCH)).lerp(hB2p, planar);
    const pB3 = cBr0.clone().add(hB3d.clone().multiplyScalar(LCH)).lerp(hB3p, planar);
    hA1.position.copy(pA1); hA2.position.copy(pA2); hB2.position.copy(pB2); hB3.position.copy(pB3);
    bCA1(cA, pA1, 1); bCA2(cA, pA2, 1); bCB2(cB, pB2, 1); bCB3(cB, pB3, 1);
    const oPos = V(-2.25, 1.5, 0).lerp(V(-1.45, 1.22, 0), approach);
    baseO.position.copy(oPos);
    const bhPos = oPos.clone().add(V(-.28, .34, .1)); baseH.position.copy(bhPos); obaseH(oPos, bhPos, 1);
    const hBstart = cBr0.clone().add(hBd.clone().multiplyScalar(LCH));
    const bH = hBstart.clone().lerp(oPos.clone().add(V(.42, -.3, 0)), hTransfer);
    betaH.position.copy(bH);
    cbH(cB, bH, 1 - THREE.MathUtils.smoothstep(value, .3, .68));
    obH(oPos, bH, THREE.MathUtils.smoothstep(value, .42, .82));
    const brStart = cAr.clone().add(brd.clone().multiplyScalar(LCBR));
    brm.position.copy(brStart.clone().lerp(V(2.15, -1.5, 0), depart));
    cBrBond(cA, brm.position, 1 - THREE.MathUtils.smoothstep(value, .38, .74));
    ccSigma(cA, cB, 1);
    const off = piOffset(cA, cB, .15);
    ccPi(cA.clone().add(off), cB.clone().add(off), planar);
    const op = THREE.MathUtils.smoothstep(value, .16, .3) * (1 - THREE.MathUtils.smoothstep(value, .6, .76));
    arrowBase([oPos.clone().add(V(.2, -.05, .2)), oPos.clone().lerp(bH, .5).add(V(.1, .2, .2)), bH.clone().add(V(-.02, .16, .15))], op);
    arrowPi([bH.clone().lerp(cB, .5).add(V(.1, .05, .24)), cA.clone().lerp(cB, .5).add(V(0, .4, .26)), cA.clone().lerp(cB, .5).add(V(0, .14, .2))], op);
    arrowBr([cA.clone().lerp(brm.position, .5).add(V(.05, -.05, .22)), brm.position.clone().add(V(-.2, .35, .2)), brm.position.clone().add(V(.05, .22, .16))], op);
    baseLabel.visible = value < .5;
    brLabel.visible = value > .55;
    setMarker(value);
  };
  g.userData.update(progress);
  g.scale.setScalar(.82); g.rotation.set(.06, -.24, -.02); return g;
}

// SN1: stepwise. Rate-determining ionization to a planar carbocation (first, tall
// barrier), then nucleophile capture (second, smaller barrier). Two barriers, one
// intermediate well; the flat cation is attacked from either face (racemization).
function sn1Mechanism(progress) {
  const g = new THREE.Group();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const Cc = V(0, 0, 0);
  const LCC = 1.0, LCBR = 1.15, LCO = 1.0;
  // tert-butyl bromide. Ionization axis along -x (Br leaves left), so nucleophile
  // captures from +x. Three real methyls go tetrahedral -> planar -> tetrahedral.
  const mReact = [V(.334, .943, 0), V(.334, -.471, .816), V(.334, -.471, -.816)].map((d) => Cc.clone().addScaledVector(d, LCC));
  const mPlanar = [V(0, 1, 0), V(0, -.5, .866), V(0, -.5, -.866)].map((d) => Cc.clone().addScaledVector(d, LCC));
  const mProd = [V(-.334, .943, 0), V(-.334, -.471, .816), V(-.334, -.471, -.816)].map((d) => Cc.clone().addScaledVector(d, LCC));
  const tripod = (center, outward, len) => {
    const o = outward.clone().normalize();
    const perp = Math.abs(o.y) < .9 ? V(0, 1, 0) : V(1, 0, 0);
    const u = new THREE.Vector3().crossVectors(o, perp).normalize();
    const v = new THREE.Vector3().crossVectors(o, u).normalize();
    return [0, 1, 2].map((k) => {
      const a = k * 2 * Math.PI / 3;
      const dir = o.clone().multiplyScalar(.5).addScaledVector(u, Math.cos(a) * .87).addScaledVector(v, Math.sin(a) * .87).normalize();
      return center.clone().addScaledVector(dir, len);
    });
  };
  atom(g, Cc.toArray(), .24, C.carbon, 'Electrophile', { roughness: .28 });
  const methyls = [0, 1, 2].map(() => ({
    mC: atom(g, [0, 0, 0], .18, C.carbon, 'Electrophile', { roughness: .32 }),
    ccBond: animatedMechanismBond(g, 0x68716e, .062, 'Electrophile'),
    hs: [0, 1, 2].map(() => atom(g, [0, 0, 0], .12, C.hydrogen, 'Electrophile', { roughness: .42 })),
    hBonds: [0, 1, 2].map(() => animatedMechanismBond(g, 0x767c79, .042, 'Electrophile')),
  }));
  const brm = atom(g, [0, 0, 0], .3, BR_COLOR, 'Leaving group', { roughness: .3 });
  const nu = atom(g, [0, 0, 0], .27, C.oxygen, 'Nucleophile', { roughness: .28 });
  const nuH = atom(g, [0, 0, 0], .14, C.hydrogen, 'Nucleophile', { roughness: .34 });
  const cBr = animatedMechanismBond(g, 0x69736f, .066, 'Leaving group');
  const cNu = animatedMechanismBond(g, 0x67a85f, .066, 'Nucleophile');
  const nuOH = animatedMechanismBond(g, 0x69716e, .052, 'Nucleophile');
  const arrowIonize = mechanismElectronArrow(g, 'Leaving group');
  const arrowCapture = mechanismElectronArrow(g, 'Nucleophile');
  const catCharge = labelSprite('planar carbocation C+', '#ffd36b', .42); catCharge.position.set(0, 1.55, 0); g.add(catCharge);
  const brCharge = labelSprite('Br⁻', '#ffd36b', .2); brm.add(brCharge); brCharge.position.set(0, -.52, 0);
  const nuCharge = labelSprite('Nu- (OH-)', '#ffd36b', .28); nu.add(nuCharge); nuCharge.position.set(0, -.45, 0);
  const setMarker = mechanismEnergyTrack(g, 'Transition state', (t) => -t * .3 + .95 * Math.exp(-Math.pow((t - .27) / .12, 2)) + .6 * Math.exp(-Math.pow((t - .72) / .12, 2)) + .34 * Math.exp(-Math.pow((t - .5) / .16, 2)) + .12);

  g.userData.update = (value) => {
    const phase1 = THREE.MathUtils.smoothstep(value, 0, .48);
    const phase2 = THREE.MathUtils.smoothstep(value, .52, 1);
    methyls.forEach((m, i) => {
      const mPos = value < .5 ? mReact[i].clone().lerp(mPlanar[i], phase1) : mPlanar[i].clone().lerp(mProd[i], phase2);
      m.mC.position.copy(mPos);
      m.ccBond(Cc, mPos, 1);
      const hpos = tripod(mPos, mPos.clone().sub(Cc), .58);
      m.hs.forEach((h, k) => { h.position.copy(hpos[k]); m.hBonds[k](mPos, hpos[k], 1); });
    });
    brm.position.copy(V(-LCBR, 0, 0).lerp(V(-2.7, 0, 0), THREE.MathUtils.smoothstep(value, .08, .5)));
    cBr(Cc, brm.position, 1 - THREE.MathUtils.smoothstep(value, .1, .45));
    const nuPos = V(2.7, 0, 0).lerp(V(LCO, 0, 0), THREE.MathUtils.smoothstep(value, .55, .95));
    nu.position.copy(nuPos); nuH.position.copy(nuPos).add(V(.36, .36, 0));
    nuOH(nuPos, nuH.position, 1);
    cNu(Cc, nuPos, THREE.MathUtils.smoothstep(value, .6, .92));
    const aIon = THREE.MathUtils.smoothstep(value, .05, .16) * (1 - THREE.MathUtils.smoothstep(value, .35, .46));
    arrowIonize([Cc.clone().lerp(brm.position, .5).add(V(0, .18, .25)), brm.position.clone().add(V(.2, .42, .25)), brm.position.clone().add(V(0, .28, .2))], aIon);
    const aCap = THREE.MathUtils.smoothstep(value, .6, .72) * (1 - THREE.MathUtils.smoothstep(value, .86, .96));
    arrowCapture([nuPos.clone().add(V(-.1, .18, .25)), nuPos.clone().lerp(Cc, .5).add(V(0, .34, .25)), Cc.clone().add(V(.18, .2, .2))], aCap);
    catCharge.visible = value > .4 && value < .62;
    brCharge.visible = value > .28;
    nuCharge.visible = value < .55;
    setMarker(value);
  };
  g.userData.update(progress);
  g.scale.setScalar(.86); g.rotation.set(.1, -.3, -.02); return g;
}

// Nucleophilic addition to a carbonyl (1,2): the nucleophile adds to the carbonyl
// carbon, the C=O pi bond breaks onto oxygen (alkoxide), and the carbon goes
// trigonal planar -> tetrahedral. One barrier.
function carbonylAdditionMechanism(progress) {
  const g = new THREE.Group();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const Cco = V(0, 0, 0);
  const LCO2 = 1.15, LCC = 1.0, LCH = .85;
  // Acetaldehyde: trigonal-planar carbonyl in the xz-plane (normal +y). Hydride adds
  // from +y (Burgi-Dunitz). Reactant sp2 -> product sp3 (three groups pyramidalize).
  const oR = V(LCO2, 0, 0), oP = V(1.0, -.42, 0);
  const meR = V(-.5, 0, .866).multiplyScalar(LCC), meP = V(-.5, -.42, .8);
  const ahR = V(-.5, 0, -.866).multiplyScalar(LCH), ahP = V(-.44, -.42, -.72);
  atom(g, Cco.toArray(), .24, C.carbon, 'Electrophile', { roughness: .28 });
  const oMesh = atom(g, [0, 0, 0], .28, C.oxygen, 'Transition state', { roughness: .28 });
  const meC = atom(g, [0, 0, 0], .18, C.carbon, 'Electrophile', { roughness: .32 });
  const meH = [0, 1, 2].map(() => atom(g, [0, 0, 0], .12, C.hydrogen, 'Electrophile', { roughness: .42 }));
  const meHb = [0, 1, 2].map(() => animatedMechanismBond(g, 0x767c79, .042, 'Electrophile'));
  const aldH = atom(g, [0, 0, 0], .14, C.hydrogen, 'Electrophile', { roughness: .4 });
  const hyd = atom(g, [0, 0, 0], .15, 0xdfe6e3, 'Nucleophile', { roughness: .34, emissive: 0x9fb0ac, emissiveIntensity: .12 });
  const meBond = animatedMechanismBond(g, 0x68716e, .062, 'Electrophile');
  const aldBond = animatedMechanismBond(g, 0x68716e, .052, 'Electrophile');
  const coDouble = animatedMechanismDoubleBond(g, 0x45504d, .03, .1, 'Transition state');
  const coSingle = animatedMechanismBond(g, 0x45504d, .066, 'Transition state');
  const cHyd = animatedMechanismBond(g, 0x67a85f, .062, 'Nucleophile');
  const arrowNu = mechanismElectronArrow(g, 'Nucleophile');
  const arrowCO = mechanismElectronArrow(g, 'Transition state');
  const nuLabel = labelSprite('H:⁻ hydride', '#ffd36b', .3); hyd.add(nuLabel); nuLabel.position.set(-.62, .18, 0);
  const oLabel = labelSprite('O⁻ alkoxide', '#ffd36b', .28); oMesh.add(oLabel); oLabel.position.set(.35, -.62, 0);
  const setMarker = mechanismEnergyTrack(g, 'Transition state', (t) => Math.exp(-Math.pow((t - .48) / .2, 2)) * .88 - t * .34);

  g.userData.update = (value) => {
    const add = THREE.MathUtils.smoothstep(value, 0, .8);
    const oPos = oR.clone().lerp(oP, add); oMesh.position.copy(oPos);
    const mePos = meR.clone().lerp(meP, add); meC.position.copy(mePos);
    const ahPos = ahR.clone().lerp(ahP, add); aldH.position.copy(ahPos);
    const hyPos = V(-.15, 1.42, 0).lerp(V(-.1, .82, 0), add); hyd.position.copy(hyPos);
    meBond(Cco, mePos, 1); aldBond(Cco, ahPos, 1);
    const hp = tripodH(mePos, mePos.clone().sub(Cco), .55);
    meH.forEach((h, k) => { h.position.copy(hp[k]); meHb[k](mePos, hp[k], 1); });
    const dbl = 1 - THREE.MathUtils.smoothstep(value, .3, .85);
    coDouble(Cco, oPos, dbl); coSingle(Cco, oPos, 1);
    cHyd(Cco, hyPos, THREE.MathUtils.smoothstep(value, .32, .9));
    const op = THREE.MathUtils.smoothstep(value, .15, .3) * (1 - THREE.MathUtils.smoothstep(value, .72, .86));
    arrowNu([hyPos.clone().add(V(.12, .1, .24)), hyPos.clone().lerp(Cco, .5).add(V(.14, 0, .24)), Cco.clone().add(V(0, .22, .2))], op);
    arrowCO([Cco.clone().lerp(oPos, .5).add(V(0, .18, .22)), oPos.clone().add(V(.15, .3, .22)), oPos.clone().add(V(.3, .12, .18))], op);
    nuLabel.visible = value < .55;
    oLabel.visible = value > .55;
    setMarker(value);
  };
  g.userData.update(progress);
  g.scale.setScalar(.9); g.rotation.set(.16, -.3, -.02); return g;
}

// Michael (1,4-conjugate) addition: the nucleophile adds to the beta-carbon of an
// enone. Electrons relay through the conjugated system to oxygen, giving an
// enolate, which is protonated to the 1,4-addition product.
function michaelMechanism(progress) {
  const g = new THREE.Group();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  // Methyl vinyl ketone, planar conjugated enone (sp2, ~120 deg) in the xy-plane.
  // O=C1(-CH3)-C2H=C3H2; the nucleophile adds 1,4 to the beta carbon C3.
  const c1 = V(-.5, .3, 0), c2 = V(.5, -.2, 0), c3 = V(1.45, .3, 0);
  const oPos = V(-.55, 1.45, 0), meC = V(-1.5, -.15, 0);
  const c2Hp = V(.5, -1.3, 0), c3H1 = V(2.4, .05, 0), c3H2 = V(1.55, 1.35, 0);
  atom(g, c1.toArray(), .24, C.carbon, 'Electrophile', { roughness: .28 });
  atom(g, c2.toArray(), .23, C.carbon, 'Transition state', { roughness: .28 });
  atom(g, c3.toArray(), .24, C.carbon, 'Electrophile', { roughness: .28 });
  const oMesh = atom(g, oPos.toArray(), .28, C.oxygen, 'Transition state', { roughness: .28 });
  const meCatom = atom(g, meC.toArray(), .18, C.carbon, 'Electrophile', { roughness: .32 });
  const meH = [0, 1, 2].map(() => atom(g, [0, 0, 0], .12, C.hydrogen, 'Electrophile', { roughness: .42 }));
  const meHb = [0, 1, 2].map(() => animatedMechanismBond(g, 0x767c79, .042, 'Electrophile'));
  atom(g, c2Hp.toArray(), .13, C.hydrogen, 'Transition state', { roughness: .42 });
  atom(g, c3H1.toArray(), .13, C.hydrogen, 'Electrophile', { roughness: .42 });
  atom(g, c3H2.toArray(), .13, C.hydrogen, 'Electrophile', { roughness: .42 });
  const nu = atom(g, [0, 0, 0], .26, NU_COLOR, 'Nucleophile', { roughness: .26, emissive: NU_COLOR, emissiveIntensity: .12 });
  const protonH = atom(g, [0, 0, 0], .14, C.hydrogen, 'Nucleophile', { roughness: .34 });
  const protonLabel = labelSprite('H⁺', '#ffd36b', .2); protonH.add(protonLabel); protonLabel.position.set(.42, -.05, 0);
  bond(g, c1.toArray(), meC.toArray(), .062, 0x68716e, 'Electrophile');
  bond(g, c2.toArray(), c2Hp.toArray(), .052, 0x68716e, 'Transition state');
  bond(g, c3.toArray(), c3H1.toArray(), .052, 0x68716e, 'Electrophile');
  bond(g, c3.toArray(), c3H2.toArray(), .052, 0x68716e, 'Electrophile');
  bond(g, c1.toArray(), c2.toArray(), .066, 0x69736f, 'Electrophile');
  bond(g, c2.toArray(), c3.toArray(), .066, 0x69736f, 'Electrophile');
  bond(g, c1.toArray(), oPos.toArray(), .066, 0x45504d, 'Transition state');
  const c1c2Pi = animatedMechanismBond(g, 0x67a85f, .05, 'Transition state');
  const c2c3Pi = animatedMechanismBond(g, 0x69736f, .05, 'Electrophile');
  const coPi = animatedMechanismBond(g, 0x45504d, .05, 'Transition state');
  const c3Nu = animatedMechanismBond(g, 0x67a85f, .066, 'Nucleophile');
  const c2Proton = animatedMechanismBond(g, 0x69716e, .052, 'Nucleophile');
  const arrowNu = mechanismElectronArrow(g, 'Nucleophile');
  const arrowCC = mechanismElectronArrow(g, 'Transition state');
  const arrowCO = mechanismElectronArrow(g, 'Transition state');
  const nuLabel = labelSprite('Nu⁻ (enolate)', '#ffd36b', .3); nu.add(nuLabel); nuLabel.position.set(.28, .48, 0);
  const oLabel = labelSprite('enolate O⁻', '#ffd36b', .28); oMesh.add(oLabel); oLabel.position.set(.9, .34, 0);
  const betaLabel = labelSprite('beta C (1,4)', '#c7d0cc', .3); betaLabel.position.set(1.5, -.5, 0); g.add(betaLabel);
  const setMarker = mechanismEnergyTrack(g, 'Transition state', (t) => Math.exp(-Math.pow((t - .45) / .2, 2)) * .9 - t * .3);

  g.userData.update = (value) => {
    const add = THREE.MathUtils.smoothstep(value, 0, .62);
    const protonate = THREE.MathUtils.smoothstep(value, .78, 1);
    const nuPos = V(2.7, 1.0, 0).lerp(V(2.25, .72, 0), add); nu.position.copy(nuPos);
    const pPos = V(1.0, -2.3, 0).lerp(V(1.0, -.75, 0), protonate); protonH.position.copy(pPos);
    const hp = tripodH(meC, meC.clone().sub(c1), .55);
    meH.forEach((h, k) => { h.position.copy(hp[k]); meHb[k](meC, hp[k], 1); });
    const off23 = piOffset(c2, c3, .14);
    const off12 = piOffset(c1, c2, .14);
    const offCO = piOffset(c1, oMesh.position, .14);
    c2c3Pi(c2.clone().add(off23), c3.clone().add(off23), 1 - THREE.MathUtils.smoothstep(value, .25, .6));
    c1c2Pi(c1.clone().add(off12), c2.clone().add(off12), THREE.MathUtils.smoothstep(value, .28, .6) * (1 - THREE.MathUtils.smoothstep(value, .8, .96)));
    coPi(c1.clone().add(offCO), oMesh.position.clone().add(offCO), Math.max(1 - THREE.MathUtils.smoothstep(value, .35, .62), THREE.MathUtils.smoothstep(value, .82, .98)));
    c3Nu(c3, nuPos, THREE.MathUtils.smoothstep(value, .3, .62));
    c2Proton(c2, pPos, THREE.MathUtils.smoothstep(value, .82, 1));
    const op = THREE.MathUtils.smoothstep(value, .12, .26) * (1 - THREE.MathUtils.smoothstep(value, .56, .7));
    arrowNu([nuPos.clone().add(V(.1, .1, .24)), nuPos.clone().lerp(c3, .5).add(V(.1, .1, .24)), c3.clone().add(V(.12, .2, .2))], op);
    arrowCC([c2.clone().lerp(c3, .5).add(V(0, -.14, .26)), c1.clone().lerp(c2, .5).add(V(.1, -.32, .26)), c1.clone().lerp(c2, .5).add(V(.05, -.1, .22))], op);
    arrowCO([c1.clone().lerp(oMesh.position, .5).add(V(.16, 0, .22)), oMesh.position.clone().add(V(.34, .05, .22)), oMesh.position.clone().add(V(.18, .3, .18))], op);
    nuLabel.visible = value < .55;
    oLabel.visible = value > .55 && value < .86;
    betaLabel.visible = value < .4;
    protonH.visible = protonate > .02;
    setMarker(value);
  };
  g.userData.update(progress);
  g.scale.setScalar(.8); g.rotation.set(.06, -.2, -.02); return g;
}

function mechanism(progress, parameters = {}) {
  if (parameters.mechanismId === 'suzuki') return suzukiMechanism(progress);
  if (parameters.mechanismId === 'dielsAlder') return dielsAlderMechanism(progress);
  if (parameters.mechanismId === 'e2') return e2Mechanism(progress);
  if (parameters.mechanismId === 'sn1') return sn1Mechanism(progress);
  if (parameters.mechanismId === 'carbonyl') return carbonylAdditionMechanism(progress);
  if (parameters.mechanismId === 'michael') return michaelMechanism(progress);
  return sn2Mechanism(progress);
}

function orbitals(progress) {
  const g = new THREE.Group();
  const positive = 0xd37742;
  const negative = 0x456ba4;
  const surface = (color, opacity, side = THREE.FrontSide) => material(color, {
    transparent: true, opacity, side, depthWrite: false, roughness: .24,
    metalness: .02, emissive: color, emissiveIntensity: .08,
  });
  const addLobe = (position, scale, color, part, opacity = .72) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), surface(color, opacity));
    mesh.position.copy(position); mesh.scale.copy(scale); tag(mesh, part); g.add(mesh); return mesh;
  };
  const addDirectionalLobe = (direction, size, color, part, opacity = .72) => {
    const unit = direction.clone().normalize();
    const mesh = addLobe(unit.clone().multiplyScalar(size * .72), new THREE.Vector3(size * .46, size, size * .46), color, part, opacity);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), unit);
    return mesh;
  };

  atom(g, [0, 0, 0], .16, C.carbon, 'Nucleus', { metalness: .22, roughness: .25 });
  // A p orbital is a two-lobed dumbbell along one axis: opposite phase on each side,
  // with a flat node through the nucleus where the two colours meet.
  const addPOrbital = (axis, opacity = .58) => {
    [[axis, positive], [axis.clone().multiplyScalar(-1), negative]].forEach(([dir, color]) => {
      const lobe = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), surface(color, opacity));
      lobe.scale.set(.5, .95, .5);
      lobe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      lobe.position.copy(dir).multiplyScalar(.82);
      tag(lobe, 'p orbital'); g.add(lobe);
    });
  };
  if (progress < .25) {
    // s orbital: one spherical cloud, single phase. No radial node and no outer
    // shell — the nested-sphere look is the shell misconception this exhibit dispels.
    addLobe(new THREE.Vector3(), new THREE.Vector3(1.12, 1.12, 1.12), positive, 's orbital', .5);
  } else if (progress < .75) {
    // The four basis orbitals shown together: one s (faint, at centre) plus three
    // p orbitals on x, y, z. Seeing all four is the "4 in" half of the 4 -> 4 count.
    addLobe(new THREE.Vector3(), new THREE.Vector3(.5, .5, .5), positive, 's orbital', .34);
    addPOrbital(new THREE.Vector3(1, 0, 0));
    addPOrbital(new THREE.Vector3(0, 1, 0));
    addPOrbital(new THREE.Vector3(0, 0, 1));
  } else {
    [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].forEach((values) => {
      const direction = new THREE.Vector3(...values).normalize();
      addDirectionalLobe(direction, 1.08, positive, 'Hybrid orbital', .74);
      addDirectionalLobe(direction.clone().multiplyScalar(-1), .34, negative, 'Hybrid orbital', .42);
    });
  }
  g.scale.setScalar(.84);
  // This oblique tetrahedral view keeps all four large sp3 lobes distinct
  // instead of aiming the camera directly down one lobe.
  if (progress >= .75) g.rotation.set(.386, -1.017, .675);
  else g.rotation.set(.2, -.42, .08);
  return g;
}

function geometry(progress) {
  const g = new THREE.Group();
  const water = progress >= .75; const ammonia = progress >= .25 && progress < .75;
  atom(g, [0,0,0], .35, water ? C.oxygen : ammonia ? C.nitrogen : C.carbon, 'Central atom', { roughness: .28 });
  const tetra = [[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]].map((p) => new THREE.Vector3(...p).normalize().multiplyScalar(1.52));
  const halfAngle = THREE.MathUtils.degToRad(104.5 / 2);
  const waterHydrogens = [
    new THREE.Vector3(Math.sin(halfAngle), -Math.cos(halfAngle), 0).multiplyScalar(1.46),
    new THREE.Vector3(-Math.sin(halfAngle), -Math.cos(halfAngle), 0).multiplyScalar(1.46),
  ];
  const ammoniaPolarCos = Math.sqrt((Math.cos(THREE.MathUtils.degToRad(107)) + .5) / 1.5);
  const ammoniaRadial = Math.sqrt(1 - ammoniaPolarCos ** 2);
  const ammoniaHydrogens = [0,1,2].map((index) => new THREE.Vector3(
    Math.cos(index * Math.PI * 2 / 3) * ammoniaRadial,
    Math.sin(index * Math.PI * 2 / 3) * ammoniaRadial,
    -ammoniaPolarCos,
  ).multiplyScalar(1.52));
  const positions = water ? waterHydrogens : ammonia ? ammoniaHydrogens : tetra;
  positions.forEach((v) => {
    atom(g, v.toArray(), .22, C.hydrogen, 'Bonding pair', { roughness: .3 });
    bond(g, [0,0,0], v.toArray(), .07, 0x68716e, 'Bond angle');
    const domain = new THREE.Mesh(new THREE.SphereGeometry(.31, 30, 22), material(0x6a8cad, { transparent: true, opacity: .2, side: THREE.DoubleSide, depthWrite: false }));
    domain.scale.set(.68,.68,1.65); domain.position.copy(v).multiplyScalar(.48);
    domain.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),v.clone().normalize()); tag(domain,'Bonding pair'); g.add(domain);
  });
  if (water || ammonia) {
    const loneDirections = (water ? [new THREE.Vector3(0, .544, .839), new THREE.Vector3(0, .544, -.839)] : [new THREE.Vector3(0,0,1)]).map((v) => v.normalize());
    loneDirections.forEach((direction) => {
      const lobe = new THREE.Mesh(new THREE.SphereGeometry(.43, 36, 26), material(C.violet, { transparent: true, opacity: .48, side: THREE.DoubleSide, depthWrite: false }));
      lobe.scale.set(.65,.65,1.5); lobe.position.copy(direction).multiplyScalar(.92);
      lobe.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),direction); tag(lobe,'Lone pair'); g.add(lobe);
      const tangent = new THREE.Vector3(-direction.y, direction.x, 0).normalize().multiplyScalar(.1);
      [-1,1].forEach((sign) => atom(g,direction.clone().multiplyScalar(1.36).add(tangent.clone().multiplyScalar(sign)).toArray(),.052,0xe4bb46,'Lone pair',{emissive:0xe4bb46,emissiveIntensity:.55}));
    });
    if (water) {
      const arcPoints = [];
      for (let i = 0; i <= 30; i += 1) {
        const angle = -halfAngle + (i / 30) * halfAngle * 2;
        arcPoints.push(new THREE.Vector3(Math.sin(angle) * .62, -Math.cos(angle) * .62, .04));
      }
      const arc = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPoints), 48, .018, 8, false), material(0xd2a83f,{emissive:0x6c4b0c,emissiveIntensity:.12}));
      tag(arc,'Bond angle'); g.add(arc);
    }
  }
  if (water) {
    waterHydrogens.forEach((hydrogen) => arrow(g, hydrogen.clone().multiplyScalar(.78).toArray(), hydrogen.clone().multiplyScalar(.2).toArray(), 0xe4b441, 'Bond angle'));
    arrow(g, [0,-.18,.1], [0,.82,.1], 0xe4b441, 'Bond angle');
    const dipoleLabel = labelSprite('NET DIPOLE  |  104.5°', '#e4c15f', .36); dipoleLabel.position.set(0, 1.75, 0); dipoleLabel.visible = false; g.add(dipoleLabel);
  } else if (ammonia) {
    const geometryLabel = labelSprite('4 DOMAINS  ->  TRIGONAL PYRAMIDAL  |  ~107°', '#c9d7df', .48); geometryLabel.position.set(0, 1.95, 0); geometryLabel.visible = false; g.add(geometryLabel);
  } else {
    const geometryLabel = labelSprite('4 BONDS  ->  TETRAHEDRAL  |  109.5°  |  DIPOLES CANCEL', '#c9d7df', .52); geometryLabel.position.set(0, 1.95, 0); geometryLabel.visible = false; g.add(geometryLabel);
  }
  g.scale.setScalar(.95); g.rotation.set(.24,-.4,.08); return g;
}

function labelSprite(text, color = '#f4f0e5', size = .54) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 96;
  const context = canvas.getContext('2d');
  let fontSize = 34;
  context.font = `600 ${fontSize}px Inter, Arial, sans-serif`;
  while (context.measureText(text).width > 480 && fontSize > 12) {
    fontSize -= 1;
    context.font = `600 ${fontSize}px Inter, Arial, sans-serif`;
  }
  context.textAlign = 'center'; context.textBaseline = 'middle';
  context.fillStyle = 'rgba(18, 25, 23, .82)';
  context.fillRect(0, 5, 512, 86);
  context.strokeStyle = 'rgba(255,255,255,.16)'; context.lineWidth = 2;
  context.strokeRect(1, 6, 510, 84);
  context.fillStyle = color; context.fillText(text, 256, 49);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(size * 3.8, size * .72, 1);
  sprite.userData.worldLabel = true;
  sprite.visible = false;
  return sprite;
}

function arrow(group, start, end, color, part) {
  const from = new THREE.Vector3(...start); const to = new THREE.Vector3(...end);
  const direction = to.clone().sub(from); const length = direction.length();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.026, .026, Math.max(.05, length - .18), 12), material(color, { emissive: color, emissiveIntensity: .18 }));
  shaft.position.copy(from).lerp(to, .46);
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  const head = new THREE.Mesh(new THREE.ConeGeometry(.09, .2, 16), material(color, { emissive: color, emissiveIntensity: .2 }));
  head.position.copy(to).addScaledVector(direction.clone().normalize(), -.08);
  head.quaternion.copy(shaft.quaternion);
  tag(shaft, part); tag(head, part); group.add(shaft, head);
  return [shaft, head];
}

function batteryExhibit(progress, initialParameters = {}) {
  const g = new THREE.Group();
  const graphite = new THREE.Group(); const cathode = new THREE.Group();
  const separator = new THREE.Group(); const electrolyte = new THREE.Group(); const circuit = new THREE.Group();
  const hostSites = []; const platedAtoms = []; const platingLinks = [];
  graphite.position.x = -1.65; cathode.position.x = 1.65;
  g.add(graphite, separator, electrolyte, cathode, circuit);
  const plating = new THREE.Group(); graphite.add(plating);
  const platingSites = [[.42,-.329,.19],[.42,.165,.285],[.42,.165,-.095]];

  // Stacked graphene-like honeycomb sheets keep every interior carbon
  // three-coordinate while leaving visible galleries for Li+ intercalation.
  for (let layer = -1; layer <= 1; layer += 1) {
    const layerGroup = new THREE.Group();
    layerGroup.position.x = layer * .32;
    tag(layerGroup, 'Negative electrode'); graphite.add(layerGroup);
    const carbonSpacing = .19; const aSites = new Map(); const bSites = new Map();
    const addCarbon = (collection, key, point) => {
      collection.set(key, point);
      atom(layerGroup, point, .048, layer % 2 ? 0x82928d : 0x5b6965, 'Negative electrode', { roughness: .48 });
    };
    for (let n = -3; n <= 3; n += 1) for (let m = -2; m <= 2; m += 1) {
      const y = (n * Math.sqrt(3) + m * Math.sqrt(3) / 2) * carbonSpacing;
      const z = m * 1.5 * carbonSpacing;
      addCarbon(aSites, `${n}:${m}`, [0, y, z]);
      addCarbon(bSites, `${n}:${m}`, [0, y, z + carbonSpacing]);
    }
    aSites.forEach((point, key) => {
      const [n, m] = key.split(':').map(Number);
      [`${n}:${m}`, `${n}:${m - 1}`, `${n + 1}:${m - 1}`].forEach((neighborKey) => {
        const neighbor = bSites.get(neighborKey);
        if (neighbor) bond(layerGroup, point, neighbor, .015, 0x3a4642, 'Negative electrode');
      });
    });
  }
  for (let index = 0; index < 12; index += 1) {
    const site = new THREE.Mesh(new THREE.CircleGeometry(.07, 16), material(0xd2aa49, { transparent: true, opacity: .2, roughness: .6, side: THREE.DoubleSide, depthWrite: false }));
    site.rotation.y = Math.PI / 2;
    site.position.set(.34 - (index % 3) * .18, -1.25 + Math.floor(index / 3) * .48, -.48 + (index % 2) * .48);
    tag(site, 'Negative electrode'); graphite.add(site); hostSites.push(site);
  }
  const graphiteLabel = labelSprite('SCHEMATIC NEGATIVE HOST: C6 + xLi+ + xe-  <->  LixC6'); graphiteLabel.position.set(0, -2.05, 0); graphite.add(graphiteLabel);

  const membrane = new THREE.Mesh(new THREE.BoxGeometry(.28, 3.4, 1.85), material(0xded7b8, { transparent: true, opacity: .48, depthWrite: false, roughness: .9 }));
  tag(membrane, 'Separator'); separator.add(membrane);
  for (let y = -1.35; y <= 1.35; y += .34) for (let z = -.65; z <= .65; z += .32) {
    const pore = new THREE.Mesh(new THREE.CircleGeometry(.045, 12), material(0x778783, { transparent: true, opacity: .42, side: THREE.DoubleSide, depthWrite: false }));
    pore.rotation.y = Math.PI / 2; pore.position.set(-.15, y, z); tag(pore, 'Separator'); separator.add(pore);
  }
  const separatorLabel = labelSprite('POROUS SEPARATOR'); separatorLabel.position.set(0, -2.05, 0); separator.add(separatorLabel);
  const electrolyteVolume = new THREE.Mesh(new THREE.BoxGeometry(.82, 3.4, 1.85), material(0x7399a0, { transparent: true, opacity: .08, depthWrite: false, roughness: .9 }));
  tag(electrolyteVolume, 'Electrolyte'); electrolyte.add(electrolyteVolume);
  for (let index = 0; index < 18; index += 1) {
    const solvent = atom(electrolyte, [
      -.34 + seeded(index, 60) * .68,
      -1.42 + seeded(index, 61) * 2.76,
      -.68 + seeded(index, 62) * 1.36,
    ], .045, index % 2 ? 0x8296a0 : 0xb2a37c, 'Electrolyte', { transparent: true, opacity: .62, roughness: .72 });
    solvent.userData.float = index * .22;
  }
  const electrolyteLabel = labelSprite('ELECTROLYTE-SOAKED POROUS MEMBRANE  |  Li+ CONDUCTS', '#d4e3dd', .3); electrolyteLabel.position.set(0, -2.38, 0); electrolyte.add(electrolyteLabel);

  // The positive host deliberately stays composition-neutral: alternating
  // oxygen/metal layers and Li sites communicate a layered-oxide topology.
  [-.42,-.14,.14,.42].forEach((x, index) => {
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(2.08, 1.62), material(index % 2 ? 0x6d86ae : 0xc56b5d, { transparent: true, opacity: .12, side: THREE.DoubleSide, depthWrite: false }));
    sheet.rotation.y = Math.PI / 2; sheet.position.x = x; tag(sheet, 'Positive electrode'); cathode.add(sheet);
  });
  for (let plane = -1; plane <= 1; plane += 1) {
    const oxygenPlane = new THREE.Group();
    oxygenPlane.position.x = plane * .28;
    tag(oxygenPlane, 'Positive electrode'); cathode.add(oxygenPlane);
    for (let row = -2; row <= 2; row += 1) for (let depth = -1; depth <= 1; depth += 1) {
      const y = row * .38;
      const z = (depth + (Math.abs(row) % 2) * .5) * .36;
      atom(oxygenPlane, [0, y, z], .072, C.oxygen, 'Positive electrode', { roughness: .35 });
    }
    if (plane < 1) {
      for (let row = -2; row <= 2; row += 1) for (let depth = -1; depth <= 1; depth += 1) {
        const y = row * .48 + .12;
        const z = (depth + (Math.abs(row) % 2) * .5) * .54;
        atom(cathode, [plane * .28 + .14, y, z], .105, 0x5574a5, 'Positive electrode', { roughness: .3, metalness: .2 });
      }
    }
  }
  const cathodeLiSites = [];
  for (let index = 0; index < 12; index += 1) {
    const site = new THREE.Mesh(new THREE.SphereGeometry(.08, 18, 12), material(C.lithium, { transparent: true, opacity: .32, emissive: C.lithium, emissiveIntensity: .18 }));
    const siteIndex = index;
    const siteRow = siteIndex % 6;
    const siteDepth = siteIndex % 3;
    site.position.set(-.15 + (siteIndex % 3) * .15, -1.25 + siteRow * .49, -.48 + siteDepth * .48);
    tag(site, 'Positive electrode'); cathode.add(site); cathodeLiSites.push(site);
  }
  const coo6 = new THREE.Group(); coo6.position.set(0, .05, -.92); tag(coo6, 'Positive electrode'); cathode.add(coo6);
  atom(coo6, [0, 0, 0], .13, 0x5574a5, 'Positive electrode', { roughness: .3, metalness: .2 });
  [[.28,0,0],[-.28,0,0],[0,.28,0],[0,-.28,0],[0,0,.28],[0,0,-.28]].forEach((point) => {
    atom(coo6, point, .07, C.oxygen, 'Positive electrode', { roughness: .35 });
    bond(coo6, [0,0,0], point, .018, 0x9d5b55, 'Positive electrode');
  });
  const cathodeLabel = labelSprite('IDEALIZED LAYERED-OXIDE HOST  |  O red · metal blue · Li amber'); cathodeLabel.position.set(0, -2.05, 0); cathode.add(cathodeLabel);

  const ionMeshes = [];
  for (let index = 0; index < 12; index += 1) {
    const ion = atom(g, [0, 0, 0], .105, C.lithium, 'Lithium ion', { emissive: C.lithium, emissiveIntensity: .45, roughness: .2 });
    const charge = labelSprite('Li+', '#ffd475', .18); charge.position.set(0, .22, 0); ion.add(charge);
    const metal = labelSprite('Li(s)', '#e2e5e1', .18); metal.position.set(0, .22, 0); metal.visible = false; ion.add(metal);
    charge.visible = index === 0;
    ion.userData.chargeLabel = charge; ion.userData.metalLabel = metal;
    ionMeshes.push(ion);
  }
  // The three Li(s) atoms are attached to the outer graphite sheet, not floating
  // beside it. Short links make the surface attachment explicit at teaching scale.
  platingSites.forEach((point, index) => {
    const plated = atom(plating, point, .105, 0xe5e8e3, 'Metallic lithium', { transparent: true, opacity: 0, metalness: .1, roughness: .22, emissive: 0x5f665f, emissiveIntensity: .16 });
    const link = bond(plating, [.32, point[1], point[2]], point, .022, 0xe5e8e3, 'Metallic lithium');
    link.material.transparent = true; link.material.opacity = 0;
    const neutralLabel = index === 0 ? labelSprite('Li(s)', '#e2e5e1', .2) : null;
    if (neutralLabel) { neutralLabel.position.set(0, .24, 0); plated.add(neutralLabel); plated.userData.neutralLabel = neutralLabel; }
    platedAtoms.push(plated);
    platingLinks.push(link);
  });

  const wirePoints = [new THREE.Vector3(-1.65,1.88,0), new THREE.Vector3(-1.65,2.55,0), new THREE.Vector3(0,2.82,0), new THREE.Vector3(1.65,2.55,0), new THREE.Vector3(1.65,1.88,0)];
  const wireCurve = new THREE.CatmullRomCurve3(wirePoints);
  const visibleWireSections = [
    new THREE.CatmullRomCurve3([wirePoints[0], wirePoints[1], new THREE.Vector3(-.4, 2.82, 0)]),
    new THREE.CatmullRomCurve3([new THREE.Vector3(.4, 2.82, 0), wirePoints[3], wirePoints[4]]),
  ];
  visibleWireSections.forEach((section) => {
    const wire = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(section.getPoints(32)),
      new THREE.LineDashedMaterial({ color: 0x4f5956, dashSize: .12, gapSize: .08, transparent: true, opacity: .58 }),
    );
    wire.computeLineDistances(); tag(wire, 'Electron'); circuit.add(wire);
  });
  const charger = new THREE.Group(); tag(charger, 'External charger'); circuit.add(charger);
  const chargerBody = new THREE.Mesh(new THREE.BoxGeometry(.76, .34, .16), material(0xd0d7d3, { metalness: .35, roughness: .28 }));
  chargerBody.position.set(0, 2.82, 0); tag(chargerBody, 'External charger'); charger.add(chargerBody);
  const chargerPlusVertical = new THREE.Mesh(new THREE.BoxGeometry(.04, .17, .04), material(0xb55430, { emissive: 0x6f2b1d, emissiveIntensity: .18 }));
  chargerPlusVertical.position.set(.16, 2.82, .11); tag(chargerPlusVertical, 'External charger'); charger.add(chargerPlusVertical);
  const chargerPlusHorizontal = new THREE.Mesh(new THREE.BoxGeometry(.17, .04, .04), material(0xb55430, { emissive: 0x6f2b1d, emissiveIntensity: .18 }));
  chargerPlusHorizontal.position.set(.16, 2.82, .11); tag(chargerPlusHorizontal, 'External charger'); charger.add(chargerPlusHorizontal);
  const chargerMinus = new THREE.Mesh(new THREE.BoxGeometry(.17, .045, .04), material(0x4267a8, { emissive: 0x18375f, emissiveIntensity: .18 }));
  chargerMinus.position.set(-.16, 2.82, .11); tag(chargerMinus, 'External charger'); charger.add(chargerMinus);
  const chargerLabel = labelSprite('EXTERNAL CHARGER', '#f4cb57', .2); chargerLabel.position.set(0, 3.12, 0); charger.add(chargerLabel);
  const electronMeshes = [];
  for (let index = 0; index < 8; index += 1) electronMeshes.push(atom(circuit, [0,0,0], .06, 0xf4c84c, 'Electron', { emissive: 0xf4c84c, emissiveIntensity: .8 }));
  const electronLabel = labelSprite('e- THROUGH EXTERNAL CIRCUIT', '#f4cb57', .48); electronLabel.position.set(0, 3.15, 0); circuit.add(electronLabel);
  const pairLiLabel = labelSprite('TRACKED Li+', '#ffe18b', .15); pairLiLabel.position.set(0, .24, 0); ionMeshes[0].add(pairLiLabel);
  const pairElectronLabel = labelSprite('TRACKED e-', '#ffe18b', .13); pairElectronLabel.position.set(0, .18, 0); electronMeshes[0].add(pairElectronLabel);
  const pairTrailGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(1.35, -1.25, -.48), new THREE.Vector3(.55, -1.25, 0), new THREE.Vector3(-.55, -1.25, 0), new THREE.Vector3(-1.25, -1.25, -.48)]);
  const pairTrail = new THREE.Line(
    pairTrailGeometry,
    new THREE.LineDashedMaterial({ color: 0xffd475, dashSize: .14, gapSize: .09, transparent: true, opacity: .82 }),
  );
  pairTrail.computeLineDistances(); tag(pairTrail, 'Lithium ion'); g.add(pairTrail);
  const pairLedger = labelSprite('ONE TRANSFER: Li+ THROUGH ELECTROLYTE  |  e- THROUGH WIRE', '#ffe18b', .27); pairLedger.position.set(0, 3.62, 0); g.add(pairLedger);

  const state = labelSprite('CHARGING: Li+ AND e- MOVE TO GRAPHITE', '#ffd475', .52); state.position.set(0, 3.62, 0); g.add(state);
  const platingLabel = labelSprite('ILLUSTRATIVE HIGH-RATE CONDITION: Li(s) PLATES INSTEAD OF INTERCALATING', '#f0a57f', .58); platingLabel.position.set(0, 3.62, 0); g.add(platingLabel);

  g.userData.update = (value, parameters = initialParameters) => {
    const hostFocus = THREE.MathUtils.smoothstep(value, .38, .84);
    graphite.visible = true;
    cathode.visible = true;
    separator.visible = true;
    electrolyte.visible = true;
    circuit.visible = true;
    g.scale.setScalar(.78);
    const eased = THREE.MathUtils.smoothstep(value, 0, 1);
    const rateFraction = THREE.MathUtils.clamp(((parameters.chargeRate ?? .3) - 1.4) / .3, 0, 1);
    const rateEase = rateFraction * rateFraction * (3 - 2 * rateFraction);
    const platingAmount = rateEase * THREE.MathUtils.smoothstep(value, .82, 1);
    // The cell geometry is fixed: charge transfer changes occupancy, not the
    // physical separation or dimensions of the two electrodes.
    graphite.position.x = -1.65;
    cathode.position.x = 1.65;
    graphite.scale.setScalar(1);
    cathode.scale.setScalar(1);
    graphiteLabel.visible = false;
    cathodeLabel.visible = false;
    coo6.visible = hostFocus > .01;
    coo6.scale.setScalar(1);
    electrolyteLabel.visible = false;
    separatorLabel.visible = false;
    const pairCathodeSite = new THREE.Vector3(cathode.position.x - .15, -1.25, -.48);
    const pairAnodeSite = new THREE.Vector3(graphite.position.x + .2, -1.25, -.48);
    const intercalatedCount = ionMeshes.filter((_, index) => THREE.MathUtils.clamp(eased * 1.35 - index * .025, 0, 1) >= .98).length;
    cathodeLiSites.forEach((site, index) => {
      const occupied = index < intercalatedCount;
      site.material.opacity = occupied ? .08 : .34;
      site.visible = !occupied;
    });
    ionMeshes.forEach((ion, index) => {
      const row = index % 6; const depth = index % 3;
      const cathodeSite = new THREE.Vector3(cathode.position.x - .15 + (index % 3) * .15, -1.25 + row * .49, -.48 + depth * .48);
      const anodeSite = new THREE.Vector3(graphite.position.x + .2 - (index % 3) * .15, -1.25 + row * .49, -.48 + depth * .48);
      const stagger = THREE.MathUtils.clamp(eased * 1.35 - index * .025, 0, 1);
      ion.position.copy(cathodeSite).lerp(anodeSite, stagger);
      ion.position.z += Math.sin(stagger * Math.PI) * .48;
      if (index === 0 || index >= 10) {
        const plateIndex = index === 0 ? 0 : index - 9;
        const plateTarget = new THREE.Vector3(...platingSites[plateIndex]).multiply(graphite.scale).add(graphite.position);
        ion.position.lerp(plateTarget, platingAmount);
        ion.material.color.lerpColors(new THREE.Color(C.lithium), new THREE.Color(0xc6c9c4), platingAmount);
        ion.userData.chargeLabel.visible = index === 0 && platingAmount < .48;
        ion.userData.metalLabel.visible = false;
        ion.userData.part = platingAmount >= .48 ? 'Metallic lithium' : 'Lithium ion';
      }
      ion.scale.setScalar(THREE.MathUtils.lerp(1, .72, platingAmount));
    });
    const pairMid = pairCathodeSite.clone().lerp(pairAnodeSite, .5); pairMid.z += .48;
    const pairPositions = pairTrailGeometry.attributes.position;
    [pairCathodeSite, pairCathodeSite.clone().lerp(pairMid, .5), pairAnodeSite.clone().lerp(pairMid, .5), pairAnodeSite].forEach((point, index) => pairPositions.setXYZ(index, point.x, point.y, point.z));
    pairPositions.needsUpdate = true; pairTrail.computeLineDistances();
    hostSites.forEach((site, index) => {
      const occupancy = THREE.MathUtils.clamp(intercalatedCount - platingAmount * 3 - index, 0, 1);
      site.material.opacity = THREE.MathUtils.lerp(.18, .82, occupancy);
      site.material.emissive = new THREE.Color(occupancy > .5 ? 0xe0ad42 : 0x000000);
      site.material.emissiveIntensity = occupancy * .36;
    });
    plating.visible = platingAmount > .004;
    platedAtoms.forEach((plated) => {
      plated.visible = platingAmount > .004;
      plated.scale.setScalar(THREE.MathUtils.lerp(.32, 1, platingAmount));
      plated.material.opacity = platingAmount;
      if (plated.userData.neutralLabel) plated.userData.neutralLabel.visible = platingAmount >= .48;
    });
    platingLinks.forEach((link) => { link.visible = platingAmount > .004; link.material.opacity = platingAmount; });
    ionMeshes.forEach((ion, index) => {
      const isPlatingCarrier = index === 0 || index >= 10;
      ion.visible = !isPlatingCarrier || platingAmount < .996;
      ion.material.transparent = isPlatingCarrier;
      ion.material.opacity = isPlatingCarrier ? 1 - platingAmount : 1;
    });
    electronMeshes.forEach((electron, index) => electron.position.copy(wireCurve.getPoint((1 - eased + index / electronMeshes.length) % 1)));
    pairTrail.visible = value > .03 && value < .97;
    chargerLabel.visible = true;
    electronLabel.visible = false;
    pairLedger.visible = false;
    state.visible = false; platingLabel.visible = false;
  };
  g.userData.update(progress, initialParameters); g.position.y = -.12; g.rotation.set(.1, -.18, 0); return g;
}

function snowflakeExhibit(progress, initialParameters = {}) {
  const g = new THREE.Group();
  const plate = new THREE.Group(); const column = new THREE.Group(); const vapour = new THREE.Group();
  g.add(plate, column, vapour);
  const cells = [];
  const hexRadius = .145;
  const axialPosition = (q, r) => [hexRadius * 1.74 * (q + r * .5), hexRadius * 1.5 * r, 0];
  for (let q = -11; q <= 11; q += 1) for (let r = -11; r <= 11; r += 1) {
    const s = -q - r; const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
    if (distance > 11) continue;
    const position = axialPosition(q, r);
    const angle = Math.atan2(position[1], position[0]);
    const axisDistance = Math.min(...Array.from({ length: 6 }, (_, index) => Math.abs(Math.sin(angle - index * Math.PI / 3)) * Math.max(distance, .01)));
    const arm = Math.exp(-axisDistance * 1.8);
    const branchRank = distance + (1 - arm) * 1.8;
    const cell = new THREE.Mesh(new THREE.CylinderGeometry(hexRadius, hexRadius, .07, 6), material(0x91c9d2, {
      transparent: true, opacity: .9, roughness: .32, emissive: 0x315f68, emissiveIntensity: .08,
    }));
    cell.rotation.x = Math.PI / 2; cell.position.set(...position);
    tag(cell, distance < 2 ? 'Hexagonal lattice' : arm > .58 ? 'Branch' : 'Facet'); plate.add(cell);
    cells.push({ cell, distance, arm, branchRank });
  }

  // A local molecular motif sits beside the crystal-scale model. Its dashed
  // links carry the hydrogen-bond idea without inventing a physical boundary.
  const inset = new THREE.Group(); inset.position.set(-.1, -.78, .42); plate.add(inset);
  const networkContact = (a, b) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
    const line = new THREE.Line(geometry, new THREE.LineDashedMaterial({ color: 0xd8bd66, dashSize: .045, gapSize: .032, transparent: true, opacity: .76 }));
    line.computeLineDistances(); tag(line, 'Hydrogen bond'); inset.add(line); return line;
  };
  const addWater = (parent, oxygenPosition, rotation, scale, part) => {
    const water = new THREE.Group(); water.position.copy(oxygenPosition); water.rotation.z = rotation; water.scale.setScalar(scale); parent.add(water);
    atom(water, [0, 0, 0], .07, 0x70b6c2, part, { roughness: .38, emissive: 0x315f68, emissiveIntensity: .12 });
    const hydrogens = [[-.12, .1, .035], [.12, .1, -.035]];
    hydrogens.forEach((hydrogen) => {
      atom(water, hydrogen, .035, 0xe8f0ed, part, { roughness: .58 });
      bond(water, [0, 0, 0], hydrogen, .014, 0xd9e5e2, part);
    });
    return water;
  };
  const ringOxygens = Array.from({ length: 6 }, (_, index) => {
    const angle = index * Math.PI / 3;
    return new THREE.Vector3(Math.cos(angle) * .34, Math.sin(angle) * .34, index % 2 ? .11 : -.11);
  });
  ringOxygens.forEach((point, index) => addWater(inset, point, index * Math.PI / 3 + .4, .9, 'Hexagonal lattice'));
  ringOxygens.forEach((point, index) => networkContact(point, ringOxygens[(index + 1) % ringOxygens.length]));
  const insetLabel = labelSprite('MAGNIFIED ICE-Ih-LIKE WATER RING  |  O cyan · H white · dashed H bonds', '#c8e8ea', .21);
  insetLabel.position.set(0, -.9, 0); inset.add(insetLabel);

  const prism = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 2.1, 6), material(0xa4d7df, {
    transparent: true, opacity: .82, roughness: .38, emissive: 0x3d8792, emissiveIntensity: .08,
  }));
  prism.rotation.x = Math.PI / 2; prism.position.z = .06; tag(prism, 'Facet'); column.add(prism);
  const prismEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(.42, .42, 2.1, 6)), new THREE.LineBasicMaterial({ color: 0xd5f1ef, transparent: true, opacity: .45 }));
  prismEdges.rotation.x = Math.PI / 2; prismEdges.position.z = .06; tag(prismEdges, 'Facet'); column.add(prismEdges);

  const vapourWaters = [];
  for (let index = 0; index < 22; index += 1) {
    const angle = index * 2.399963; const radius = 2.45 + seeded(index, 2) * .85;
    const source = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, seeded(index, 3) * .32 - .18);
    const water = addWater(vapour, source, angle + Math.PI, .56, 'Hydrogen bond');
    water.userData.source = source.clone(); water.userData.angle = angle; water.userData.offset = seeded(index, 4);
    vapourWaters.push(water);
  }
  const tipTracks = [];
  for (let index = 0; index < 18; index += 1) {
    const angle = (index % 6) * Math.PI / 3 + (seeded(index, 5) - .5) * .13;
    const particle = atom(g, [Math.cos(angle) * 2.55, Math.sin(angle) * 2.55, .2], .026, 0x7ab9c5, 'Branch', { transparent: true, opacity: .42, emissive: 0x4f8790, emissiveIntensity: .2 });
    particle.userData.angle = angle; particle.userData.radius = 2.55 + Math.floor(index / 6) * .28; tipTracks.push(particle);
  }
  const habitLabels = ['REPRESENTATIVE COLUMN / NEEDLE REGIME', 'REPRESENTATIVE PLATE REGIME', 'REPRESENTATIVE DENDRITIC-PLATE REGIME'].map((text) => {
    const item = labelSprite(text, '#c5eaee', .25); item.position.set(0, 2.12, .2); g.add(item); return item;
  });
  g.userData.update = (value, parameters = initialParameters) => {
    const temperature = parameters.temperature ?? -15; const saturation = parameters.saturation ?? .18;
    const columnHabit = (temperature > -9 && temperature <= -4) || temperature <= -22;
    const dendritic = !columnHabit && saturation > .14;
    const effectiveGrowth = THREE.MathUtils.clamp(value * (.72 + saturation * 1.2), 0, 1);
    column.visible = columnHabit;
    plate.visible = !columnHabit;
    // The cylinder's local Y axis is its length. It becomes the crystal axis
    // after rotation, so scale that axis rather than squeezing one side face.
    prism.scale.set(1, Math.max(.06, effectiveGrowth), 1);
    prismEdges.scale.copy(prism.scale);
    cells.forEach(({ cell, distance, arm, branchRank }) => {
      const target = dendritic ? branchRank / (4.3 + saturation * 8 * arm) : distance / (5.2 + saturation * 2.3);
      const amount = THREE.MathUtils.smoothstep(effectiveGrowth, target - .08, target + .08);
      cell.visible = value > .12 && amount > .22;
      // Hexagonal cells grow across the basal plane; scaling only one radius
      // created the flat cyan bars previously visible around the arms.
      cell.scale.set(amount, 1, amount);
      cell.material.color.set(dendritic && arm > .58 ? 0x70b8c9 : 0x9dced5);
      cell.material.emissiveIntensity = dendritic && arm > .58 ? .16 : .08;
    });
    vapourWaters.forEach((water, index) => {
      const capture = THREE.MathUtils.clamp(value * 1.17 - index * .025, 0, 1);
      const targetRadius = 1.95 + (index % 6 === 0 && dendritic ? .48 : 0);
      const target = new THREE.Vector3(Math.cos(water.userData.angle) * targetRadius, Math.sin(water.userData.angle) * targetRadius, .02);
      water.position.copy(water.userData.source).lerp(target, capture);
      water.visible = value > .04 && capture < .98;
      water.scale.setScalar(.56 * (1 - capture * .16));
    });
    tipTracks.forEach((particle, index) => {
      const inward = THREE.MathUtils.smoothstep(value, .32 + (index % 3) * .05, .9);
      particle.position.set(Math.cos(particle.userData.angle) * (particle.userData.radius - inward * .6), Math.sin(particle.userData.angle) * (particle.userData.radius - inward * .6), .2);
      particle.visible = dendritic && value > .28;
    });
    inset.visible = value < .2;
    inset.scale.setScalar(columnHabit ? .82 : 1);
    insetLabel.visible = false;
    habitLabels.forEach((item) => { item.visible = false; });
  };
  g.userData.update(progress, initialParameters); g.scale.setScalar(.9); g.rotation.set(.62, .08, .08); return g;
}

function catalystExhibit(progress) {
  const g = new THREE.Group();
  const monolith = new THREE.Group(); const washcoat = new THREE.Group(); const atomicSurface = new THREE.Group();
  g.add(monolith, washcoat, atomicSurface);
  const channelWall = material(0x9d947f, { roughness: .94, metalness: 0, side: THREE.DoubleSide });
  const channelInterior = material(0x393b36, { roughness: 1, metalness: 0, side: THREE.DoubleSide });
  const selectedWallMaterial = material(0xc3a76c, { roughness: .76, metalness: 0, emissive: 0x5c451d, emissiveIntensity: .12, side: THREE.DoubleSide });
  // Keep Pt bright under the neutral studio lighting. Highly metallic materials
  // without an environment map read as black, obscuring the surface lattice.
  const pt = { metalness: .28, roughness: .3 };
  const channelDepth = .62;
  const channelCenters = [[0, 0], [.52, 0], [-.52, 0], [.26, .45], [-.26, .45], [.26, -.45], [-.26, -.45]];
  const hexPoints = (radius) => Array.from({ length: 6 }, (_, index) => {
    const angle = Math.PI / 6 + index * Math.PI / 3;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
  const innerHexPoints = hexPoints(.235);
  const selectedChannelIndex = 0;
  const selectedStripFaceIndex = 0;
  const selectedChannelCenter = new THREE.Vector3(...channelCenters[selectedChannelIndex], 0);
  const selectedFaceStart = innerHexPoints[selectedStripFaceIndex];
  const selectedFaceEnd = innerHexPoints[(selectedStripFaceIndex + 1) % innerHexPoints.length];
  const selectedFaceCentre = new THREE.Vector3(
    selectedChannelCenter.x + (selectedFaceStart[0] + selectedFaceEnd[0]) / 2,
    selectedChannelCenter.y + (selectedFaceStart[1] + selectedFaceEnd[1]) / 2,
    0,
  );
  // This offset places the amber patch just inside the channel, on the actual
  // hexagonal inner face rather than on a mismatched circular surface.
  const selectedFaceInset = selectedFaceCentre.clone().normalize().multiplyScalar(-.004);
  const selectedWallAnchor = selectedFaceCentre.clone().add(selectedFaceInset).setZ(-channelDepth * .48);
  const wallSurfaceNormal = selectedFaceInset.clone().normalize();
  const wallAxis = new THREE.Vector3(0, 0, 1);
  const wallTangent = wallAxis.clone().cross(wallSurfaceNormal).normalize();
  const wallSurfaceFrame = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(wallTangent, wallAxis, wallSurfaceNormal),
  );
  const honeycombOutline = [[-.98,-.84],[.98,-.84],[1.08,-.32],[1.08,.32],[.7,.91],[-.7,.91],[-1.08,.32],[-1.08,-.32]];
  const honeycombShape = () => {
    const shape = new THREE.Shape(); shape.moveTo(...honeycombOutline[0]); honeycombOutline.slice(1).forEach((point) => shape.lineTo(...point)); shape.lineTo(...honeycombOutline[0]);
    channelCenters.forEach(([x, y]) => {
      const holePoints = innerHexPoints.map(([px, py]) => [x + px, y + py]).reverse();
      const hole = new THREE.Path(); hole.moveTo(...holePoints[0]); holePoints.slice(1).forEach((point) => hole.lineTo(...point)); hole.lineTo(...holePoints[0]); shape.holes.push(hole);
    });
    return shape;
  };
  const makeSelectedWallStrip = () => {
    const bottom = -channelDepth * .86; const top = -channelDepth * .1;
    const vertices = [
      selectedChannelCenter.x + selectedFaceStart[0] + selectedFaceInset.x, selectedChannelCenter.y + selectedFaceStart[1] + selectedFaceInset.y, bottom,
      selectedChannelCenter.x + selectedFaceEnd[0] + selectedFaceInset.x, selectedChannelCenter.y + selectedFaceEnd[1] + selectedFaceInset.y, bottom,
      selectedChannelCenter.x + selectedFaceEnd[0] + selectedFaceInset.x, selectedChannelCenter.y + selectedFaceEnd[1] + selectedFaceInset.y, top,
      selectedChannelCenter.x + selectedFaceStart[0] + selectedFaceInset.x, selectedChannelCenter.y + selectedFaceStart[1] + selectedFaceInset.y, top,
    ];
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex([0, 1, 2, 0, 2, 3]); geometry.computeVertexNormals();
    return geometry;
  };
  const addChannelBack = (parent, [x, y], selected = false) => {
    const farWall = new THREE.Mesh(new THREE.CircleGeometry(.235, 6), channelInterior);
    farWall.rotation.z = Math.PI / 6; farWall.position.set(x, y, -channelDepth + .008); tag(farWall, 'Honeycomb'); parent.add(farWall);
    if (!selected) return;
    const wallStrip = new THREE.Mesh(makeSelectedWallStrip(), selectedWallMaterial);
    tag(wallStrip, 'Selected channel wall'); parent.add(wallStrip);
  };
  const addHexLayer = (parent, rings, z, offset, color, radius = .04, spacing = .11, part = 'Metal site') => {
    for (let q = -rings; q <= rings; q += 1) for (let r = -rings; r <= rings; r += 1) {
      if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) > rings) continue;
      const x = offset[0] + (q + r * .5) * spacing;
      const y = offset[1] + r * spacing * .866;
      atom(parent, [x, y, z], radius, color, part, pt);
    }
  };

  const monolithBlock = new THREE.Mesh(new THREE.ExtrudeGeometry(honeycombShape(), { depth: channelDepth, bevelEnabled: false, curveSegments: 1 }), channelWall);
  monolithBlock.position.z = -channelDepth; tag(monolithBlock, 'Honeycomb'); monolith.add(monolithBlock);
  channelCenters.forEach((center, index) => addChannelBack(monolith, center, index === selectedChannelIndex));

  // An irregular extruded oxide patch with real holes conveys porous washcoat
  // morphology without turning the coating into a regular honeycomb or disk.
  const oxideOutline = [[-.73,-.31],[-.58,-.62],[-.18,-.75],[.27,-.66],[.65,-.42],[.76,-.02],[.59,.47],[.25,.68],[-.23,.73],[-.64,.49],[-.78,.06]];
  const backingPatch = new THREE.Shape();
  backingPatch.moveTo(...oxideOutline[0]); backingPatch.lineTo(...oxideOutline[0]); oxideOutline.slice(1).forEach((point) => backingPatch.lineTo(...point)); backingPatch.lineTo(...oxideOutline[0]);
  const backingMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(backingPatch, { depth: .035, bevelEnabled: true, bevelThickness: .008, bevelSize: .007, bevelSegments: 1, curveSegments: 14 }), material(0x726b5d, { roughness: .98 }));
  backingMesh.position.z = -.092; tag(backingMesh, 'Selected channel wall'); washcoat.add(backingMesh);
  // Faint neighbouring faces keep the magnified coating legible as one wall of
  // a hexagonal channel rather than an isolated planar sample.
  const foldedWallRails = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-.7,-.62,-.065), new THREE.Vector3(-.7,.62,-.065),
      new THREE.Vector3(.7,-.62,-.065), new THREE.Vector3(.7,.62,-.065),
      new THREE.Vector3(-.7,-.62,-.065), new THREE.Vector3(-.92,-.62,.25),
      new THREE.Vector3(-.7,.62,-.065), new THREE.Vector3(-.92,.62,.25),
      new THREE.Vector3(-.92,-.62,.25), new THREE.Vector3(-.92,.62,.25),
      new THREE.Vector3(.7,-.62,-.065), new THREE.Vector3(.92,-.62,.25),
      new THREE.Vector3(.7,.62,-.065), new THREE.Vector3(.92,.62,.25),
      new THREE.Vector3(.92,-.62,.25), new THREE.Vector3(.92,.62,.25),
    ]),
    new THREE.LineBasicMaterial({ color: 0x9b947f, transparent: true, opacity: .3, depthWrite: false }),
  );
  tag(foldedWallRails, 'Selected channel wall'); washcoat.add(foldedWallRails);
  const oxidePatch = new THREE.Shape();
  oxidePatch.moveTo(...oxideOutline[0]); oxideOutline.slice(1).forEach((point) => oxidePatch.lineTo(...point)); oxidePatch.lineTo(...oxideOutline[0]);
  [[-.42,.44,.055,.04],[-.07,.45,.07,.045],[.36,.43,.05,.07],[.52,.06,.075,.05],[.39,-.22,.055,.075],[-.4,-.19,.07,.05],[-.17,-.5,.05,.07],[.2,-.45,.065,.045],[-.55,.08,.05,.07]].forEach(([x, y, rx, ry]) => {
    const pore = new THREE.Path(); pore.absellipse(x, y, rx, ry, 0, Math.PI * 2, false, 0); oxidePatch.holes.push(pore);
  });
  const oxideMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(oxidePatch, { depth: .09, bevelEnabled: true, bevelThickness: .014, bevelSize: .012, bevelSegments: 1, curveSegments: 14 }), material(0xa39a88, { roughness: .97 }));
  oxideMesh.position.z = -.055; tag(oxideMesh, 'Washcoat'); washcoat.add(oxideMesh);
  const washcoatOutline = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(oxideOutline.map(([x, y]) => new THREE.Vector3(x, y, .1))),
    new THREE.LineBasicMaterial({ color: 0xc3a76c, transparent: true, opacity: .9, depthWrite: false }),
  );
  tag(washcoatOutline, 'Washcoat'); washcoat.add(washcoatOutline);
  [[-.32,.24], [.08,-.29]].forEach(([x, y]) => {
    [[0,0],[.055,.012],[-.018,.05]].forEach(([dx, dy], index) => atom(washcoat, [x + dx, y + dy, .065 + index * .005], .028, index === 1 ? 0xe2e7e4 : 0xc3cece, 'Metal site', { ...pt, transparent: true, opacity: .42 }));
  });
  const atomicInitialScale = .32;
  const atomicBaseLayerHeight = .06;
  const selectedParticleAnchor = new THREE.Vector3(.23, .2, .05);
  const wallParticleAnchor = selectedWallAnchor.clone().add(selectedParticleAnchor.clone().applyQuaternion(wallSurfaceFrame));
  const wallAtomicAnchor = wallParticleAnchor.clone().sub(
    new THREE.Vector3(0, 0, atomicBaseLayerHeight * atomicInitialScale).applyQuaternion(wallSurfaceFrame),
  );
  const selectedParticle = new THREE.Group(); selectedParticle.position.copy(selectedParticleAnchor); tag(selectedParticle, 'Selected Pt nanoparticle'); washcoat.add(selectedParticle);
  // These positions and radii are the atomistic particle scaled by .32, so
  // the selected washcoat particle resolves without changing shape or height.
  addHexLayer(selectedParticle, 3, .0, [0,0], 0x677274, .013, .045, 'Selected Pt nanoparticle');
  addHexLayer(selectedParticle, 3, .029, [.022,.013], 0x98a1a1, .014, .045, 'Selected Pt nanoparticle');
  addHexLayer(selectedParticle, 2, .061, [0,0], 0xe2e7e4, .015, .045, 'Pt(111) terrace');
  const particleHalo = new THREE.Mesh(new THREE.RingGeometry(.17, .2, 6), material(0xc3a76c, { transparent: true, opacity: .92, emissive: 0x7b5718, emissiveIntensity: .22, side: THREE.DoubleSide, depthWrite: false }));
  particleHalo.position.z = .078; tag(particleHalo, 'Selected Pt nanoparticle'); selectedParticle.add(particleHalo);
  const particleFacetHalo = new THREE.Mesh(new THREE.RingGeometry(.1, .124, 6), material(0xc3a76c, { transparent: true, opacity: .78, emissive: 0x7b5718, emissiveIntensity: .18, side: THREE.DoubleSide, depthWrite: false }));
  particleFacetHalo.position.z = .079; tag(particleFacetHalo, 'Pt(111) terrace'); selectedParticle.add(particleFacetHalo);
  // The washcoat and its particle remain attached to the marked inner wall.
  // The camera, rather than the particle, pivots to the facet inspection view.
  washcoat.quaternion.copy(wallSurfaceFrame);

  // A single, finite Pt particle is retained from approach through desorption.
  // The top layer is an idealized (111)-like terrace; the lower layers give the
  // terrace a particle context without changing atoms halfway through the cycle.
  const surfaceLattice = new THREE.Group(); const particleContext = new THREE.Group(); const reaction = new THREE.Group();
  atomicSurface.add(particleContext, surfaceLattice, reaction);
  addHexLayer(surfaceLattice, 3, .06, [0,0], 0x657174, .04, .14, 'Selected Pt nanoparticle');
  addHexLayer(surfaceLattice, 3, .15, [.07,.04], 0x939d9d, .043, .14, 'Selected Pt nanoparticle');
  addHexLayer(surfaceLattice, 2, .25, [0,0], 0xd8dfda, .047, .14, 'Pt(111) terrace');
  const particleOutline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.CylinderGeometry(.52, .38, .34, 6)),
    new THREE.LineBasicMaterial({ color: 0x9ca7a4, transparent: true, opacity: .46, depthWrite: false }),
  );
  particleOutline.rotation.x = Math.PI / 2; particleOutline.position.z = .16; tag(particleOutline, 'Selected Pt nanoparticle'); particleContext.add(particleOutline);
  const facetPoints = Array.from({ length: 6 }, (_, index) => {
    const angle = index * Math.PI / 3 + Math.PI / 6;
    return new THREE.Vector3(Math.cos(angle) * .34, Math.sin(angle) * .34, .325);
  });
  const facetOutline = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(facetPoints), new THREE.LineBasicMaterial({ color: 0xc3a76c, transparent: true, opacity: .9, depthWrite: false }));
  tag(facetOutline, 'Pt(111) terrace'); particleContext.add(facetOutline);

  const setGroupOpacity = (group, opacity) => {
    group.visible = opacity > .004;
    group.traverse((object) => {
      if (!object.material) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((item) => {
        if (item.userData.catalystBaseOpacity === undefined) {
          item.userData.catalystBaseOpacity = item.opacity;
          item.transparent = true;
        }
        item.opacity = item.userData.catalystBaseOpacity * opacity;
      });
    });
  };
  const reactiveAtom = (color, radius) => {
    const mesh = atom(reaction, [0,0,0], radius, color, 'Adsorbed molecule', { transparent: true, roughness: .28 });
    mesh.visible = false;
    return mesh;
  };
  const placeAtom = (mesh, position, opacity) => {
    mesh.position.copy(position);
    mesh.visible = opacity > .004;
    mesh.material.opacity = opacity;
  };
  const dynamicBond = (color, radius = .018) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 14), material(color, { transparent: true, roughness: .3 }));
    mesh.visible = false; tag(mesh, 'Adsorbed molecule'); reaction.add(mesh);
    return (from, to, opacity) => {
      const direction = to.clone().sub(from); const length = direction.length();
      mesh.visible = opacity > .004 && length > .001;
      mesh.position.copy(from).add(to).multiplyScalar(.5);
      mesh.scale.set(1, length, 1);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      mesh.material.opacity = opacity;
    };
  };

  const dynamicDoubleBond = (color, radius = .01, separation = .027) => {
    const first = dynamicBond(color, radius); const second = dynamicBond(color, radius);
    const offset = new THREE.Vector3(); const axis = new THREE.Vector3(0, 0, 1);
    return (from, to, opacity) => {
      const direction = to.clone().sub(from).normalize();
      offset.crossVectors(direction, axis);
      if (offset.lengthSq() < .001) offset.crossVectors(direction, new THREE.Vector3(0, 1, 0));
      offset.normalize().multiplyScalar(separation / 2);
      first(from.clone().add(offset), to.clone().add(offset), opacity);
      second(from.clone().sub(offset), to.clone().sub(offset), opacity);
    };
  };
  const dynamicTripleBond = (color, radius = .008, separation = .028) => {
    const centre = dynamicBond(color, radius); const outer = dynamicDoubleBond(color, radius, separation);
    return (from, to, opacity) => { centre(from, to, opacity); outer(from, to, opacity); };
  };

  // Gold rings mark vacant Pt sites without being confused for reaction atoms.
  const coSurfacePt = [new THREE.Vector3(-.21, .121, .29), new THREE.Vector3(.21, .121, .29)];
  const oxygenHollowSites = [new THREE.Vector3(-.07, -.04, .43), new THREE.Vector3(.07, -.04, .43)];
  const oxygenHollowPtA = [new THREE.Vector3(-.14, 0, .29), new THREE.Vector3(0, 0, .29), new THREE.Vector3(-.07, -.121, .29)];
  const oxygenHollowPtB = [new THREE.Vector3(0, 0, .29), new THREE.Vector3(.14, 0, .29), new THREE.Vector3(.07, -.121, .29)];
  const sitePositions = [
    ...coSurfacePt.map((position) => position.clone().add(new THREE.Vector3(0, 0, .012))),
    ...oxygenHollowSites.map((position) => position.clone().setZ(.312)),
  ];
  const siteMarkers = sitePositions.map((position) => {
    const marker = new THREE.Mesh(new THREE.RingGeometry(.066, .082, 24), material(0xc7a24d, { transparent: true, opacity: 0, emissive: 0x7b5718, emissiveIntensity: .32, depthWrite: false, side: THREE.DoubleSide }));
    marker.visible = false; marker.position.copy(position).add(new THREE.Vector3(0, 0, .012)); tag(marker, 'Metal site'); reaction.add(marker); return marker;
  });

  const coACarbon = reactiveAtom(C.carbon, .052); const coAOxygen = reactiveAtom(C.oxygen, .06);
  const coBCarbon = reactiveAtom(C.carbon, .052); const coBOxygen = reactiveAtom(C.oxygen, .06);
  const oxygenA = reactiveAtom(C.oxygen, .06); const oxygenB = reactiveAtom(C.oxygen, .06);
  const coABond = dynamicTripleBond(0x45504d); const coBBond = dynamicTripleBond(0x45504d);
  const ooBond = dynamicDoubleBond(0xb74742, .011, .03);
  const weakOOBond = dynamicBond(0xb74742, .013);
  const productCOBondAOriginal = dynamicDoubleBond(0x45504d); const productCOBondAAdded = dynamicDoubleBond(0x45504d);
  const productCOBondBOriginal = dynamicDoubleBond(0x45504d); const productCOBondBAdded = dynamicDoubleBond(0x45504d);
  const coSurfaceBondA = dynamicBond(0xb58b3b, .012); const coSurfaceBondB = dynamicBond(0xb58b3b, .012);
  const oBridgeBondA = dynamicBond(0xb58b3b, .009); const oBridgeBondB = dynamicBond(0xb58b3b, .009);
  const oHollowBondsA = oxygenHollowPtA.map(() => dynamicBond(0xb58b3b, .008));
  const oHollowBondsB = oxygenHollowPtB.map(() => dynamicBond(0xb58b3b, .008));
  const dynamicTrace = () => {
    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const trace = new THREE.Line(geometry, new THREE.LineDashedMaterial({ color: 0x5aa8a0, dashSize: .045, gapSize: .028, transparent: true, opacity: 0 }));
    trace.visible = false; tag(trace, 'Adsorbed molecule'); reaction.add(trace);
    return (from, to, opacity) => {
      trace.visible = opacity > .004;
      geometry.attributes.position.setXYZ(0, from.x, from.y, from.z);
      geometry.attributes.position.setXYZ(1, to.x, to.y, to.z);
      geometry.attributes.position.needsUpdate = true; trace.computeLineDistances();
      trace.material.opacity = opacity;
    };
  };
  const oxygenTraceA = dynamicTrace(); const oxygenTraceB = dynamicTrace();

  const coAStart = new THREE.Vector3(-.48,.18,1.24); const coBStart = new THREE.Vector3(.48,.18,1.3);
  const coASite = new THREE.Vector3(-.21,.121,.52); const coBSite = new THREE.Vector3(.21,.121,.52);
  const o2AStart = new THREE.Vector3(-.12,-.24,1.42); const o2BStart = new THREE.Vector3(.12,-.24,1.42);
  const o2ABridge = new THREE.Vector3(-.12,-.04,.64); const o2BBridge = new THREE.Vector3(.12,-.04,.64);
  const oASite = oxygenHollowSites[0]; const oBSite = oxygenHollowSites[1];
  const coUpright = new THREE.Vector3(0,.015,.18);
  const productACentre = new THREE.Vector3(-.24,.04,.66); const productBCentre = new THREE.Vector3(.24,.04,.66);
  const productAOriginalO = new THREE.Vector3(.13,0,0); const productAAddedO = new THREE.Vector3(-.13,0,0);
  const productBOriginalO = new THREE.Vector3(-.13,0,0); const productBAddedO = new THREE.Vector3(.13,0,0);
  const productALift = new THREE.Vector3(-.46,.18,.74); const productBLift = new THREE.Vector3(.34,-.16,.92);
  const terraceFocus = wallAtomicAnchor.clone().add(new THREE.Vector3(0, 0, .25).applyQuaternion(wallSurfaceFrame));
  const reactionFocus = terraceFocus.clone().addScaledVector(wallSurfaceNormal, .42);
  const faceOnOffset = wallSurfaceNormal.clone().multiplyScalar(3).addScaledVector(wallAxis, 1.25);
  const terraceOffset = wallSurfaceNormal.clone().multiplyScalar(2.9).addScaledVector(wallAxis, .95);
  const reactionOffset = wallSurfaceNormal.clone().multiplyScalar(3.4).addScaledVector(wallAxis, 1.2);

  g.userData.reactionEquation = '2 CO(g) + O2(g)  ->  2 CO2(g)';
  g.userData.cameraStops = [
    { progress: .04, target: [0,0,-.3], offset: [3.0,2.7,6.8] },
    { progress: .3, target: selectedWallAnchor.toArray(), offset: faceOnOffset.toArray() },
    { progress: .66, target: terraceFocus.toArray(), offset: terraceOffset.toArray() },
    { progress: 1, target: reactionFocus.toArray(), offset: reactionOffset.toArray() },
  ];
  g.userData.update = (value) => {
    // This is a nested magnification path: one amber channel-wall strip grows
    // into its washcoat patch, then one supported Pt particle grows into its top facet.
    const channelToWashcoat = THREE.MathUtils.smoothstep(value, .06, .34);
    const washcoatToParticle = THREE.MathUtils.smoothstep(value, .38, .66);
    washcoat.scale.setScalar(THREE.MathUtils.lerp(.2, 1, channelToWashcoat));
    washcoat.position.copy(selectedWallAnchor);
    atomicSurface.scale.setScalar(THREE.MathUtils.lerp(atomicInitialScale, 1, washcoatToParticle));
    atomicSurface.position.copy(wallAtomicAnchor);
    atomicSurface.quaternion.copy(wallSurfaceFrame);
    const monolithOpacity = 1 - THREE.MathUtils.smoothstep(value, .12, .27);
    const washcoatOpacity = THREE.MathUtils.smoothstep(value, .1, .32) * (1 - THREE.MathUtils.smoothstep(value, .46, .6));
    const surfaceOpacity = THREE.MathUtils.smoothstep(value, .46, .66);
    setGroupOpacity(monolith, monolithOpacity);
    setGroupOpacity(washcoat, washcoatOpacity);
    setGroupOpacity(surfaceLattice, surfaceOpacity);
    setGroupOpacity(particleContext, surfaceOpacity);

    // Idealized Langmuir-Hinshelwood teaching sequence: approach, adsorption,
    // O2 dissociation, C-O formation, then desorption. The same atom meshes are
    // moved throughout, so C and O conservation is visually traceable.
    const reactantOpacity = surfaceOpacity * THREE.MathUtils.smoothstep(value, .68, .72);
    const molecularOxygen = THREE.MathUtils.smoothstep(value, .72, .79);
    const oxygenAnchored = THREE.MathUtils.smoothstep(value, .775, .79);
    const adsorption = THREE.MathUtils.smoothstep(value, .8, .85);
    const dissociation = THREE.MathUtils.smoothstep(value, .85, .9);
    const formation = THREE.MathUtils.smoothstep(value, .9, .95);
    const departure = THREE.MathUtils.smoothstep(value, .95, 1);

    siteMarkers.forEach((marker, index) => {
      const occupancy = (index < 2 ? adsorption : oxygenAnchored) * (1 - departure);
      const markerOpacity = surfaceOpacity * (1 - occupancy) * .84;
      marker.visible = markerOpacity > .004;
      marker.material.opacity = markerOpacity;
    });

    const cAAdsorbed = coAStart.clone().lerp(coASite, adsorption);
    const cBAdsorbed = coBStart.clone().lerp(coBSite, adsorption);
    const oAAdsorbed = cAAdsorbed.clone().add(coUpright);
    const oBAdsorbed = cBAdsorbed.clone().add(coUpright);
    const o2AMolecular = o2AStart.clone().lerp(o2ABridge, molecularOxygen);
    const o2BMolecular = o2BStart.clone().lerp(o2BBridge, molecularOxygen);
    const o2AAdsorbed = o2AMolecular.clone().lerp(oASite, dissociation);
    const o2BAdsorbed = o2BMolecular.clone().lerp(oBSite, dissociation);
    const productA = cAAdsorbed.clone().lerp(productACentre, formation).addScaledVector(productALift, departure);
    const productB = cBAdsorbed.clone().lerp(productBCentre, formation).addScaledVector(productBLift, departure);
    const coAOriginalO = oAAdsorbed.clone().lerp(productACentre.clone().add(productAOriginalO), formation).addScaledVector(productALift, departure);
    const coBOriginalO = oBAdsorbed.clone().lerp(productBCentre.clone().add(productBOriginalO), formation).addScaledVector(productBLift, departure);
    const productAOxygen = o2AAdsorbed.clone().lerp(productACentre.clone().add(productAAddedO), formation).addScaledVector(productALift, departure);
    const productBOxygen = o2BAdsorbed.clone().lerp(productBCentre.clone().add(productBAddedO), formation).addScaledVector(productBLift, departure);

    placeAtom(coACarbon, productA, reactantOpacity); placeAtom(coAOxygen, coAOriginalO, reactantOpacity);
    placeAtom(coBCarbon, productB, reactantOpacity); placeAtom(coBOxygen, coBOriginalO, reactantOpacity);
    placeAtom(oxygenA, productAOxygen, reactantOpacity); placeAtom(oxygenB, productBOxygen, reactantOpacity);
    coABond(productA, coAOriginalO, reactantOpacity * (1 - formation)); coBBond(productB, coBOriginalO, reactantOpacity * (1 - formation));
    ooBond(productAOxygen, productBOxygen, reactantOpacity * (1 - oxygenAnchored) * (1 - dissociation));
    weakOOBond(productAOxygen, productBOxygen, reactantOpacity * oxygenAnchored * (1 - dissociation) * .74);
    productCOBondAOriginal(productA, coAOriginalO, reactantOpacity * formation); productCOBondAAdded(productA, productAOxygen, reactantOpacity * formation);
    productCOBondBOriginal(productB, coBOriginalO, reactantOpacity * formation); productCOBondBAdded(productB, productBOxygen, reactantOpacity * formation);
    const surfaceBondOpacity = reactantOpacity * adsorption * (1 - formation);
    coSurfaceBondA(productA, coSurfacePt[0], surfaceBondOpacity); coSurfaceBondB(productB, coSurfacePt[1], surfaceBondOpacity);
    const bridgeBondOpacity = reactantOpacity * oxygenAnchored * (1 - dissociation) * .55;
    oBridgeBondA(productAOxygen, oxygenHollowPtA[0], bridgeBondOpacity);
    oBridgeBondB(productBOxygen, oxygenHollowPtB[1], bridgeBondOpacity);
    const hollowBondOpacity = reactantOpacity * dissociation * (1 - formation) * .58;
    oHollowBondsA.forEach((bond, index) => bond(productAOxygen, oxygenHollowPtA[index], hollowBondOpacity));
    oHollowBondsB.forEach((bond, index) => bond(productBOxygen, oxygenHollowPtB[index], hollowBondOpacity));
    const traceOpacity = reactantOpacity * formation * (1 - THREE.MathUtils.smoothstep(value, .985, 1));
    oxygenTraceA(oASite, productAOxygen, traceOpacity); oxygenTraceB(oBSite, productBOxygen, traceOpacity);
  };
  g.userData.update(progress); return g;
}

function electrochemExhibit(progress, initialParameters = {}) {
  const g = new THREE.Group(); const left = -1.5; const right = 1.5;
  const scatterPoint = (index, center, salt) => {
    const angle = seeded(index, salt) * Math.PI * 2; const radius = Math.sqrt(seeded(index, salt + 1)) * .72;
    return new THREE.Vector3(center + Math.cos(angle) * radius, -1.42 + seeded(index, salt + 2) * 1.18, Math.sin(angle) * radius * .7);
  };
  const setOpacity = (object, opacity) => object.traverse((child) => {
    if (!child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((item) => {
      if (item.userData.eventBaseOpacity === undefined) {
        item.userData.eventBaseOpacity = item.opacity;
        item.transparent = true;
      }
      item.opacity = item.userData.eventBaseOpacity * opacity;
    });
    child.visible = opacity > .015;
  });
  const addHydratedIon = (part, coreColor, label) => {
    const hydrated = new THREE.Group(); tag(hydrated, part); g.add(hydrated);
    atom(hydrated, [0,0,0], .078, coreColor, part, { roughness: .28 });
    for (let index = 0; index < 6; index += 1) {
      const angle = index * Math.PI / 3;
      atom(hydrated, [Math.cos(angle) * .15, Math.sin(angle) * .15, index % 2 ? .08 : -.08], .032, 0x70b6c2, part, { roughness: .42 });
    }
    const ionLabel = labelSprite(label, coreColor === C.copper ? '#a4d5e3' : '#d7e2e4', .16);
    ionLabel.position.set(0, .28, 0); ionLabel.visible = true; hydrated.add(ionLabel);
    return hydrated;
  };

  [left, right].forEach((x, side) => {
    const part = side ? 'Cathode' : 'Anode'; const ionPart = side ? 'Copper ion' : 'Zinc ion';
    const vessel = new THREE.Mesh(new THREE.CylinderGeometry(1.03, .93, 2.35, 56, 1, true), material(0xd8e5e1, { transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false }));
    vessel.position.set(x, -.45, 0); tag(vessel, part); g.add(vessel);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.03, .032, 10, 56), material(0xc7d6d1, { transparent: true, opacity: .62, roughness: .28 }));
    rim.rotation.x = Math.PI / 2; rim.position.set(x, .725, 0); tag(rim, part); g.add(rim);
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(.91, .91, 1.55, 56), material(side ? 0x5a99b0 : 0x8fb2a0, { transparent: true, opacity: .23, depthWrite: false }));
    liquid.position.set(x, -.78, 0); tag(liquid, ionPart); g.add(liquid);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(.31, 2.48, .72), material(side ? C.copper : C.zinc, { metalness: .72, roughness: .27 }));
    plate.position.set(x, .28, 0); tag(plate, part); g.add(plate);
    for (let row = 0; row < 7; row += 1) for (let depth = 0; depth < 3; depth += 1) {
      const face = side ? right - .18 : left + .18;
      atom(g, [face, -1.22 + row * .28, -.22 + depth * .22], .047, side ? C.copper : C.zinc, part, { metalness: .7, roughness: .22 });
    }
    for (let index = 0; index < 10; index += 1) {
      atom(g, scatterPoint(index, x, side ? 31 : 17).toArray(), .034 + seeded(index, side ? 33 : 19) * .014, side ? 0x4c98b6 : 0x9eafb5, ionPart, { transparent: true, opacity: .48, roughness: .42 });
    }
  });

  const anodeTitle = labelSprite('Zn ANODE (-) | OXIDATION', '#d8e0e3', .25); anodeTitle.position.set(left, .98, .18); anodeTitle.visible = true; tag(anodeTitle, 'Anode'); g.add(anodeTitle);
  const cathodeTitle = labelSprite('Cu CATHODE (+) | REDUCTION', '#a8d2e1', .25); cathodeTitle.position.set(right, .98, .18); cathodeTitle.visible = true; tag(cathodeTitle, 'Cathode'); g.add(cathodeTitle);
  const anodeHalfReaction = labelSprite('Zn(s) -> Zn2+ + 2e-', '#d9e4e4', .19); anodeHalfReaction.position.set(left, -1.92, .08); anodeHalfReaction.visible = true; g.add(anodeHalfReaction);
  const cathodeHalfReaction = labelSprite('Cu2+ + 2e- -> Cu(s)', '#a6d4e4', .19); cathodeHalfReaction.position.set(right, -1.92, .08); cathodeHalfReaction.visible = true; g.add(cathodeHalfReaction);

  const bridgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(left + .72, -1.12, .14), new THREE.Vector3(left + .74, 1.2, .14),
    new THREE.Vector3(0, 1.62, .14), new THREE.Vector3(right - .74, 1.2, .14), new THREE.Vector3(right - .72, -1.12, .14),
  ]);
  const bridge = new THREE.Mesh(new THREE.TubeGeometry(bridgeCurve, 90, .2, 18, false), material(0xdde8e0, { transparent: true, opacity: .14, side: THREE.DoubleSide, depthWrite: false, roughness: .5 }));
  const bridgeGel = new THREE.Mesh(new THREE.TubeGeometry(bridgeCurve, 90, .13, 16, false), material(0xd0d4ae, { transparent: true, opacity: .2, depthWrite: false, roughness: .72 }));
  tag(bridge, 'Salt bridge'); tag(bridgeGel, 'Salt bridge'); g.add(bridge, bridgeGel);
  const bridgeTitle = labelSprite('KNO3 SALT BRIDGE', '#e8dfb8', .2); bridgeTitle.position.set(0, 1.97, .14); bridgeTitle.visible = true; tag(bridgeTitle, 'Salt bridge'); g.add(bridgeTitle);
  [0.16, .34, .66, .84].forEach((t, index) => {
    const isNitrate = index % 2 === 0; const marker = atom(g, bridgeCurve.getPoint(t).toArray(), .037, isNitrate ? 0xc47a50 : 0x6f9cc5, 'Salt bridge', { transparent: true, opacity: .5, roughness: .38 });
    marker.position.z += index % 2 ? -.08 : .08;
  });
  const nitratePath = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.62, .24), new THREE.Vector3(-.72, 1.22, .24), new THREE.Vector3(left + .72, -.88, .24)]);
  const potassiumPath = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.62, .04), new THREE.Vector3(.72, 1.22, .04), new THREE.Vector3(right - .72, -.88, .04)]);
  const nitrate = new THREE.Group(); tag(nitrate, 'Nitrate ion'); g.add(nitrate);
  atom(nitrate, [0,0,0], .062, 0xc47a50, 'Nitrate ion', { roughness: .34 });
  [[.07,0,0],[-.035,.06,0],[-.035,-.06,0]].forEach((point) => atom(nitrate, point, .026, C.oxygen, 'Nitrate ion', { roughness: .4 }));
  atom(nitrate, [.15,.03,0], .055, 0xc47a50, 'Nitrate ion', { roughness: .34 });
  [[.21,.03,0],[.115,.09,0],[.115,-.03,0]].forEach((point) => atom(nitrate, point, .023, C.oxygen, 'Nitrate ion', { roughness: .4 }));
  const nitrateLabel = labelSprite('2 NO3-', '#e5a361', .17); nitrateLabel.position.set(.06, .26, 0); nitrate.add(nitrateLabel);
  const potassium = atom(g, [0,0,0], .06, 0x6f9cc5, 'Potassium ion', { roughness: .3, emissive: 0x234e71, emissiveIntensity: .12 });
  atom(potassium, [.13,.04,0], .052, 0x6f9cc5, 'Potassium ion', { roughness: .3, emissive: 0x234e71, emissiveIntensity: .12 });
  const potassiumLabel = labelSprite('2 K+', '#9cc7e4', .17); potassiumLabel.position.set(.06, .24, 0); potassium.add(potassiumLabel);

  const electronPath = new THREE.CatmullRomCurve3([new THREE.Vector3(left,1.58,0),new THREE.Vector3(left,2.38,0),new THREE.Vector3(-.28,2.66,0),new THREE.Vector3(.28,2.66,0),new THREE.Vector3(right,2.38,0),new THREE.Vector3(right,1.58,0)]);
  const leftWire = new THREE.CatmullRomCurve3([new THREE.Vector3(left,1.58,0),new THREE.Vector3(left,2.38,0),new THREE.Vector3(-.28,2.66,0)]);
  const rightWire = new THREE.CatmullRomCurve3([new THREE.Vector3(.28,2.66,0),new THREE.Vector3(right,2.38,0),new THREE.Vector3(right,1.58,0)]);
  [leftWire, rightWire].forEach((curve) => {
    const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, .04, 10, false), material(0x505855, { metalness: .72, roughness: .24 }));
    tag(wire, 'External circuit'); g.add(wire);
  });
  const switchPivot = new THREE.Group(); switchPivot.position.set(-.28, 2.66, 0); tag(switchPivot, 'External circuit'); g.add(switchPivot);
  const switchLever = new THREE.Mesh(new THREE.BoxGeometry(.49, .055, .075), material(0xc9d0cb, { metalness: .58, roughness: .23 }));
  switchLever.position.x = .235; tag(switchLever, 'External circuit'); switchPivot.add(switchLever);
  const leftContact = atom(g, [-.28,2.66,0], .065, 0xabb8b2, 'External circuit', { metalness: .7, roughness: .2 });
  const rightContact = atom(g, [.28,2.66,0], .065, 0xabb8b2, 'External circuit', { metalness: .7, roughness: .2 });
  const switchOpenLabel = labelSprite('SWITCH OPEN: NO CURRENT', '#e4bd7d', .2); switchOpenLabel.position.set(0, 2.95, .12); g.add(switchOpenLabel);
  const switchClosedLabel = labelSprite('SWITCH CLOSED: 2 e- THROUGH WIRE', '#f2d06e', .2); switchClosedLabel.position.set(0, 2.95, .12); g.add(switchClosedLabel);
  const potentialLabel = labelSprite('E°cell = +1.10 V (standard conditions)', '#d6e4da', .2); potentialLabel.position.set(0, 2.3, .16); potentialLabel.visible = true; tag(potentialLabel, 'External circuit'); g.add(potentialLabel);
  const electronPacket = [0, 1].map(() => atom(g, [0,0,0], .072, 0xf1c444, 'Electron', { transparent: true, opacity: 0, emissive: 0xf1c444, emissiveIntensity: .82, roughness: .18 }));
  const electronLabel = labelSprite('2 e-', '#f5d467', .17); electronLabel.position.set(0, .2, 0); electronPacket[0].add(electronLabel);

  const zincSurface = atom(g, [left + .18, -.92, .28], .088, C.zinc, 'Anode', { metalness: .74, roughness: .22 });
  const zincHydrated = addHydratedIon('Zinc ion', 0xaebdc3, 'Zn2+(aq)');
  const copperHydrated = addHydratedIon('Copper ion', C.copper, 'Cu2+(aq)');
  const copperDeposit = atom(g, [right - .18, -.92, .28], .09, C.copper, 'Cathode', { metalness: .76, roughness: .21 });
  const anodeNeutral = labelSprite('ANODE SOLUTION: NEUTRAL', '#d7e5df', .18); anodeNeutral.position.set(left, .63, .78); g.add(anodeNeutral);
  const anodeCharge = labelSprite('ANODE: EXCESS +2', '#e8a879', .18); anodeCharge.position.set(left, .63, .78); g.add(anodeCharge);
  const cathodeNeutral = labelSprite('CATHODE SOLUTION: NEUTRAL', '#d4e7eb', .18); cathodeNeutral.position.set(right, .63, .78); g.add(cathodeNeutral);
  const cathodeCharge = labelSprite('CATHODE: EXCESS -2', '#b8d8ef', .18); cathodeCharge.position.set(right, .63, .78); g.add(cathodeCharge);
  const ledger = labelSprite('CLOSED-CIRCUIT EVENT: Zn(s) + Cu2+(aq)  ->  Zn2+(aq) + Cu(s)  |  2 e-', '#f2d06e', .39); ledger.position.set(0, 3.34, 0); g.add(ledger);
  let switchClosure = (initialParameters.circuitClosed ?? progress > .02) ? 1 : 0;

  g.userData.update = (value, parameters = initialParameters) => {
    const circuitClosed = parameters.circuitClosed ?? value > .02;
    const event = circuitClosed ? THREE.MathUtils.clamp(value, 0, 1) : THREE.MathUtils.clamp(parameters.circuitFrozenProgress ?? 0, 0, 1);
    const dissolve = THREE.MathUtils.smoothstep(event, .18, .42);
    const deposit = THREE.MathUtils.smoothstep(event, .6, .76);
    const balance = THREE.MathUtils.smoothstep(event, .62, .94);
    switchClosure = THREE.MathUtils.lerp(switchClosure, circuitClosed ? 1 : 0, .16);
    switchLever.rotation.z = THREE.MathUtils.lerp(.62, 0, switchClosure);
    switchOpenLabel.visible = switchClosure < .48;
    switchClosedLabel.visible = switchClosure >= .48;
    zincHydrated.position.set(THREE.MathUtils.lerp(left + .18, left - .48, dissolve), THREE.MathUtils.lerp(-.92, -.48, dissolve), THREE.MathUtils.lerp(.28, -.14, dissolve));
    copperHydrated.position.set(THREE.MathUtils.lerp(right - .52, right - .18, deposit), THREE.MathUtils.lerp(-.62, -.92, deposit), THREE.MathUtils.lerp(-.14, .28, deposit));
    setOpacity(zincSurface, 1 - dissolve); setOpacity(zincHydrated, dissolve);
    setOpacity(copperHydrated, 1 - deposit); setOpacity(copperDeposit, deposit);
    const electronFade = circuitClosed ? THREE.MathUtils.smoothstep(event, .2, .28) : 0;
    electronPacket.forEach((electron, index) => {
      const packetProgress = THREE.MathUtils.smoothstep(event, .26 + index * .025, .55 + index * .025);
      electron.position.copy(electronPath.getPoint(packetProgress)); electron.position.z += index ? .075 : -.075;
      electron.scale.setScalar(THREE.MathUtils.lerp(.3, 1, electronFade));
      electron.material.opacity = electronFade;
      electron.visible = electronFade > .004;
    });
    electronLabel.visible = electronFade > .45;
    const counterionFade = THREE.MathUtils.smoothstep(event, .62, .7);
    nitrate.position.copy(nitratePath.getPoint(balance)); setOpacity(nitrate, counterionFade); nitrate.visible = counterionFade > .004;
    potassium.position.copy(potassiumPath.getPoint(balance)); setOpacity(potassium, counterionFade); potassium.visible = counterionFade > .004;
    nitrate.scale.setScalar(THREE.MathUtils.lerp(.3, 1, counterionFade)); potassium.scale.setScalar(THREE.MathUtils.lerp(.3, 1, counterionFade));
    nitrateLabel.visible = counterionFade > .45; potassiumLabel.visible = counterionFade > .45;
    const anodeCharged = dissolve > .6 && balance < .92;
    const cathodeCharged = deposit > .6 && balance < .92;
    anodeNeutral.visible = !anodeCharged; cathodeNeutral.visible = !cathodeCharged;
    anodeCharge.visible = anodeCharged; cathodeCharge.visible = cathodeCharged;
    ledger.visible = circuitClosed;
  };
  g.userData.update(progress, initialParameters); g.scale.setScalar(.72); g.position.y = -.15; g.rotation.set(-.06, -.16, 0); return g;
}

function synthesisExhibit(progress) {
  const g = new THREE.Group();
  const manualStation = new THREE.Group(); const automationStation = new THREE.Group();
  tag(manualStation, 'Manual flask'); tag(automationStation, 'Reaction plate'); g.add(manualStation, automationStation);
  const benchMaterial = material(0x6c7772, { metalness: .18, roughness: .52 });
  const manualBench = new THREE.Mesh(new THREE.BoxGeometry(2.35, .12, 1.45), benchMaterial);
  manualBench.position.set(-1.35, -1.25, 0); tag(manualBench, 'Manual flask'); manualStation.add(manualBench);
  const plateBench = new THREE.Mesh(new THREE.BoxGeometry(2.65, .12, 1.8), benchMaterial);
  plateBench.position.set(1.38, -1.25, 0); tag(plateBench, 'Reaction plate'); automationStation.add(plateBench);

  const flask = new THREE.Group(); flask.position.set(-1.35, -.58, 0); tag(flask, 'Manual flask'); manualStation.add(flask);
  const flaskBody = new THREE.Mesh(new THREE.SphereGeometry(.47, 32, 24), material(0xd6e8de, { transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false, roughness: .24 }));
  flaskBody.scale.y = .86; tag(flaskBody, 'Manual flask'); flask.add(flaskBody);
  const flaskNeck = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .62, 24), material(0xd6e8de, { transparent: true, opacity: .2, side: THREE.DoubleSide, depthWrite: false, roughness: .24 }));
  flaskNeck.position.y = .45; tag(flaskNeck, 'Manual flask'); flask.add(flaskNeck);
  const flaskRim = new THREE.Mesh(new THREE.TorusGeometry(.145, .018, 8, 28), material(0xd6e8de, { transparent: true, opacity: .66, roughness: .24 }));
  flaskRim.rotation.x = Math.PI / 2; flaskRim.position.y = .76; tag(flaskRim, 'Manual flask'); flask.add(flaskRim);
  const flaskSolution = new THREE.Mesh(new THREE.SphereGeometry(.39, 28, 20), material(0x4c9a8c, { transparent: true, opacity: .18, depthWrite: false, emissive: 0x174d43, emissiveIntensity: .08 }));
  flaskSolution.scale.set(1, .46, 1); flaskSolution.position.y = -.18; tag(flaskSolution, 'Manual flask'); flask.add(flaskSolution);
  const flaskLabel = labelSprite('MANUAL FLASK | ONE PLANNED CONDITION', '#d4eee7', .2); flaskLabel.position.set(0, -1.04, .1); flaskLabel.visible = true; tag(flaskLabel, 'Manual flask'); flask.add(flaskLabel);
  const conditionCard = new THREE.Mesh(new THREE.BoxGeometry(.8, .48, .04), material(0xebdfbd, { roughness: .64 }));
  conditionCard.position.set(-2.12, -.73, .34); conditionCard.rotation.y = .18; tag(conditionCard, 'Condition'); manualStation.add(conditionCard);
  const conditionLabel = labelSprite('CONDITION 01 | SERIAL RUN', '#f0d88d', .14); conditionLabel.position.set(-2.12, -.67, .39); conditionLabel.visible = true; tag(conditionLabel, 'Condition'); manualStation.add(conditionLabel);

  const pipette = new THREE.Group(); tag(pipette, 'Pipette'); manualStation.add(pipette);
  const pipetteShaft = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .88, 16), material(0xd9e3df, { metalness: .26, roughness: .3 }));
  pipetteShaft.rotation.z = -.16; tag(pipetteShaft, 'Pipette'); pipette.add(pipetteShaft);
  const pipettePlunger = new THREE.Mesh(new THREE.CylinderGeometry(.095, .095, .18, 16), material(0x526b69, { metalness: .24, roughness: .32 }));
  pipettePlunger.position.y = .48; pipettePlunger.rotation.z = -.16; tag(pipettePlunger, 'Pipette'); pipette.add(pipettePlunger);
  const pipetteTip = new THREE.Mesh(new THREE.ConeGeometry(.07, .32, 16), material(0x9ed0d7, { transparent: true, opacity: .78, roughness: .22 }));
  pipetteTip.position.y = -.58; pipetteTip.rotation.z = Math.PI; tag(pipetteTip, 'Pipette'); pipette.add(pipetteTip);
  const dispensedDrop = atom(manualStation, [0,0,0], .07, 0xd59a46, 'Pipette', { emissive: 0x8b4a16, emissiveIntensity: .25, roughness: .22 });
  const manualTag = labelSprite('SERIAL: DISPENSE -> REACT -> ANALYSE -> DECIDE', '#e6c36b', .18); manualTag.position.set(-1.35, 1.15, .12); manualTag.visible = true; manualStation.add(manualTag);

  const plate = new THREE.Group(); plate.position.set(1.38, -.93, 0); tag(plate, 'Reaction plate'); automationStation.add(plate);
  const plateBase = new THREE.Mesh(new THREE.BoxGeometry(2.32, .2, 1.48), material(0x334a4a, { metalness: .16, roughness: .44 }));
  tag(plateBase, 'Reaction plate'); plate.add(plateBase);
  const plateInset = new THREE.Mesh(new THREE.BoxGeometry(2.18, .025, 1.34), material(0x1e2d2f, { roughness: .56 }));
  plateInset.position.y = .115; tag(plateInset, 'Reaction plate'); plate.add(plateInset);
  const wellFills = []; const wellRings = [];
  const responseValues = [
    .1, .24, .42, .64, .31, .05,
    .16, .48, .71, .87, .53, .08,
    .12, .44, .68, .9, .56, .1,
    .04, .19, .36, .88, .22, .02,
  ];
  const flaskStartColor = new THREE.Color(0x4c9a8c); const flaskEndColor = new THREE.Color(0x7596b7);
  const wellStartColor = new THREE.Color(0x7c9c9b); const wellStartEmissive = new THREE.Color(0x1a403e);
  const responseLowColor = new THREE.Color(0x416e70); const responseHighColor = new THREE.Color(0xd1b75a);
  const candidateEmissive = new THREE.Color(0x9c6d18); const noEmissive = new THREE.Color(0x000000);
  for (let row = 0; row < 4; row += 1) for (let column = 0; column < 6; column += 1) {
    const index = row * 6 + column; const x = - .86 + column * .344; const z = -.48 + row * .32;
    const part = index === 23 ? 'Control well' : row === 3 && column === 3 ? 'Replicate' : index === 15 ? 'Candidate condition' : 'Condition';
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.105, .02, 8, 20), material(0xaebeb8, { metalness: .16, roughness: .3 }));
    ring.rotation.x = Math.PI / 2; ring.position.set(x, .145, z); tag(ring, part); plate.add(ring); wellRings.push({ ring, part });
    const fill = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .045, 18), material(0x7c9c9b, { transparent: true, opacity: .08, roughness: .34, emissive: 0x1a403e, emissiveIntensity: .04 }));
    fill.position.set(x, .16, z); tag(fill, part); plate.add(fill);
    const responseColor = new THREE.Color().lerpColors(responseLowColor, responseHighColor, responseValues[index]);
    wellFills.push({ fill, response: responseValues[index], responseColor, part });
  }
  const plateLabel = labelSprite('PARALLEL SCREEN | 4 x 6 INDEPENDENT WELLS', '#c3ded8', .19); plateLabel.position.set(0, -.28, .9); plateLabel.visible = true; tag(plateLabel, 'Reaction plate'); plate.add(plateLabel);
  const conditionAxisLabel = labelSprite('COLUMNS: SOLVENT', '#c3ded8', .14); conditionAxisLabel.position.set(0, -.29, -.86); conditionAxisLabel.visible = true; tag(conditionAxisLabel, 'Condition'); plate.add(conditionAxisLabel);
  const rowAxisLabel = labelSprite('ROWS: BASE | D4 REPEAT | F4 BLANK', '#c3ded8', .12); rowAxisLabel.position.set(-1.3, .16, .66); rowAxisLabel.visible = true; tag(rowAxisLabel, 'Condition'); plate.add(rowAxisLabel);
  const replicateLabel = labelSprite('D4: REPLICATE OF D3', '#d3b47b', .13); replicateLabel.position.set(1.22, .16, .45); replicateLabel.visible = true; tag(replicateLabel, 'Replicate'); plate.add(replicateLabel);
  const controlLabel = labelSprite('F4: BLANK', '#cf9d83', .13); controlLabel.position.set(1.22, .16, -.52); controlLabel.visible = true; tag(controlLabel, 'Control well'); plate.add(controlLabel);
  const candidateRing = new THREE.Mesh(new THREE.TorusGeometry(.145, .018, 8, 28), material(0xf0ca6c, { transparent: true, opacity: 0, emissive: 0x9c6d18, emissiveIntensity: .45 }));
  candidateRing.rotation.x = Math.PI / 2; candidateRing.position.set(-.86 + 3 * .344, .195, -.48 + 2 * .32); tag(candidateRing, 'Candidate condition'); plate.add(candidateRing);

  const handler = new THREE.Group(); handler.position.set(1.38, .86, 0); tag(handler, 'Liquid handler'); automationStation.add(handler);
  const railA = new THREE.Mesh(new THREE.BoxGeometry(2.46, .1, .08), material(0x849892, { metalness: .34, roughness: .28 })); railA.position.set(0, .34, -.68); tag(railA, 'Liquid handler'); handler.add(railA);
  const railB = railA.clone(); railB.position.z = .68; tag(railB, 'Liquid handler'); handler.add(railB);
  const head = new THREE.Group(); tag(head, 'Liquid handler'); handler.add(head);
  const headBody = new THREE.Mesh(new THREE.BoxGeometry(.5, .2, .62), material(0xd5dfda, { metalness: .32, roughness: .25 })); tag(headBody, 'Liquid handler'); head.add(headBody);
  for (let index = 0; index < 4; index += 1) {
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(.022, .026, .48, 12), material(0x9bd3db, { transparent: true, opacity: .82, roughness: .22 }));
    tip.position.set(-.15 + index * .1, -.32, -.18 + (index % 2) * .36); tag(tip, 'Liquid handler'); head.add(tip);
  }
  const handlerLabel = labelSprite('MULTICHANNEL LIQUID HANDLER', '#d5e7e2', .19); handlerLabel.position.set(0, .72, .1); handlerLabel.visible = true; tag(handlerLabel, 'Liquid handler'); handler.add(handlerLabel);

  const analysisPanel = new THREE.Group(); analysisPanel.position.set(1.38, 1.86, .32); tag(analysisPanel, 'Analysis'); automationStation.add(analysisPanel);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(2.18, .72, .06), material(0x19272a, { metalness: .06, roughness: .48 })); tag(screen, 'Analysis'); analysisPanel.add(screen);
  [ .2, .48, .72, .9, .56, .08 ].forEach((height, index) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(.16, height * .48, .035), material(0x6c9c8f, { transparent: true, opacity: .12, emissive: 0x1f5c50, emissiveIntensity: .12 }));
    bar.position.set(-.72 + index * .29, -.2 + height * .24, .045); tag(bar, 'Analysis'); analysisPanel.add(bar);
  });
  const analysisLabel = labelSprite('LC/MS RESPONSE | ILLUSTRATIVE', '#d2e5df', .17); analysisLabel.position.set(0, .52, .06); analysisLabel.visible = true; tag(analysisLabel, 'Analysis'); analysisPanel.add(analysisLabel);
  const candidateLabel = labelSprite('CANDIDATE -> VERIFY IN FLASK', '#f0ca6c', .17); candidateLabel.position.set(0, -.56, .06); tag(candidateLabel, 'Candidate condition'); analysisPanel.add(candidateLabel);
  const reactionQuestion = labelSprite('SAME QUESTION: ArCO2H + RNH2 + COUPLING REAGENT  ->  ArCONHR', '#f0d58a', .29); reactionQuestion.position.set(0, 2.85, 0); reactionQuestion.visible = true; g.add(reactionQuestion);
  const setAnalysisOpacity = (opacity) => analysisPanel.traverse((item) => {
    if (!item.material) return;
    const materials = Array.isArray(item.material) ? item.material : [item.material];
    materials.forEach((itemMaterial) => {
      if (itemMaterial.userData.analysisBaseOpacity === undefined) itemMaterial.userData.analysisBaseOpacity = itemMaterial.opacity;
      itemMaterial.transparent = true;
      itemMaterial.opacity = itemMaterial.userData.analysisBaseOpacity * opacity;
    });
  });

  g.userData.update = (value) => {
    const manualRun = THREE.MathUtils.smoothstep(value, .12, .44);
    const parallelRun = THREE.MathUtils.smoothstep(value, .48, .78);
    const analysis = THREE.MathUtils.smoothstep(value, .78, .98);
    pipette.position.set(THREE.MathUtils.lerp(-2.0, -1.35, manualRun), THREE.MathUtils.lerp(1.25, .28, manualRun), THREE.MathUtils.lerp(.38, .06, manualRun));
    pipette.rotation.z = THREE.MathUtils.lerp(-.28, .04, manualRun);
    dispensedDrop.position.set(THREE.MathUtils.lerp(-1.8, -1.35, manualRun), THREE.MathUtils.lerp(.65, -.15, manualRun), THREE.MathUtils.lerp(.35, .03, manualRun));
    dispensedDrop.visible = manualRun > .04 && manualRun < .96;
    flaskSolution.material.opacity = THREE.MathUtils.lerp(.18, .54, manualRun);
    flaskSolution.material.color.lerpColors(flaskStartColor, flaskEndColor, manualRun);
    head.position.set(THREE.MathUtils.lerp(-.88, .88, parallelRun), 0, THREE.MathUtils.lerp(.38, -.38, parallelRun));
    wellFills.forEach(({ fill, response, responseColor }) => {
      const baseline = THREE.MathUtils.lerp(.08, .52, parallelRun);
      fill.material.opacity = THREE.MathUtils.lerp(baseline, .34 + response * .55, analysis);
      fill.material.color.lerpColors(wellStartColor, responseColor, analysis);
      fill.material.emissive.lerpColors(wellStartEmissive, responseColor, analysis * .32);
    });
    wellRings.forEach(({ ring, part }) => {
      ring.material.emissive.copy(part === 'Candidate condition' && analysis > .2 ? candidateEmissive : noEmissive);
      ring.material.emissiveIntensity = part === 'Candidate condition' ? analysis * .45 : 0;
    });
    candidateRing.material.opacity = analysis * .92;
    analysisPanel.visible = analysis > .015;
    setAnalysisOpacity(analysis);
    candidateLabel.visible = analysis > .34;
  };
  g.userData.update(progress); g.scale.setScalar(.82); g.position.y = -.22; g.rotation.set(-.08, -.2, 0); return g;
}

function latticeExhibit(progress) {
  const g = new THREE.Group();
  const cellSize = 1.8;
  const coordinationView = progress >= .25 && progress < .75;
  const cleavageView = progress >= .75;
  const anionSites = [[0,0,0],[0,.5,.5],[.5,0,.5],[.5,.5,0]];
  const cationSites = [[.5,0,0],[0,.5,0],[0,0,.5],[.5,.5,.5]];
  const keyOf = (point) => point.map((value) => value.toFixed(3)).join('|');
  const ionMaterial = (isCation) => ({ roughness: .3, metalness: .08, color: isCation ? 0x8c68b3 : C.chlorine });

  const addRockSaltCell = (group, cell, offset, seen) => {
    const addFamily = (sites, isCation) => sites.forEach((fractional) => {
      const position = new THREE.Vector3(
        (fractional[0] + cell[0] - .5) * cellSize,
        (fractional[1] + cell[1] - .5) * cellSize,
        (fractional[2] + cell[2] - .5) * cellSize,
      ).add(offset);
      const key = keyOf(position.toArray());
      if (seen?.has(key)) return;
      seen?.add(key);
      atom(group, position.toArray(), isCation ? .16 : .22, ionMaterial(isCation).color, isCation ? 'Cation' : 'Anion', ionMaterial(isCation));
    });
    addFamily(anionSites, false);
    addFamily(cationSites, true);
  };

  const addConventionalRockSaltCell = (group) => {
    const boundary = [-.5, .5];
    const corners = boundary.flatMap((x) => boundary.flatMap((y) => boundary.map((z) => [x, y, z])));
    const faceCentres = [[-.5,0,0],[.5,0,0],[0,-.5,0],[0,.5,0],[0,0,-.5],[0,0,.5]];
    const edgeCentres = [];
    boundary.forEach((a) => boundary.forEach((b) => {
      edgeCentres.push([0, a, b], [a, 0, b], [a, b, 0]);
    }));
    const addSites = (sites, isCation) => sites.forEach((fractional) => {
      atom(
        group,
        fractional.map((value) => value * cellSize),
        isCation ? .135 : .19,
        ionMaterial(isCation).color,
        isCation ? 'Cation' : 'Anion',
        ionMaterial(isCation),
      );
    });
    // Full boundary images make the sharing in the conventional cell explicit:
    // Cl- occupies fcc corners/faces; Na+ occupies edge centres and the body site.
    addSites([...corners, ...faceCentres], false);
    addSites([...edgeCentres, [0,0,0]], true);
  };

  if (!coordinationView && !cleavageView) {
    const conventional = new THREE.Group(); g.add(conventional);
    addConventionalRockSaltCell(conventional);
    const cellBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(cellSize, cellSize, cellSize)), new THREE.LineBasicMaterial({ color: 0xd0a947, transparent: true, opacity: .86 }));
    tag(cellBox, 'Unit cell'); conventional.add(cellBox);
    conventional.scale.setScalar(.98);
  }

  if (coordinationView) {
    const coordination = new THREE.Group(); g.add(coordination);
    atom(coordination, [0, 0, 0], .23, 0x8c68b3, 'Central cation', { roughness: .26, metalness: .1, emissive: 0x9a6fc7, emissiveIntensity: .2 });
    const neighbours = [[cellSize/2,0,0],[-cellSize/2,0,0],[0,cellSize/2,0],[0,-cellSize/2,0],[0,0,cellSize/2],[0,0,-cellSize/2]];
    neighbours.forEach((position) => {
      atom(coordination, position, .285, C.chlorine, 'Coordination shell', { roughness: .28, metalness: .08, emissive: 0x6eaa73, emissiveIntensity: .12 });
    });
    const shellEnvelope = new THREE.Mesh(new THREE.OctahedronGeometry(cellSize / 2), material(0xd8bd66, { transparent: true, opacity: .13, side: THREE.DoubleSide, depthWrite: false }));
    tag(shellEnvelope, 'Coordination shell'); coordination.add(shellEnvelope);
    const shellEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(cellSize / 2)), new THREE.LineBasicMaterial({ color: 0xd8bd66, transparent: true, opacity: .7 }));
    tag(shellEdges, 'Coordination shell'); coordination.add(shellEdges);
    coordination.scale.setScalar(.76);
  }

  if (cleavageView) {
    const cleavage = new THREE.Group(); g.add(cleavage);
    cleavage.rotation.x = Math.PI / 2;
    const lower = new THREE.Group(); const upper = new THREE.Group(); cleavage.add(lower, upper);
    const lateralCells = [0, 1];
    const slabCenter = new THREE.Vector3(cellSize / 2, cellSize / 2, cellSize / 4);
    const lowerOffset = slabCenter.clone().multiplyScalar(-1).add(new THREE.Vector3(0, 0, -.6));
    const upperOffset = slabCenter.clone().multiplyScalar(-1).add(new THREE.Vector3(0, 0, .6));
    const lowerSeen = new Set(); const upperSeen = new Set();
    lateralCells.forEach((x) => lateralCells.forEach((y) => {
      addRockSaltCell(lower, [x, y, 0], lowerOffset, lowerSeen);
      addRockSaltCell(upper, [x, y, 1], upperOffset, upperSeen);
    }));
    const cleavagePlane = new THREE.Mesh(new THREE.PlaneGeometry(3.82, 3.82), material(0xe2b44d, { transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false }));
    tag(cleavagePlane, 'Cleavage plane'); cleavage.add(cleavagePlane);
    const planeEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(3.82, 3.82)), new THREE.LineBasicMaterial({ color: 0xe2b44d, transparent: true, opacity: .48 }));
    tag(planeEdges, 'Cleavage plane'); cleavage.add(planeEdges);
    cleavage.scale.setScalar(.74);
  }

  g.rotation.set(cleavageView ? 0 : .5, cleavageView ? 0 : -.55, cleavageView ? 0 : .05);
  return g;
}

// ---------------------------------------------------------------------------------------
// ANALYTICAL TECHNIQUES
// ---------------------------------------------------------------------------------------

// A real travelling wave. Crests are placed from the ACTUAL path length, so when two beams
// have a genuine path difference they visibly fall in or out of step - the interference is
// emergent, not drawn by hand.
function waveBeam(group, color, part, segments = 140) {
  const positions = new Float32Array(segments * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, linewidth: 2 }));
  line.visible = false; tag(line, part); group.add(line);
  const REF = new THREE.Vector3(0, 0, 1);
  return (from, to, wavelength, phase, amp, opacity = 1, colorOverride) => {
    line.visible = opacity > .02;
    if (!line.visible) return;
    if (colorOverride !== undefined) line.material.color.set(colorOverride);
    const dir = to.clone().sub(from);
    const len = dir.length();
    if (len < .001) { line.visible = false; return; }
    const unit = dir.clone().normalize();
    let perp = new THREE.Vector3().crossVectors(unit, REF);
    if (perp.lengthSq() < .0001) perp = new THREE.Vector3().crossVectors(unit, new THREE.Vector3(0, 1, 0));
    perp.normalize();
    for (let i = 0; i < segments; i += 1) {
      const s = (i / (segments - 1)) * len;
      const off = Math.sin((s / wavelength) * Math.PI * 2 + phase) * amp;
      const pt = from.clone().addScaledVector(unit, s).addScaledVector(perp, off);
      positions[i * 3] = pt.x; positions[i * 3 + 1] = pt.y; positions[i * 3 + 2] = pt.z;
    }
    geometry.attributes.position.needsUpdate = true;
    line.material.opacity = opacity;
  };
}

// A straight arrow whose length/direction can be set every frame.
function liveArrow(group, color, part, radius = .03, headSize = .12) {
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 12), material(color, { emissive: color, emissiveIntensity: .3, transparent: true }));
  const head = new THREE.Mesh(new THREE.ConeGeometry(headSize, headSize * 2, 14), material(color, { emissive: color, emissiveIntensity: .3, transparent: true }));
  tag(shaft, part); tag(head, part); shaft.visible = false; head.visible = false;
  group.add(shaft, head);
  return (from, to, opacity = 1) => {
    const dir = to.clone().sub(from);
    const len = dir.length();
    const on = opacity > .02 && len > .02;
    shaft.visible = on; head.visible = on;
    if (!on) return;
    const unit = dir.clone().normalize();
    shaft.position.copy(from).lerp(to, .5);
    shaft.scale.set(1, Math.max(.02, len - headSize * 1.6), 1);
    shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), unit);
    head.position.copy(to).addScaledVector(unit, -headSize);
    head.quaternion.copy(shaft.quaternion);
    shaft.material.opacity = opacity; head.material.opacity = opacity;
  };
}

// CO2 normal modes from proper mode coordinates (symmetric stretch s, asymmetric a, bend phi),
// with the carbon placed so the centre of mass stays fixed. Both selection-rule observables
// then fall straight out of the geometry, which is why IR and Raman are exact complements:
//   dipole         mu = -(rL*dirL + rR*dirR)  -> zero ONLY for the symmetric stretch
//   polarisability propto (rL + rR)           -> varies ONLY for the symmetric stretch
const CO2_L = 1.2;
function co2State(aSym, aAsym, aBend, tt) {
  const s = Math.sin(tt * 9) * aSym * .26;
  const a = Math.sin(tt * 12.5) * aAsym * .26;
  const phi = Math.sin(tt * 7) * aBend * .34;
  const rL = CO2_L + s - a, rR = CO2_L + s + a;
  const dirL = new THREE.Vector3(-Math.cos(phi), Math.sin(phi), 0);
  const dirR = new THREE.Vector3(Math.cos(phi), Math.sin(phi), 0);
  const sum = dirL.clone().multiplyScalar(rL).add(dirR.clone().multiplyScalar(rR));
  const pC = sum.clone().multiplyScalar(-16 / 44);
  return {
    pC,
    pL: pC.clone().addScaledVector(dirL, rL),
    pR: pC.clone().addScaledVector(dirR, rR),
    mu: sum.clone().multiplyScalar(-1),
    polar: (rL + rR) / (2 * CO2_L),
  };
}
const co2Atoms = (g) => ({
  cC: atom(g, [0, 0, 0], .3, C.carbon, 'Carbon', { roughness: .3 }),
  oL: atom(g, [-CO2_L, 0, 0], .34, C.oxygen, 'Oxygen', { roughness: .3 }),
  oR: atom(g, [CO2_L, 0, 0], .34, C.oxygen, 'Oxygen', { roughness: .3 }),
  bL: animatedMechanismDoubleBond(g, 0x45504d, .03, .12, 'Carbon'),
  bR: animatedMechanismDoubleBond(g, 0x45504d, .03, .12, 'Carbon'),
});
const nearestMode = (modes, value, width = .05) => {
  let best = null, amp = 0;
  const amps = {};
  modes.forEach((m) => {
    amps[m.kind] = Math.exp(-Math.pow((value - m.p) / width, 2));
    if (amps[m.kind] > amp) { amp = amps[m.kind]; best = m; }
  });
  return { amps, best, amp };
};

// IR -- the beam is drawn as a real wave. If the mode is IR-active at this frequency the wave
// STOPS at the molecule (absorbed); otherwise it carries straight on (transmitted).
function irScene(g, progress, tt) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const mol = co2Atoms(g);
  const dip = liveArrow(g, 0xe0ad35, 'Dipole moment', .035, .14);
  const dipLabel = labelSprite('net dipole', '#ffd36b', .28); tag(dipLabel, 'Dipole moment'); g.add(dipLabel);
  const inWave = waveBeam(g, 0xc2557a, 'Absorption band');
  const outWave = waveBeam(g, 0xc2557a, 'Absorption band');
  const absorbedTag = labelSprite('ABSORBED', '#e88aa6', .42); absorbedTag.position.set(0, 1.65, 0); g.add(absorbedTag);
  const passTag = labelSprite('transmitted', '#a9b3b0', .42); passTag.position.set(0, 1.65, 0); g.add(passTag);
  const caps = {
    asym: labelSprite('asymmetric stretch · dipole flips · ABSORBS', '#e88aa6', .5),
    sym: labelSprite('symmetric stretch · dipole stays zero · SILENT', '#e7c96a', .52),
    bend: labelSprite('bend · dipole tips sideways · ABSORBS', '#e88aa6', .46),
  };
  Object.values(caps).forEach((c) => { c.position.set(.95, -1.55, 0); g.add(c); });
  const modes = [{ p: (4000 - 2349) / 3600, kind: 'asym', active: true }, { p: (4000 - 1333) / 3600, kind: 'sym', active: false }, { p: (4000 - 667) / 3600, kind: 'bend', active: true }];

  return (value, tt2) => {
    const { amps, best, amp } = nearestMode(modes, value);
    const st = co2State(amps.sym || 0, amps.asym || 0, amps.bend || 0, tt2);
    mol.oL.position.copy(st.pL); mol.oR.position.copy(st.pR); mol.cC.position.copy(st.pC);
    mol.bL(st.pC, st.pL, 1); mol.bR(st.pC, st.pR, 1);
    const mag = st.mu.length();
    const show = mag > .04;
    if (show) {
      const dir = st.mu.clone().normalize();
      const a = st.pC.clone().add(V(0, .62, 0));
      const b = a.clone().addScaledVector(dir, Math.min(mag * 1.8, 1.25));
      dip(a, b, 1);
      dipLabel.visible = true;
      dipLabel.position.copy(a).add(V(-1.1, .32, 0));
    } else { dip(V(), V(), 0); dipLabel.visible = false; }
    // the IR beam: shorter wavelength at high wavenumber
    const wn = 4000 - value * 3600;
    const lam = Math.max(.28, 900 / wn);
    const phase = -tt2 * 7;
    const absorbing = !!best && amp > .45 && best.active;
    inWave(V(-4.2, -1.05, 0), V(-1.75, -1.05, 0), lam, phase, .17, .95);
    outWave(V(1.75, -1.05, 0), V(4.2, -1.05, 0), lam, phase, .17, absorbing ? .06 : .95);
    absorbedTag.visible = absorbing;
    passTag.visible = !absorbing;
    Object.entries(caps).forEach(([k, c]) => { c.visible = best?.kind === k && amp > .45; });
  };
}

// Raman -- the scattered Stokes photon is drawn with a visibly LONGER wavelength than the
// laser: that is what "lower energy" means, made literal.
function ramanScene(g, progress, tt) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const mol = co2Atoms(g);
  const cloud = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 24), material(0x6f9fb5, {
    transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false, emissive: 0x2f5468, emissiveIntensity: .14,
  }));
  tag(cloud, 'Polarisability'); g.add(cloud);
  const laser = waveBeam(g, 0x67a85f, 'Laser');
  const rayleigh = waveBeam(g, 0x67a85f, 'Laser');
  const stokes = waveBeam(g, 0xd2622f, 'Stokes photon');
  const lLabel = labelSprite('laser in', '#8fd08a', .34); lLabel.position.set(-2.8, .62, 0); g.add(lLabel);
  const rLabel = labelSprite('Rayleigh · same λ', '#8fd08a', .4); rLabel.position.set(2.15, 1.55, 0); g.add(rLabel);
  const sLabel = labelSprite('Stokes · longer λ = lower energy', '#eda079', .5); sLabel.position.set(2.0, -1.6, 0); tag(sLabel, 'Stokes photon'); g.add(sLabel);
  const caps = {
    sym: labelSprite('symmetric stretch · cloud BREATHES · Raman active', '#8fd08a', .56),
    asym: labelSprite('asymmetric stretch · cloud size fixed · SILENT', '#e7c96a', .55),
    bend: labelSprite('bend · cloud size fixed · SILENT', '#e7c96a', .42),
  };
  Object.values(caps).forEach((c) => { c.position.set(.95, -1.45, 0); g.add(c); });
  const modes = [{ p: 667 / 3000, kind: 'bend', active: false }, { p: 1336 / 3000, kind: 'sym', active: true }, { p: 2349 / 3000, kind: 'asym', active: false }];

  return (value, tt2) => {
    const { amps, best, amp } = nearestMode(modes, value);
    const st = co2State(amps.sym || 0, amps.asym || 0, amps.bend || 0, tt2);
    mol.oL.position.copy(st.pL); mol.oR.position.copy(st.pR); mol.cC.position.copy(st.pC);
    mol.bL(st.pC, st.pL, 1); mol.bR(st.pC, st.pR, 1);
    const k = 1 + (st.polar - 1) * 2.6;
    cloud.scale.set(1.95 * k, 1.02 * k, 1.02 * k);
    const phase = -tt2 * 7;
    const lam = .42;
    laser(V(-3.6, .28, 0), V(-1.9, .05, 0), lam, phase, .15, .95);
    rayleigh(V(1.9, .05, 0), V(3.5, 1.15, 0), lam, phase, .15, .95);
    // Raman-active only when the polarisability is actually changing
    const active = Math.abs(st.polar - 1) > .012;
    // a Stokes photon has lost one vibrational quantum -> longer wavelength
    const stokesLam = lam * 1.75;
    stokes(V(1.9, -.15, 0), V(3.5, -1.25, 0), stokesLam, phase, .17, active ? .95 : 0);
    sLabel.visible = active;
    Object.entries(caps).forEach(([kk, c]) => { c.visible = best?.kind === kk && amp > .45; });
  };
}

// Approximate visible colour of a wavelength (nm); below 380 nm is UV (violet-grey).
function wavelengthColor(nm) {
  if (nm < 380) return new THREE.Color(0x8a7fa8);
  let r = 0, gr = 0, b = 0;
  if (nm < 440) { r = (440 - nm) / 60; b = 1; }
  else if (nm < 490) { gr = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { gr = 1; b = (510 - nm) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; gr = 1; }
  else if (nm < 645) { r = 1; gr = (645 - nm) / 65; }
  else { r = 1; }
  return new THREE.Color(r, gr, b);
}
const POLYENE_LAMBDA = { 2: 217, 3: 258, 4: 290, 5: 334, 6: 364 };

// UV-Vis -- flat energy diagram (no perspective skew), a real coloured photon wave, and the
// gap arrow shrinking as the box gets longer.
function uvvisScene(g, progress, tt) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const MAXC = 12;
  const carbons = []; const sigma = []; const pi = [];
  for (let i = 0; i < MAXC; i += 1) carbons.push(atom(g, [0, 0, 0], .17, C.carbon, 'Conjugated chain', { roughness: .32 }));
  for (let i = 0; i < MAXC - 1; i += 1) {
    sigma.push(animatedMechanismBond(g, 0x69736f, .04, 'Conjugated chain'));
    pi.push(animatedMechanismBond(g, 0x67a85f, .028, 'Conjugated chain'));
  }
  const bar = (part) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, .06, .06), material(0x8a938f, { emissive: 0x3a4341, emissiveIntensity: .25 }));
    tag(m, part); g.add(m); return m;
  };
  const homo = bar('HOMO-LUMO gap'); const lumo = bar('HOMO-LUMO gap');
  const homoL = labelSprite('HOMO', '#c7d0cc', .28); g.add(homoL);
  const lumoL = labelSprite('LUMO', '#c7d0cc', .28); g.add(lumoL);
  const gapArrow = liveArrow(g, 0xe7c96a, 'HOMO-LUMO gap', .026, .1);
  const gapLabel = labelSprite('gap', '#e7c96a', .24); tag(gapLabel, 'HOMO-LUMO gap'); g.add(gapLabel);
  const electron = atom(g, [0, 0, 0], .11, 0xe0ad35, 'Electron', { emissive: 0xe0ad35, emissiveIntensity: .85 });
  const photon = waveBeam(g, 0x8a7fa8, 'Photon');
  const swatch = new THREE.Mesh(new THREE.PlaneGeometry(.62, .62), material(0xffffff, { transparent: true, opacity: .95, side: THREE.DoubleSide }));
  swatch.position.set(3.05, -.15, 0); tag(swatch, 'Photon'); g.add(swatch);
  const swatchL = labelSprite('you see', '#c7d0cc', .3); swatchL.position.set(3.05, .42, 0); g.add(swatchL);
  const capAbs = labelSprite('photon energy = gap · ABSORBED', '#8fd08a', .48); capAbs.position.set(.95, -2.05, 0); g.add(capAbs);
  const capPass = labelSprite('energy does not match the gap · passes through', '#a9b3b0', .55); capPass.position.set(.95, -2.05, 0); g.add(capPass);

  return (value, tt2, params = {}) => {
    const n = Math.round(params.conjugation ?? 2);
    const nC = n * 2;
    const lambda = 200 + value * 500;
    const lambdaMax = POLYENE_LAMBDA[n] || 217;
    const absorb = Math.exp(-Math.pow((lambda - lambdaMax) / 15, 2));
    const spacing = .46;
    const x0 = -(nC - 1) * spacing / 2 - 1.55;
    for (let i = 0; i < MAXC; i += 1) {
      const on = i < nC;
      carbons[i].visible = on;
      if (on) carbons[i].position.set(x0 + i * spacing, .35 + (i % 2 === 0 ? .16 : -.16), 0);
      carbons[i].material.emissive = new THREE.Color(absorb > .4 ? 0x4a7a3a : 0x000000);
      carbons[i].material.emissiveIntensity = absorb > .4 ? .35 : 0;
    }
    for (let i = 0; i < MAXC - 1; i += 1) {
      const on = i < nC - 1;
      sigma[i](carbons[i].position, carbons[i + 1].position, on ? 1 : 0);
      pi[i](carbons[i].position.clone().add(V(0, 0, .13)), carbons[i + 1].position.clone().add(V(0, 0, .13)), on && i % 2 === 0 ? 1 : 0);
    }
    // energy levels: gap shrinks as the box lengthens (particle in a box)
    const gap = 2.9 / (n * .55 + .35);
    const hy = -1.0, ly = hy + gap;
    homo.position.set(2.15, hy, 0); lumo.position.set(2.15, ly, 0);
    homoL.position.set(1.05, hy, 0); lumoL.position.set(1.05, ly, 0);
    gapArrow(V(3.0, hy, 0), V(3.0, ly, 0), 1);
    gapLabel.position.set(3.4, (hy + ly) / 2, 0);
    electron.position.set(2.15, hy + absorb * gap, 0);
    const col = wavelengthColor(lambda);
    const lam = .3 + (lambda - 200) / 500 * .55;
    photon(V(-4.4, 1.5, 0), absorb > .4 ? V(x0 - .3, 1.5, 0) : V(4.4, 1.5, 0), lam, -tt2 * 7, .16, .95, col);
    // transmitted light: white minus what was absorbed
    const t = swatch.material.color;
    if (absorb > .4 && lambda >= 380) { t.setRGB(1 - col.r * .92, 1 - col.g * .92, 1 - col.b * .92); }
    else { t.setRGB(.96, .96, .94); }
    capAbs.visible = absorb > .4;
    capPass.visible = absorb <= .4;
  };
}

// NMR -- the shielding is made visible: each proton carries an electron cloud whose SIZE is
// its shielding. The fat cloud on CH3 is exactly why it sits upfield.
function nmrScene(g, progress, tt) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const c1 = V(-1.15, -.2, 0), c2 = V(.05, .3, 0), oO = V(1.25, -.15, 0);
  atom(g, c1.toArray(), .24, C.carbon, 'CH3 protons', { roughness: .3 });
  atom(g, c2.toArray(), .24, C.carbon, 'CH2 protons', { roughness: .3 });
  atom(g, oO.toArray(), .28, C.oxygen, 'OH proton', { roughness: .3 });
  bond(g, c1.toArray(), c2.toArray(), .05, 0x69736f, 'CH2 protons');
  bond(g, c2.toArray(), oO.toArray(), .05, 0x69736f, 'CH2 protons');
  // shieldingR: bigger cloud = more electron density = more shielded = further upfield
  const mk = (base, dirs, len, col, part, shieldR) => dirs.map((d) => {
    const p = base.clone().addScaledVector(d.clone().normalize(), len);
    const h = atom(g, p.toArray(), .14, col, part, { roughness: .38, emissive: col, emissiveIntensity: .1 });
    bond(g, base.toArray(), p.toArray(), .032, 0x767c79, part);
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(shieldR, 20, 14), material(0x7fa8c4, {
      transparent: true, opacity: .3, depthWrite: false, side: THREE.DoubleSide, emissive: 0x33607a, emissiveIntensity: .15,
    }));
    cloud.position.copy(p); tag(cloud, part); g.add(cloud);
    return { mesh: h, cloud, home: p.clone() };
  });
  const ch3 = mk(c1, [V(-.6, .75, .3), V(-.75, -.5, -.35), V(-.2, -.5, .8)], .82, 0x6f9fb5, 'CH3 protons', .32);
  const ch2 = mk(c2, [V(-.1, .9, .5), V(.05, .85, -.6)], .82, 0x7fae74, 'CH2 protons', .19);
  const oh = mk(oO, [V(.85, .6, 0)], .78, 0xd0904a, 'OH proton', .24);
  for (let i = -1; i <= 1; i += 1) {
    arrow(g, [-2.75 + i * .34, -1.25, 0], [-2.75 + i * .34, 1.15, 0], 0x8fa0b8, 'B0 field');
  }
  const b0L = labelSprite('B₀', '#b7c6da', .22); b0L.position.set(-2.75, 1.45, 0); tag(b0L, 'B0 field'); g.add(b0L);
  const shieldNote = labelSprite('big cloud = shielded = upfield', '#9fd0e0', .5); shieldNote.position.set(.95, -1.75, 0); g.add(shieldNote);
  const caps = {
    ch2: labelSprite('CH₂ · δ 3.69 · 2H · quartet · O strips its shielding', '#8fd08a', .6),
    oh: labelSprite('OH · δ ~2.6 · 1H · broad singlet (exchanges)', '#eda079', .54),
    ch3: labelSprite('CH₃ · δ 1.22 · 3H · triplet · most shielded', '#9fd0e0', .54),
  };
  Object.values(caps).forEach((c) => { c.position.set(.95, -1.75, 0); g.add(c); });
  const envs = [
    { p: (10 - 3.69) / 10, key: 'ch2', group: ch2 },
    { p: (10 - 2.6) / 10, key: 'oh', group: oh },
    { p: (10 - 1.22) / 10, key: 'ch3', group: ch3 },
  ];

  return (value, tt2) => {
    let anyHit = false;
    envs.forEach((e) => {
      const amp = Math.exp(-Math.pow((value - e.p) / .03, 2));
      caps[e.key].visible = amp > .45;
      if (amp > .45) anyHit = true;
      e.group.forEach((h, i) => {
        h.mesh.material.emissiveIntensity = .1 + amp * 1.3;
        const wob = amp * .1;
        h.mesh.position.copy(h.home).add(V(Math.cos(tt2 * 7 + i * 2) * wob, 0, Math.sin(tt2 * 7 + i * 2) * wob));
        h.cloud.position.copy(h.mesh.position);
        h.cloud.material.opacity = .3 + amp * .3;
      });
    });
    shieldNote.visible = !anyHit;
  };
}

// Mass spec -- the molecule ACTUALLY breaks. The selected fragment flies to the detector and
// the neutral radical drifts away; at m/z 31 you watch the C=O pi bond form (the oxocarbenium).
function massspecScene(g, progress, tt) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const c1 = V(-1.75, -.2, 0), c2 = V(-.6, .3, 0), oO = V(.55, -.15, 0);
  const left = new THREE.Group(); const right = new THREE.Group();
  g.add(left, right);
  const cA = atom(left, c1.toArray(), .24, C.carbon, 'Methyl fragment', { roughness: .3 });
  const cB = atom(right, c2.toArray(), .24, C.carbon, 'Oxocarbenium', { roughness: .3 });
  const oX = atom(right, oO.toArray(), .28, C.oxygen, 'Oxocarbenium', { roughness: .3 });
  const addH = (parent, base, dirs, len, part) => dirs.forEach((d) => {
    const p = base.clone().addScaledVector(d.clone().normalize(), len);
    atom(parent, p.toArray(), .13, C.hydrogen, part, { roughness: .4 });
    bond(parent, base.toArray(), p.toArray(), .03, 0x767c79, part);
  });
  addH(left, c1, [V(-.7, .7, .3), V(-.8, -.5, -.35), V(-.25, -.55, .8)], .8, 'Methyl fragment');
  addH(right, c2, [V(-.05, .9, .55), V(.1, .85, -.6)], .8, 'Oxocarbenium');
  addH(right, oO, [V(.85, .6, 0)], .76, 'Oxocarbenium');
  bond(right, c2.toArray(), oO.toArray(), .05, 0x69736f, 'Oxocarbenium');
  const ccBond = animatedMechanismBond(g, 0x69736f, .05, 'Alpha cleavage');   // the bond that breaks
  const coPi = animatedMechanismBond(right, 0x67a85f, .036, 'Oxocarbenium');  // C=O pi forms
  const detector = new THREE.Mesh(new THREE.BoxGeometry(.16, 2.0, 1.0), material(0x8a938f, { roughness: .4, metalness: .3 }));
  detector.position.set(2.85, 0, 0); tag(detector, 'Detector'); g.add(detector);
  const detL = labelSprite('detector', '#c7d0cc', .32); detL.position.set(2.85, 1.35, 0); g.add(detL);
  const blip = atom(g, [2.55, 0, 0], .15, 0xe0ad35, 'Detector', { emissive: 0xe0ad35, emissiveIntensity: .9 });
  const ionLabel = labelSprite('M⁺• radical cation · m/z 46', '#e7c96a', .78); ionLabel.position.set(-.5, 1.6, 0); tag(ionLabel, 'Molecular ion'); g.add(ionLabel);
  const caps = {
    46: labelSprite('M⁺• intact · only 23% · the ion is fragile', '#e7c96a', .56),
    31: labelSprite('α-cleavage → CH₂=OH⁺ · O donates a lone pair · BASE PEAK', '#8fd08a', .66),
    45: labelSprite('M–H · lost one hydrogen · 42%', '#eda079', .48),
    15: labelSprite('CH₃⁺ · no lone pair to help it · only 8%', '#c98f8f', .56),
  };
  Object.values(caps).forEach((c) => { c.position.set(.95, -1.95, 0); g.add(c); });
  const frags = [
    { p: 15 / 60, mz: 15, fly: 'left' },
    { p: 31 / 60, mz: 31, fly: 'right' },
    { p: 45 / 60, mz: 45, fly: 'both' },
    { p: 46 / 60, mz: 46, fly: 'both' },
  ];

  return (value, tt2) => {
    let hit = null, amp = 0;
    frags.forEach((f) => {
      const a = Math.exp(-Math.pow((value - f.p) / .016, 2));
      if (a > amp) { amp = a; hit = f; }
    });
    const on = !!hit && amp > .45;
    Object.values(caps).forEach((c) => { c.visible = false; });
    if (on) caps[hit.mz].visible = true;
    const broken = on && (hit.fly === 'left' || hit.fly === 'right');
    const sep = broken ? amp : 0;
    // the selected half flies to the detector; the neutral radical drifts away
    if (broken && hit.fly === 'right') {
      right.position.set(sep * 1.35, 0, 0); left.position.set(-sep * .55, -sep * .35, 0);
    } else if (broken && hit.fly === 'left') {
      left.position.set(sep * 2.5, sep * .05, 0); right.position.set(-sep * .35, -sep * .45, 0);
    } else { right.position.set(0, 0, 0); left.position.set(0, 0, 0); }
    const lOpacity = broken && hit.fly === 'right' ? 1 - sep * .55 : 1;
    left.traverse((o) => { if (o.material) { o.material.transparent = true; o.material.opacity = lOpacity; } });
    ccBond(c1.clone().add(left.position), c2.clone().add(right.position), broken ? Math.max(0, 1 - sep * 2.2) : 1);
    // the oxocarbenium: oxygen lone pair becomes a full C=O pi bond
    const oxo = on && hit.mz === 31 ? amp : 0;
    const oOff = piOffset(c2, oO, .13);
    coPi(c2.clone().add(oOff), oO.clone().add(oOff), oxo);
    ionLabel.visible = on && hit.mz === 46;
    blip.visible = on;
    blip.material.emissiveIntensity = .3 + amp;
    blip.scale.setScalar(.6 + amp * .9);
  };
}

// XRD -- the two reflected beams are drawn as REAL waves whose phase comes from their actual
// path length. When 2d.sin(theta) = n.lambda the crests line up on screen; otherwise they cancel.
function xrdScene(g, progress, tt) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const d = 1.25, ratio = 1.5406 / (2 * 2.82);   // lambda / 2d for NaCl + Cu K-alpha
  const yTop = .2, yBot = yTop - d;
  for (let row = 0; row < 2; row += 1) {
    for (let i = -3; i <= 3; i += 1) {
      atom(g, [i * .8, row === 0 ? yTop : yBot, 0], .2, row === 0 ? 0x8c68b3 : 0x6f9fb5, 'Lattice planes', { roughness: .34 });
    }
  }
  [yTop, yBot].forEach((y) => {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(5.8, .02), material(0xd0a947, { transparent: true, opacity: .45 }));
    pl.position.set(0, y, 0); tag(pl, 'Lattice planes'); g.add(pl);
  });
  const dLabel = labelSprite('d = 2.82 Å', '#e7c96a', .42); dLabel.position.set(-2.9, (yTop + yBot) / 2, 0); tag(dLabel, 'Lattice planes'); g.add(dLabel);
  const inA = waveBeam(g, 0xc94d68, 'X-ray beam'); const outA = waveBeam(g, 0xc94d68, 'X-ray beam');
  const inB = waveBeam(g, 0x5f8fa8, 'X-ray beam'); const outB = waveBeam(g, 0x5f8fa8, 'X-ray beam');
  const spot = atom(g, [0, 0, 0], .22, 0xe0ad35, 'Bragg reflection', { emissive: 0xe0ad35, emissiveIntensity: .2 });
  const capBright = labelSprite('extra path = whole number of λ · IN STEP · bright', '#8fd08a', .62); capBright.position.set(.95, -2.3, 0); g.add(capBright);
  const capDark = labelSprite('extra path is not a whole λ · out of step · dark', '#a9b3b0', .6); capDark.position.set(.95, -2.3, 0); g.add(capDark);
  const pathLabel = labelSprite('extra path 2d·sinθ', '#e7c96a', .6); tag(pathLabel, 'Path difference'); g.add(pathLabel);

  return (value, tt2) => {
    const theta = Math.max(.035, value * 60 * Math.PI / 180);
    const st = Math.sin(theta), ct = Math.cos(theta);
    const R = 2.9;
    const hitA = V(-.45, yTop, 0), hitB = V(.45, yBot, 0);
    const inDir = V(ct, st, 0), outDir = V(-ct, st, 0);
    // phase advances with real optical path; beam B travels an extra 2d.sin(theta)
    const extra = 2 * d * st;          // extra path in scene units
    const wl = 2 * d * ratio;          // makes extra/wl == the REAL 2d.sin(theta)/lambda exactly
    const ph = -tt2 * 6;
    inA(hitA.clone().addScaledVector(inDir, R), hitA, wl, ph, .12, .95);
    outA(hitA, hitA.clone().addScaledVector(outDir, R), wl, ph, .12, .95);
    inB(hitB.clone().addScaledVector(inDir, R), hitB, wl, ph, .12, .95);
    outB(hitB, hitB.clone().addScaledVector(outDir, R), wl, ph - (2 * Math.PI * extra / wl), .12, .95);
    const path = extra / wl;                          // path difference in wavelengths
    const intensity = Math.pow(Math.cos(Math.PI * path), 2);
    const tip = hitA.clone().addScaledVector(outDir, R);
    spot.position.copy(tip);
    spot.material.emissiveIntensity = .1 + intensity * 1.8;
    spot.scale.setScalar(.55 + intensity * 1.0);
    pathLabel.position.set(.0, (yTop + yBot) / 2 - .38, 0);
    const bright = intensity > .9 && value > .05;
    capBright.visible = bright; capDark.visible = !bright;
  };
}

// Fluorescence -- a clean, flat Jablonski diagram. The absorption arrow is visibly LONGER than
// the emission arrow: that difference IS the Stokes shift.
function fluorScene(g, progress, tt) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const s0 = -1.6, s1 = 1.05, vib = .33;
  const mkLevel = (y, w, strong, part) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, strong ? .06 : .035, .04), material(strong ? 0x6d7a76 : 0xa9b3b0, { emissive: 0x3a4341, emissiveIntensity: strong ? .3 : .1 }));
    m.position.set(0, y, 0); tag(m, part); g.add(m); return m;
  };
  for (let v = 0; v < 3; v += 1) {
    mkLevel(s0 + v * vib, v === 0 ? 3.0 : 2.5, v === 0, 'Ground state');
    mkLevel(s1 + v * vib, v === 0 ? 3.0 : 2.5, v === 0, 'Excited state');
  }
  const s0L = labelSprite('S₀', '#c7d0cc', .24); s0L.position.set(-1.95, s0, 0); tag(s0L, 'Ground state'); g.add(s0L);
  const s1L = labelSprite('S₁', '#c7d0cc', .24); s1L.position.set(-1.95, s1, 0); tag(s1L, 'Excited state'); g.add(s1L);
  const absArrow = liveArrow(g, 0x5a6fd0, 'Absorbed photon', .04, .15);
  const emArrow = liveArrow(g, 0x3f9e6a, 'Emitted photon', .04, .15);
  const relax1 = waveBeam(g, 0xe7c96a, 'Electron');
  const relax2 = waveBeam(g, 0xe7c96a, 'Electron');
  const dot = atom(g, [0, s0, 0], .14, 0xe0ad35, 'Electron', { emissive: 0xe0ad35, emissiveIntensity: .9 });
  const absL = labelSprite('absorb 490 nm', '#8ea0e8', .58); absL.position.set(-1.2, (s0 + s1) / 2 + .3, 0); tag(absL, 'Absorbed photon'); g.add(absL);
  const emL = labelSprite('emit 514 nm', '#8fd08a', .52); emL.position.set(1.35, (s0 + s1) / 2 + .1, 0); tag(emL, 'Emitted photon'); g.add(emL);
  const heatL = labelSprite('heat (no light)', '#e7c96a', .56); heatL.position.set(.62, s1 + vib, 0); g.add(heatL);
  const stokesL = labelSprite('shorter arrow = less energy = the Stokes shift', '#8fd08a', .62); stokesL.position.set(.95, -2.75, 0); tag(stokesL, 'Stokes shift'); g.add(stokesL);
  const caps = {
    a: labelSprite('absorption ~10⁻¹⁵ s · lands HIGH in S₁ (Franck-Condon)', '#8ea0e8', .64),
    b: labelSprite('vibrational relaxation ~10⁻¹² s · 1000× faster than emission', '#e7c96a', .66),
    c: labelSprite('emission ~10⁻⁹ s · lands HIGH in S₀ · energy lost twice', '#8fd08a', .64),
  };
  Object.values(caps).forEach((c) => { c.position.set(.95, -2.2, 0); g.add(c); });

  return (value, tt2) => {
    const absorbed = THREE.MathUtils.smoothstep(value, .16, .3);
    const relaxed = THREE.MathUtils.smoothstep(value, .36, .58);
    const emitted = THREE.MathUtils.smoothstep(value, .66, .8);
    const relaxed2 = THREE.MathUtils.smoothstep(value, .85, .98);
    const topS1 = s1 + 2 * vib;     // absorption lands here (Franck-Condon)
    const topS0 = s0 + 2 * vib;     // emission lands here -- NOT at the bottom
    let y = s0;
    if (value < .3) y = THREE.MathUtils.lerp(s0, topS1, absorbed);
    else if (value < .62) y = THREE.MathUtils.lerp(topS1, s1, relaxed);
    else if (value < .84) y = THREE.MathUtils.lerp(s1, topS0, emitted);
    else y = THREE.MathUtils.lerp(topS0, s0, relaxed2);
    const jitter = (relaxed > .05 && relaxed < .95) || (relaxed2 > .05 && relaxed2 < .95) ? Math.sin(tt2 * 24) * .045 : 0;
    dot.position.set(0, y + jitter, 0);
    // absorption arrow: S0(v=0) -> S1(v=2). Emission arrow: S1(v=0) -> S0(v=2). Shorter!
    absArrow(V(-.85, s0, 0), V(-.85, topS1, 0), value < .34 ? 1 : .2);
    emArrow(V(.85, s1, 0), V(.85, topS0, 0), value > .6 ? 1 : .12);
    absL.visible = value < .4; emL.visible = value > .6;
    relax1(V(.18, topS1, 0), V(.18, s1, 0), .22, -tt2 * 9, .07, value >= .3 && value < .66 ? .95 : .12);
    relax2(V(.18, topS0, 0), V(.18, s0, 0), .22, -tt2 * 9, .07, value > .84 ? .95 : .1);
    heatL.visible = value >= .3 && value < .66;
    stokesL.visible = value > .6;
    caps.a.visible = value < .34;
    caps.b.visible = value >= .34 && value < .64;
    caps.c.visible = value >= .64;
  };
}

const TECHNIQUE_SCENES = { ir: irScene, raman: ramanScene, uvvis: uvvisScene, nmr: nmrScene, massspec: massspecScene, xrd: xrdScene, fluorescence: fluorScene };
// Diagram-style techniques are viewed dead-on: perspective skew makes an energy-level diagram
// look like a pile of sticks.
const TECHNIQUE_FLAT = new Set(['uvvis', 'xrd', 'fluorescence']);

function analysisExhibit(progress, parameters = {}, step = 0, time = 0) {
  const g = new THREE.Group();
  const id = parameters.techniqueId || 'ir';
  const build = TECHNIQUE_SCENES[id] || irScene;
  const tick = build(g, progress, time);
  g.userData.update = (value, params = {}, stepIndex, tt = 0) => tick(value, tt, params);
  g.userData.update(progress, parameters, step, time);
  const scale = { ir: .8, raman: .66, uvvis: .62, nmr: .72, massspec: .64, xrd: .64, fluorescence: .68 }[id] || .75;
  g.scale.setScalar(scale);
  const shift = { nmr: -.75, massspec: -.35, raman: -.3, ir: -.2 }[id] || 0;
  g.position.set(shift, 0, 0);
  if (TECHNIQUE_FLAT.has(id)) g.rotation.set(0, 0, 0);
  else g.rotation.set(.09, -.15, 0);
  return g;
}

const builders = { battery: batteryExhibit, binding, snowflake: snowflakeExhibit, catalyst: catalystExhibit, smell, mechanism, orbitals, geometry, lattice: latticeExhibit, electrochem: electrochemExhibit, synthesis: synthesisExhibit, analysis: analysisExhibit };
const discreteBuilders = new Set(['orbitals', 'geometry', 'lattice']);
const discreteModelKey = (lessonId, value) => ['geometry', 'orbitals', 'lattice'].includes(lessonId) ? Math.round(value * 2) / 2 : (value >= .5 ? 1 : 0);
const cameraViews = {
  battery: [[5.0,2.2,9.5],[5.0,2.2,9.5],[5.0,2.2,9.5],[5.0,2.2,9.5]],
  snowflake: [[4.0,2.8,7.0],[4.6,2.4,9.2],[4.8,3.2,9.0],[4.4,2.8,8.4]],
  catalyst: [[3.8,2.5,6.3],[1.7,1.0,3.0],[1.25,.8,2.35],[1.12,.72,2.15]],
  mechanism: [[5.4,2.5,8],[4.4,2.1,6.8],[4.1,1.7,6.4],[5.2,2.8,7.7]],
  orbitals: [[4.8,3.0,8.8],[4.3,2.4,7.8],[5.0,3.3,8.2],[4.3,2.4,7.8]],
  geometry: [[4.7,2.8,7.4],[4.2,2.4,6.9],[4.1,2.1,6.7],[4.6,2.8,7.1]],
  lattice: [[4.7,3.2,7.5],[4.1,2.7,6.7],[5.3,3.7,8.4],[5.1,3.4,8.1]],
  electrochem: [[5.2,3.2,8.5],[4.8,2.7,7.8],[4.8,2.7,7.8],[5.3,3.4,8.4]],
  synthesis: [[5.4,3.0,9.0],[4.95,2.75,8.35],[5.2,3.05,8.7],[4.9,2.8,8.3]],
  analysis: [[.4,1.0,8.8],[.4,1.0,8.8],[.4,1.0,8.8],[.4,1.0,8.8]],
};
const cameraTargets = {
  battery: [[0,-.45,0],[0,-.45,0],[0,-.45,0],[0,-.45,0]],
  snowflake: [[0,-.8,.35],[.35,-.1,0],[.55,-.1,0],[.55,-.1,0]],
  catalyst: [[.55,-.62,0],[.55,-.62,.45],[.58,-.65,.72],[.58,-.65,.9]],
  mechanism: [[.2,-.3,0],[.55,-.2,0],[.55,-.7,-.6],[.8,-.2,0]],
  orbitals: [[.55,-.4,0],[.55,-.4,0],[.55,-.4,0],[.55,-.4,0]],
  geometry: [[.55,-.4,0],[.55,-.4,0],[.55,-.4,0],[.55,-.4,0]],
  lattice: [[.55,-.55,0],[.55,-.55,0],[.55,-.55,0],[0,0,0]],
  electrochem: [[-.55,-.45,0],[-.55,-.45,0],[.8,-.45,0],[.4,.1,0]],
  synthesis: [[0,.1,0],[-.8,-.15,0],[.85,-.2,0],[.72,.35,0]],
  analysis: [[0,-.1,0],[0,-.1,0],[0,-.1,0],[0,-.1,0]],
};
const analysisCameraViews = {
  ir: [[.4,1.0,8.6],[.4,1.0,8.6],[.4,1.0,8.6],[.4,1.0,8.6]],
  raman: [[.3,.9,9.6],[.3,.9,9.6],[.3,.9,9.6],[.3,.9,9.6]],
  uvvis: [[0,0,10.8],[0,0,10.8],[0,0,10.8],[0,0,10.8]],
  nmr: [[.5,1.2,8.6],[.5,1.2,8.6],[.5,1.2,8.6],[.5,1.2,8.6]],
  massspec: [[.4,1.0,9.8],[.4,1.0,9.8],[.4,1.0,9.8],[.4,1.0,9.8]],
  xrd: [[0,0,9.8],[0,0,9.8],[0,0,9.8],[0,0,9.8]],
  fluorescence: [[0,0,9.6],[0,0,9.6],[0,0,9.6],[0,0,9.6]],
};
const analysisCameraTargets = {
  ir: [[0,-.15,0],[0,-.15,0],[0,-.15,0],[0,-.15,0]],
  raman: [[0,-.1,0],[0,-.1,0],[0,-.1,0],[0,-.1,0]],
  uvvis: [[0,.1,0],[0,.1,0],[0,.1,0],[0,.1,0]],
  nmr: [[-.3,-.25,0],[-.3,-.25,0],[-.3,-.25,0],[-.3,-.25,0]],
  massspec: [[.2,-.15,0],[.2,-.15,0],[.2,-.15,0],[.2,-.15,0]],
  xrd: [[0,-.55,0],[0,-.55,0],[0,-.55,0],[0,-.55,0]],
  fluorescence: [[0,-.4,0],[0,-.4,0],[0,-.4,0],[0,-.4,0]],
};
const mechanismCameraViews = {
  sn2: [[5.4,2.5,8],[4.4,2.1,6.8],[4.1,1.7,6.4],[5.2,2.8,7.7]],
  suzuki: [[5.4,2.6,8.7],[5.1,2.4,8.2],[4.9,2.3,7.8],[5.6,2.8,8.9]],
  dielsAlder: [[4.8,2.5,7.4],[3.7,1.9,5.8],[3.0,1.5,5.0],[4.3,2.0,6.4]],
  e2: [[5.5,2.6,8.2],[5.5,2.6,8.2],[5.5,2.6,8.2],[5.5,2.6,8.2]],
  sn1: [[5.5,2.6,8.2],[5.5,2.6,8.2],[5.5,2.6,8.2],[5.5,2.6,8.2]],
  carbonyl: [[5.4,2.6,8.1],[5.4,2.6,8.1],[5.4,2.6,8.1],[5.4,2.6,8.1]],
  michael: [[5.7,2.7,8.5],[5.7,2.7,8.5],[5.7,2.7,8.5],[5.7,2.7,8.5]],
};
const mechanismCameraTargets = {
  sn2: [[.2,-.3,0],[.55,-.2,0],[.55,-.7,-.6],[.8,-.2,0]],
  suzuki: [[0,-.08,.04],[0,.02,.05],[0,-.06,.08],[0,-.58,.06]],
  dielsAlder: [[0,.18,.3],[0,.1,.28],[0,.02,.22],[0,.02,.1]],
  e2: [[.1,-.25,0],[.1,-.2,0],[.1,-.2,0],[.3,-.25,0]],
  sn1: [[.1,-.25,0],[.1,-.2,0],[.1,-.2,0],[.3,-.25,0]],
  carbonyl: [[.1,-.2,0],[.1,-.15,0],[.1,-.15,0],[.2,-.2,0]],
  michael: [[.2,-.4,0],[.2,-.35,0],[.2,-.35,0],[.2,-.4,0]],
};
const mechanismCameraProgress = {
  sn2: [.05,.48,.5,.92],
  suzuki: [.04,.36,.62,.96],
  dielsAlder: [.26,.42,.65,.96],
  e2: [.05,.5,.52,.95],
  sn1: [.08,.5,.5,.95],
  carbonyl: [.05,.5,.52,.95],
  michael: [.05,.45,.5,.95],
};
const fallbackCatalystCameraStops = [
  { progress: .04, target: [0,0,-.3], offset: [3.0,2.7,6.8] },
  { progress: .3, target: [0,0,.02], offset: [-1.5,-2.6,1.4] },
  { progress: .66, target: [0,0,.22], offset: [-1.45,-2.51,.95] },
  { progress: 1, target: [0,0,.4], offset: [-1.7,-2.94,1.2] },
];

function disposeObject(object) {
  object.traverse((child) => {
    child.geometry?.dispose();
    const disposeMaterial = (item) => { item?.map?.dispose(); item?.dispose(); };
    if (Array.isArray(child.material)) child.material.forEach(disposeMaterial);
    else disposeMaterial(child.material);
  });
}

export default function ChemScene({ lessonId, sceneVariant = '', progress, progressSignal, stepIndex = 0, resetToken = 0, parameters = {}, color, selectedPart, onSelect }) {
  const mountRef = useRef(null);
  const selectRef = useRef(onSelect);
  const progressRef = useRef(progress);
  const selectedPartRef = useRef(selectedPart);
  const stepRef = useRef(stepIndex);
  const resetRef = useRef(resetToken);
  const parametersRef = useRef(parameters);
  const sceneVariantRef = useRef(sceneVariant);
  selectRef.current = onSelect;
  progressRef.current = progress;
  selectedPartRef.current = selectedPart;
  stepRef.current = stepIndex;
  resetRef.current = resetToken;
  parametersRef.current = parameters;
  sceneVariantRef.current = sceneVariant;

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
    camera.position.set(5.4, 3.4, 7.8);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xf6f1df, 0x53615c, 2.2));
    const key = new THREE.DirectionalLight(0xfff0d4, 3.2); key.position.set(4, 6, 5); scene.add(key);
    const rim = new THREE.PointLight(new THREE.Color(color), 12, 12); rim.position.set(-3, 1, 3); scene.add(rim);
    const modelRoot = new THREE.Group();
    modelRoot.position.set(lessonId === 'orbitals' ? .95 : lessonId === 'snowflake' || lessonId === 'synthesis' ? 0 : .55, lessonId === 'battery' ? -.08 : lessonId === 'snowflake' ? .05 : lessonId === 'synthesis' ? -.18 : -.62, 0);
    scene.add(modelRoot);
    let currentProgress = progressRef.current;
    let renderedKey = discreteBuilders.has(lessonId) ? discreteModelKey(lessonId, currentProgress) : Math.round(currentProgress * 100) / 100;
    const initialModel = builders[lessonId](currentProgress, parametersRef.current, stepRef.current);
    modelRoot.add(initialModel);
    let modelSwapTimer; let modelFadeFrame; let pendingModelSwap;

    const replaceModel = (value, keyValue) => {
      const previous = modelRoot.children[0];
      const next = builders[lessonId](value, parametersRef.current, stepRef.current);
      modelRoot.add(next);
      if (previous) {
        modelRoot.remove(previous);
        disposeObject(previous);
      }
      renderedKey = keyValue;
    };
    const queueModelReplacement = (value, keyValue) => {
      pendingModelSwap = { value, keyValue };
      if (modelSwapTimer) return;
      if (modelFadeFrame) {
        cancelAnimationFrame(modelFadeFrame);
        modelFadeFrame = undefined;
      }
      renderer.domElement.style.transition = 'opacity 140ms cubic-bezier(.16,1,.3,1)';
      renderer.domElement.style.opacity = '.18';
      modelSwapTimer = window.setTimeout(() => {
        modelSwapTimer = undefined;
        const pending = pendingModelSwap;
        pendingModelSwap = undefined;
        if (pending && pending.keyValue !== renderedKey) replaceModel(pending.value, pending.keyValue);
        modelFadeFrame = requestAnimationFrame(() => {
          modelFadeFrame = undefined;
          renderer.domElement.style.opacity = '1';
        });
      }, 140);
    };

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.enablePan = false; controls.minDistance = lessonId === 'catalyst' ? 1.5 : 4.5; controls.maxDistance = 13;
    controls.autoRotate = false;

    let compactMode; let cameraNeedsReset = false;
    const cameraStateFor = (step) => {
      if (lessonId === 'lattice' && compactMode) return {
        camera: new THREE.Vector3(...(cameraViews.lattice[step] || cameraViews.lattice[0])),
        target: new THREE.Vector3(0, step >= 3 ? -.02 : -.08, 0),
      };
      if (compactMode && lessonId === 'battery') return {
        camera: new THREE.Vector3(4.8, 2.85, 10.4),
        target: new THREE.Vector3(0, -.5, 0),
      };
      if (compactMode && lessonId === 'electrochem') return {
        camera: new THREE.Vector3(4.8, 2.95, 10.4),
        target: new THREE.Vector3(0, -.55, 0),
      };
      const activeCameraViews = lessonId === 'analysis'
        ? analysisCameraViews[sceneVariantRef.current] || cameraViews.analysis
        : lessonId === 'mechanism'
        ? mechanismCameraViews[sceneVariantRef.current] || cameraViews.mechanism
        : cameraViews[lessonId];
      const activeCameraTargets = lessonId === 'analysis'
        ? analysisCameraTargets[sceneVariantRef.current] || cameraTargets.analysis
        : lessonId === 'mechanism'
        ? mechanismCameraTargets[sceneVariantRef.current] || cameraTargets.mechanism
        : cameraTargets[lessonId];
      if (lessonId !== 'catalyst') {
        const cameraIndex = Math.max(0, Math.min((activeCameraViews?.length || 1) - 1, step));
        const targetIndex = Math.max(0, Math.min((activeCameraTargets?.length || 1) - 1, step));
        const mechanismRoot = lessonId === 'mechanism' ? modelRoot.position : new THREE.Vector3();
        return {
          camera: new THREE.Vector3(...(activeCameraViews?.[cameraIndex] || [5.4,3.4,8.4])).add(mechanismRoot),
          target: new THREE.Vector3(...(activeCameraTargets?.[targetIndex] || [.55,-.4,0])).add(mechanismRoot),
        };
      }
      const catalystStops = modelRoot.children[0]?.userData.cameraStops || fallbackCatalystCameraStops;
      const index = Math.max(0, Math.min(catalystStops.length - 1, step));
      const stop = catalystStops[index];
      modelRoot.updateWorldMatrix(true, false);
      const target = modelRoot.localToWorld(new THREE.Vector3(...stop.target));
      const origin = modelRoot.localToWorld(new THREE.Vector3());
      const offset = modelRoot.localToWorld(new THREE.Vector3(...stop.offset)).sub(origin);
      return { camera: target.clone().add(offset), target };
    };
    const catalystStateForProgress = (value) => {
      const catalystStops = modelRoot.children[0]?.userData.cameraStops || fallbackCatalystCameraStops;
      const clamped = THREE.MathUtils.clamp(value, 0, 1);
      const upper = catalystStops.findIndex((stop) => stop.progress >= clamped);
      const next = upper < 0 ? catalystStops.length - 1 : upper;
      const lower = Math.max(0, next - 1);
      const start = catalystStops[lower]; const end = catalystStops[next];
      const blend = start === end ? 0 : THREE.MathUtils.clamp((clamped - start.progress) / (end.progress - start.progress), 0, 1);
      const from = cameraStateFor(lower); const to = cameraStateFor(next);
      return { camera: from.camera.lerp(to.camera, blend), target: from.target.lerp(to.target, blend) };
    };
    const mechanismStateForProgress = (value) => {
      const variant = sceneVariantRef.current || 'sn2';
      const views = mechanismCameraViews[variant] || mechanismCameraViews.sn2;
      const targets = mechanismCameraTargets[variant] || mechanismCameraTargets.sn2;
      const stops = mechanismCameraProgress[variant] || mechanismCameraProgress.sn2;
      const clamped = THREE.MathUtils.clamp(value, 0, 1);
      const upper = stops.findIndex((stop) => stop >= clamped);
      const next = upper < 0 ? stops.length - 1 : upper;
      const lower = Math.max(0, next - 1);
      const fromStop = stops[lower]; const toStop = stops[next];
      const blend = lower === next ? 0 : THREE.MathUtils.clamp((clamped - fromStop) / (toStop - fromStop), 0, 1);
      const mechanismRoot = modelRoot.position;
      return {
        camera: new THREE.Vector3(...views[lower]).lerp(new THREE.Vector3(...views[next]), blend).add(mechanismRoot),
        target: new THREE.Vector3(...targets[lower]).lerp(new THREE.Vector3(...targets[next]), blend).add(mechanismRoot),
      };
    };
    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / Math.max(clientHeight, 1); camera.updateProjectionMatrix();
      const nextCompactMode = clientWidth < 600;
      if (compactMode !== nextCompactMode) {
        const wasCompactMode = compactMode;
        compactMode = nextCompactMode;
        if (nextCompactMode) {
          camera.position.set(4.8, 3.2, 9.4);
          modelRoot.position.x = lessonId === 'orbitals' ? .55 : 0;
          modelRoot.position.y = lessonId === 'battery' ? .28 : lessonId === 'snowflake' ? .25 : lessonId === 'catalyst' ? .38 : lessonId === 'orbitals' ? .15 : lessonId === 'mechanism' ? .15 : lessonId === 'geometry' ? -.15 : lessonId === 'lattice' ? 1.08 : lessonId === 'electrochem' ? -.12 : lessonId === 'synthesis' ? -.08 : -.62;
        } else {
          camera.position.set(5.4, 3.4, 8.4);
          modelRoot.position.x = lessonId === 'orbitals' ? .95 : lessonId === 'snowflake' || lessonId === 'synthesis' ? 0 : .55;
          modelRoot.position.y = lessonId === 'battery' ? -.08 : lessonId === 'snowflake' ? .05 : lessonId === 'synthesis' ? -.18 : -.62;
        }
        modelRoot.scale.setScalar(nextCompactMode ? (lessonId === 'battery' ? .66 : lessonId === 'catalyst' ? .78 : lessonId === 'snowflake' ? 1.12 : lessonId === 'orbitals' ? .55 : lessonId === 'mechanism' ? .68 : lessonId === 'geometry' ? .62 : lessonId === 'lattice' ? .55 : lessonId === 'electrochem' ? .72 : lessonId === 'synthesis' ? .66 : 1) : 1);
        if (lessonId === 'catalyst') cameraNeedsReset = true;
        if (wasCompactMode && !nextCompactMode) replaceModel(progressSignal?.current ?? progressRef.current, renderedKey);
      }
    };
    resize(); const observer = new ResizeObserver(resize); observer.observe(mount);
    let inViewport = true;
    const visibilityObserver = new IntersectionObserver(([entry]) => { inViewport = entry.isIntersecting; }, { threshold: .01 });
    visibilityObserver.observe(mount);

    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    let pointerStart;
    const pointerDown = (event) => { pointerStart = { x: event.clientX, y: event.clientY }; };
    const click = (event) => {
      if (!pointerStart || Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(modelRoot, true).find((item) => item.object.userData.part);
      if (hit) selectRef.current(hit.object.userData.part);
    };
    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointerup', click);
    let frame; const clock = new THREE.Clock(); let elapsed = 0; let lastModelUpdate = 0; let highlightedPart; let highlightedModel; let lastStep = stepRef.current; let lastReset = resetRef.current; let lastCatalystProgress = progressRef.current; let lastMechanismProgress = progressSignal?.current ?? progressRef.current; let lastSceneVariant = sceneVariantRef.current; let cameraAnimating = true; let catalystUserControlled = false; let mechanismUserControlled = false;
    const initialCameraState = cameraStateFor(lastStep);
    let cameraGoal = initialCameraState.camera;
    let targetGoal = initialCameraState.target;
    camera.position.copy(cameraGoal);
    controls.target.copy(targetGoal);
    controls.update();
    cameraAnimating = false;
    controls.addEventListener('start', () => {
      cameraAnimating = false;
      if (lessonId === 'catalyst') catalystUserControlled = true;
      if (lessonId === 'mechanism') mechanismUserControlled = true;
    });
    const applyHighlight = (model, part) => {
      model.traverse((object) => {
        if (!object.material) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        const isSelected = !part || object.userData.part === part;
        materials.forEach((item) => {
          if (item.userData.baseOpacity === undefined) {
            item.userData.baseOpacity = item.opacity;
            item.userData.baseTransparent = item.transparent;
            item.userData.baseEmissiveIntensity = item.emissiveIntensity ?? 0;
          }
          if (!part) {
            item.opacity = item.userData.baseOpacity;
            item.transparent = item.userData.baseTransparent;
            if ('emissiveIntensity' in item) item.emissiveIntensity = item.userData.baseEmissiveIntensity;
          } else {
            item.opacity = item.userData.baseOpacity;
            item.transparent = item.userData.baseTransparent;
            if ('emissiveIntensity' in item) item.emissiveIntensity = isSelected ? Math.max(item.userData.baseEmissiveIntensity, .42) : item.userData.baseEmissiveIntensity;
          }
          item.needsUpdate = true;
        });
      });
    };
    const animate = () => {
      const deltaTime = Math.min(clock.getDelta(), .05); elapsed += deltaTime; const t = elapsed;
      if (document.hidden || !inViewport) { frame = requestAnimationFrame(animate); return; }
      const target = progressSignal?.current ?? progressRef.current;
      // Guided progress is already interpolated by App. Keeping a second hidden
      // easing layer here made cameras arrive ahead of their visual state.
      currentProgress = target;
      if (cameraNeedsReset) {
        const state = lessonId === 'catalyst' ? catalystStateForProgress(currentProgress) : cameraStateFor(lastStep);
        camera.position.copy(state.camera); controls.target.copy(state.target);
        cameraGoal = state.camera; targetGoal = state.target;
        cameraAnimating = false; cameraNeedsReset = false;
      }
      if (lessonId === 'analysis' && sceneVariantRef.current !== lastSceneVariant) {
        lastSceneVariant = sceneVariantRef.current;
        const st = cameraStateFor(0);
        cameraGoal = st.camera; targetGoal = st.target;
        cameraAnimating = true;
        queueModelReplacement(0, `analysis-${lastSceneVariant}`);
      }
      if (lessonId === 'mechanism' && sceneVariantRef.current !== lastSceneVariant) {
        lastSceneVariant = sceneVariantRef.current;
        const state = cameraStateFor(0);
        cameraGoal = state.camera; targetGoal = state.target;
        cameraAnimating = true;
        queueModelReplacement(0, `mechanism-${lastSceneVariant}`);
      }
      if (lessonId === 'catalyst' && Math.abs(target - lastCatalystProgress) > .002) {
        if (!catalystUserControlled) {
          const state = catalystStateForProgress(currentProgress);
          cameraGoal = state.camera; targetGoal = state.target;
          cameraAnimating = true;
        }
        lastCatalystProgress = target;
      }
      if (lessonId === 'mechanism' && Math.abs(target - lastMechanismProgress) > .002) {
        if (!mechanismUserControlled) {
          const state = mechanismStateForProgress(currentProgress);
          cameraGoal = state.camera; targetGoal = state.target;
          cameraAnimating = true;
        }
        lastMechanismProgress = target;
      }
      if (stepRef.current !== lastStep) {
        lastStep = stepRef.current;
        if (lessonId === 'catalyst') {
          catalystUserControlled = false;
        } else if (lessonId === 'mechanism') {
          mechanismUserControlled = false;
          const state = mechanismStateForProgress(currentProgress);
          cameraGoal = state.camera; targetGoal = state.target;
          cameraAnimating = true;
        } else {
          const state = cameraStateFor(lastStep);
          cameraGoal = state.camera; targetGoal = state.target;
          cameraAnimating = true;
        }
      }
      if (resetRef.current !== lastReset) {
        lastReset = resetRef.current;
        catalystUserControlled = false;
        mechanismUserControlled = false;
        const currentSignalProgress = progressSignal?.current ?? progressRef.current;
        const state = lessonId === 'catalyst' ? catalystStateForProgress(currentSignalProgress) : lessonId === 'mechanism' ? mechanismStateForProgress(currentSignalProgress) : cameraStateFor(lastStep);
        cameraGoal = state.camera; targetGoal = state.target;
        cameraAnimating = true;
      }
      if (cameraAnimating) {
        camera.position.lerp(cameraGoal, 1 - Math.exp(-4.8 * deltaTime));
        controls.target.lerp(targetGoal, 1 - Math.exp(-4.8 * deltaTime));
        if (camera.position.distanceTo(cameraGoal) < .03 && controls.target.distanceTo(targetGoal) < .02) cameraAnimating = false;
      }
      const activeModel = modelRoot.children[0];
      if (typeof activeModel?.userData.update === 'function') {
        activeModel.userData.update(currentProgress, parametersRef.current, stepRef.current, t);
      } else if (t - lastModelUpdate > .033) {
        const nextKey = discreteBuilders.has(lessonId)
          ? discreteModelKey(lessonId, currentProgress)
          : Math.round(currentProgress * 100) / 100;
        if (nextKey !== renderedKey) {
          if (discreteBuilders.has(lessonId)) queueModelReplacement(nextKey, nextKey);
          else replaceModel(nextKey, nextKey);
        }
        lastModelUpdate = t;
      }
      if (compactMode) {
        modelRoot.traverse((object) => {
          if (object.userData.worldLabel) object.visible = false;
        });
      }
      const displayedModel = modelRoot.children[0];
      if (selectedPartRef.current !== highlightedPart || displayedModel !== highlightedModel) {
        applyHighlight(displayedModel, selectedPartRef.current);
        highlightedPart = selectedPartRef.current;
        highlightedModel = displayedModel;
      }
      modelRoot.traverse((o) => {
        if (o.userData.float === undefined) return;
        if (o.userData.baseX === undefined) o.userData.baseX = o.position.x;
        o.position.x = o.userData.baseX + Math.sin(t * 1.7 + o.userData.float) * .012;
      });
      controls.update(); renderer.render(scene, camera); frame = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      cancelAnimationFrame(frame); clearTimeout(modelSwapTimer); cancelAnimationFrame(modelFadeFrame); observer.disconnect(); visibilityObserver.disconnect(); controls.dispose(); renderer.domElement.removeEventListener('pointerdown', pointerDown); renderer.domElement.removeEventListener('pointerup', click);
      disposeObject(modelRoot);
      renderer.dispose(); mount.removeChild(renderer.domElement);
    };
  }, [lessonId, color]);

  return <div className="scene" ref={mountRef} aria-label={`Interactive 3D model for ${lessonId}`} />;
}

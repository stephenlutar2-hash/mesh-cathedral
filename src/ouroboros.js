// Ouroboros ring — a glowing gold torus threading all 5 chakras, with receipt
// particles flowing continuously along it. Each particle is colour-coded for its
// current loop step (sign/gate/chain/memory/replay). The serpent eats its tail.
// Also drives the CENTER COUNTER: total signed receipts across the mesh, summed
// live from each flagship's metrics. Doctrine v11 LOCKED. ZERO BANDAID.
import { CHAKRAS, GOLD, RING_RADIUS, PARTICLE_COUNT, LOOP_STEPS } from './config.js';

let THREEref, ring, particleMesh, dummy, particles = [];
let counterEl, lastTotal = null, displayTotal = 0;
// chakra anchor angles around the ring, sorted, so particles hop character->character
let chakraAngles = [];

export function buildOuroboros(scene, THREE){
  THREEref = THREE;
  // the ring torus (slightly above center plane, tilted for depth)
  ring = new THREE.Mesh(
    new THREE.TorusGeometry(RING_RADIUS, 0.10, 12, 220),
    new THREE.MeshStandardMaterial({ color:GOLD, emissive:GOLD, emissiveIntensity:0.7, roughness:0.4 }));
  ring.rotation.x = Math.PI/2; ring.position.y = 3;
  scene.add(ring);

  // anchor angles of the 5 chakras around the ring (the "stations" of the loop)
  chakraAngles = CHAKRAS.map(c => c.angle).sort((a,b)=>a-b);

  // a faint serpent overlay so the "ouroboros" reads as a creature, not just a torus
  const serpent = new THREE.Mesh(
    new THREE.TorusGeometry(RING_RADIUS, 0.26, 8, 160),
    new THREE.MeshBasicMaterial({ color:0x6b4e1f, transparent:true, opacity:0.18, wireframe:true }));
  serpent.rotation.x = Math.PI/2; serpent.position.y = 3; scene.add(serpent);

  // instanced particles = receipts in flight
  const geo = new THREE.SphereGeometry(0.16, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ vertexColors:false });
  particleMesh = new THREE.InstancedMesh(geo, mat, PARTICLE_COUNT);
  particleMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(PARTICLE_COUNT*3), 3);
  dummy = new THREE.Object3D();
  for (let i=0;i<PARTICLE_COUNT;i++){
    const step = LOOP_STEPS[i % LOOP_STEPS.length];
    particles.push({
      u: Math.random(),                          // position along ring [0,1)
      speed: 0.02 + Math.random()*0.03,          // loop speed
      step,                                       // current loop step (colour)
      stepIdx: i % LOOP_STEPS.length,
    });
    const c = new THREE.Color(step.color);
    particleMesh.instanceColor.setXYZ(i, c.r, c.g, c.b);
  }
  particleMesh.instanceColor.needsUpdate = true;
  scene.add(particleMesh);

  counterEl = document.getElementById('counterNum');
  pollReceipts();
  setInterval(pollReceipts, 30000);   // re-sum every 30s
}

export function updateOuroboros(t){
  if (!particleMesh) return;
  for (let i=0;i<particles.length;i++){
    const p = particles[i];
    p.u += p.speed * 0.0025;
    if (p.u >= 1){ p.u -= 1;
      // advance to next loop step at each lap segment boundary handled below
    }
    // map u -> position on the tilted ring (matches ring.rotation.x = PI/2)
    const ang = p.u * Math.PI*2;
    const x = Math.cos(ang) * RING_RADIUS;
    const z = Math.sin(ang) * RING_RADIUS;
    // station emit: when a particle passes a chakra's angle, flag an emit pulse
    if (window.__meshEmit){
      for (let s=0;s<chakraAngles.length;s++){
        const ca = ((chakraAngles[s] % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
        const pa = ((ang) % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
        if (Math.abs(pa - ca) < 0.04){ window.__meshEmit(ca); }
      }
    }
    // colour-code by which 1/5 segment of the loop the particle is in
    const seg = Math.floor(p.u * LOOP_STEPS.length) % LOOP_STEPS.length;
    if (seg !== p.stepIdx){
      p.stepIdx = seg; p.step = LOOP_STEPS[seg];
      const c = new THREEref.Color(p.step.color);
      particleMesh.instanceColor.setXYZ(i, c.r, c.g, c.b);
      particleMesh.instanceColor.needsUpdate = true;
    }
    dummy.position.set(x, 3 + Math.sin(t*2 + i)*0.12, z);
    dummy.scale.setScalar(0.8 + 0.4*Math.sin(t*3 + i));
    dummy.updateMatrix();
    particleMesh.setMatrixAt(i, dummy.matrix);
  }
  particleMesh.instanceMatrix.needsUpdate = true;

  // animate the displayed counter toward the live total
  if (lastTotal !== null && displayTotal < lastTotal){
    displayTotal = Math.min(lastTotal, displayTotal + Math.max(1, Math.ceil((lastTotal-displayTotal)/30)));
    counterEl.textContent = displayTotal.toLocaleString();
  }
}

// ---- live receipt totals (real endpoints; honest "—" when unavailable) ----
async function pollReceipts(){
  let sum = 0, any = false;
  await Promise.all(CHAKRAS.map(async c => {
    try {
      const r = await fetch(c.metrics.url, { cache:'no-store' });
      if (!r.ok) return;
      if (c.metrics.kind === 'prom'){
        const txt = await r.text();
        const m = txt.match(new RegExp('^'+c.metrics.key+'\\s+([0-9]+)', 'm'));
        if (m){ sum += parseInt(m[1],10); any = true; }
      } else {
        const j = await r.json();
        // ZERO BANDAID: only count REAL receipt/chain-depth fields. Never use
        // corpus 'declarations' as a fake receipt count. A flagship with no live
        // receipt counter honestly contributes 0 (but still counts as reachable).
        const k = c.metrics.key;
        const v = (k && typeof j[k] === 'number') ? j[k]
          : (typeof j.receipts_total === 'number' ? j.receipts_total
          : (typeof j.chain_depth === 'number' ? j.chain_depth : 0));
        sum += v; any = true;
      }
    } catch(e){ /* offline flagship -> skipped honestly */ }
  }));
  if (any){ lastTotal = sum; }
  else { counterEl.textContent = '—'; counterEl.title = 'No flagship reachable'; }
}

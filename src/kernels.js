// Kernel orbits — 7 universal kernel dots + 2 vertical kernel dots orbit each
// chakra. Click a kernel dot -> side panel shows its docs + recent activity polled
// from the live flagship. Top-HUD status badges per chakra polled from /healthz
// every 30s (green/amber/red). Doctrine v11 LOCKED. ZERO BANDAID.
import { CHAKRAS, UNIVERSAL_KERNELS, GOLD } from './config.js';
import { openKernelPanel } from './codex.js';

let THREEref;
const orbiters = [];   // {mesh, chakraId, kernel, radius, speed, phase, tilt, vertical}

export function buildKernels(scene, THREE, chakraGroups, _openCodex){
  THREEref = THREE;
  buildBadges();
  CHAKRAS.forEach(c => {
    const g = chakraGroups[c.id];
    if (!g) return;
    const col = new THREE.Color(c.color);

    // 7 universal kernels on inner orbit
    UNIVERSAL_KERNELS.forEach((k, i) => {
      const dot = kernelDot(THREE, col, false);
      addOrbiter(scene, g, dot, c, k, 3.4, 0.5 + i*0.07, (i/7)*Math.PI*2, (i%2?0.4:-0.4), false);
    });
    // 2 vertical kernels on outer orbit, slightly different glow (gold-tinted)
    c.vertical.forEach((k, i) => {
      const dot = kernelDot(THREE, new THREE.Color(GOLD), true);
      addOrbiter(scene, g, dot, c, k, 4.6, 0.35 + i*0.05, (i*Math.PI), 0.9, true);
    });
  });
}

function kernelDot(THREE, col, vertical){
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(vertical ? 0.22 : 0.17, 12, 12),
    new THREE.MeshStandardMaterial({ color:col, emissive:col, emissiveIntensity: vertical?1.0:0.7, roughness:0.3 }));
  if (vertical){
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.34,0.025,6,16),
      new THREE.MeshBasicMaterial({ color:GOLD, transparent:true, opacity:0.7 }));
    m.add(halo);
  }
  return m;
}

function addOrbiter(scene, parentGroup, dot, chakra, kernel, radius, speed, phase, tilt, vertical){
  parentGroup.add(dot);
  dot.userData.kernelClick = () => openKernelPanel(chakra, kernel, vertical);
  orbiters.push({ mesh:dot, chakra, kernel, radius, speed, phase, tilt, vertical });
}

export function updateKernels(t){
  for (const o of orbiters){
    const a = t * o.speed + o.phase;
    o.mesh.position.set(
      Math.cos(a) * o.radius,
      Math.sin(a*0.7 + o.tilt) * o.radius * 0.35,
      Math.sin(a) * o.radius
    );
  }
}

// ---------------- top-HUD status badges ----------------
function buildBadges(){
  const hud = document.getElementById('topHUD');
  const allBtn = document.getElementById('allCodices');
  CHAKRAS.forEach(c => {
    const b = document.createElement('button');
    b.className = 'badge'; b.id = 'badge-'+c.id;
    b.setAttribute('aria-label', c.label+' status — tap to open codex');
    b.innerHTML = `<span class="dot" id="dot-${c.id}"></span>${c.label}`;
    b.onclick = () => import('./codex.js').then(m => m.openChakraCodex(c.id));
    hud.insertBefore(b, allBtn);
  });
}

export async function pollStatus(){
  await Promise.all(CHAKRAS.map(async c => {
    const dot = document.getElementById('dot-'+c.id);
    if (!dot) return;
    try {
      const r = await fetch(c.health.url, { cache:'no-store' });
      if (r.ok){
        let ok = true;
        try { const j = await r.json(); ok = (j.status === 'ok' || j.status === undefined); } catch(e){}
        dot.className = 'dot ' + (ok ? 'green' : 'amber');
      } else dot.className = 'dot amber';
    } catch(e){ dot.className = 'dot red'; }
  }));
  setTimeout(pollStatus, 30000);
}

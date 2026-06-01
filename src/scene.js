// Mesh Cathedral — Three.js r171 scene orchestrator.
// 5 chakras as procedural 3D character meshes around an Ouroboros ring.
// WebGL2 (WebGLRenderer) baseline; mobile-tuned per SZL_MOBILE_FIRST_STANDARD.
// Doctrine v11 LOCKED (749 / 14 / 163). ZERO BANDAID.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CHAKRAS, GOLD, BG, RING_RADIUS, MOBILE, REDUCED } from './config.js';
import { buildOuroboros, updateOuroboros } from './ouroboros.js';
import { buildKernels, updateKernels, pollStatus } from './kernels.js';
import { initCodex, openChakraCodex } from './codex.js';

let scene, camera, renderer, composer, controls, clock, raycaster, pointer;
let chakraGroups = {};   // id -> THREE.Group
let pickTargets = [];    // meshes that open a chakra codex

const MC = (typeof window.SZLMobileControls !== 'undefined') ? window.SZLMobileControls : null;

// --- dynamic viewport var (iOS URL bar) ---
function vh(){ document.documentElement.style.setProperty('--vh',(innerHeight*0.01)+'px'); }
vh(); addEventListener('resize', vh); addEventListener('orientationchange', vh);

init();

function init(){
  const wrap = document.getElementById('scene');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.FogExp2(BG, 0.018);

  camera = new THREE.PerspectiveCamera(52, innerWidth/innerHeight, 0.1, 500);
  camera.position.set(0, 6, MOBILE ? 42 : 34);

  const hints = MC ? MC.rendererHints() : { antialias:!MOBILE, powerPreference:MOBILE?'low-power':'high-performance', pixelRatio:Math.min(devicePixelRatio, MOBILE?1.5:2) };
  renderer = new THREE.WebGLRenderer({ antialias: hints.antialias, powerPreference: hints.powerPreference });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  wrap.appendChild(renderer.domElement);

  // lights — warm gold key + cool fill
  scene.add(new THREE.AmbientLight(0x223044, 0.55));
  const key = new THREE.DirectionalLight(0xffe4b0, 1.0); key.position.set(8, 18, 12); scene.add(key);
  const fill = new THREE.DirectionalLight(0x88aaff, 0.35); fill.position.set(-14, 6, 10); scene.add(fill);
  const gold = new THREE.PointLight(GOLD, 1.2, 80); gold.position.set(0, 3, 0); scene.add(gold);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight),
    MOBILE ? 0.55 : 0.95, 0.55, 0.18));

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minDistance = 14; controls.maxDistance = 90;
  controls.target.set(0, 3, 0);
  if (MOBILE){ controls.rotateSpeed = 0.65; controls.zoomSpeed = 0.85; controls.enablePan = true; }
  if (!REDUCED){ controls.autoRotate = true; controls.autoRotateSpeed = MOBILE ? 0.3 : 0.45; }

  raycaster = new THREE.Raycaster(); pointer = new THREE.Vector2();
  clock = new THREE.Clock();

  // emit-pulse hook: ouroboros calls this when a receipt particle crosses a chakra
  window.__meshEmit = (ang) => {
    for (const id in chakraGroups){
      const g = chakraGroups[id];
      if (g.userData.rim && Math.abs(g.userData.angle - ang) < 0.05){
        g.userData.emit = 1.0;   // decays in animate()
      }
    }
  };

  buildStarfield();
  buildChakras();
  buildOuroboros(scene, THREE);
  buildKernels(scene, THREE, chakraGroups, openChakraCodex);
  initCodex();

  // central counter pedestal glow
  const ped = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.6, 48),
    new THREE.MeshBasicMaterial({ color:GOLD, transparent:true, opacity:0.4, side:THREE.DoubleSide }));
  ped.rotation.x = -Math.PI/2; ped.position.y = -0.5; scene.add(ped);

  // build SHA into bottom HUD (from rosie /healthz which carries the corpus SHA)
  fetch(CHAKRAS[0].health.url).then(r=>r.json()).then(j=>{
    if (j && j.sha) document.getElementById('buildSha').textContent = String(j.sha).slice(0,10);
  }).catch(()=>{ document.getElementById('buildSha').textContent = 'offline'; });

  pollStatus();                  // health badges (every 30s, set inside)
  addEventListener('resize', onResize);
  renderer.domElement.addEventListener('pointerdown', onPick);
  renderer.domElement.addEventListener('touchstart', (e)=>{ if(e.touches.length===1) onPick(e.touches[0]); }, {passive:true});

  if (MOBILE) document.body.classList.add('szl-mobile');   // vertical 5-row badge stack + touch tuning
  document.getElementById('loader').classList.add('hidden');
  animate();
}

// ---------- procedural character meshes (the 5 chakras) ----------
function buildChakras(){
  CHAKRAS.forEach(c => {
    const g = new THREE.Group();
    const x = Math.cos(c.angle) * RING_RADIUS;
    const z = Math.sin(c.angle) * RING_RADIUS;
    g.position.set(x, 3, z);
    g.userData = { chakra: c };
    const col = new THREE.Color(c.color);

    let body;
    switch(c.id){
      case 'rosie':     body = rosieHead(col); break;
      case 'a11oy':     body = khipuCord(col); break;
      case 'amaru':     body = serpentCoil(col); break;
      case 'sentra':    body = hexShield(col); break;
      case 'killinchu': body = kestrelDrones(col); break;
    }
    g.add(body);

    // warm gold rim ring under each chakra (brightens when the loop crosses it)
    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.06, 8, 48),
      new THREE.MeshBasicMaterial({ color:GOLD, transparent:true, opacity:0.5 }));
    rim.rotation.x = Math.PI/2; rim.position.y = -2.4; g.add(rim);
    g.userData.rim = rim;
    g.userData.angle = ((c.angle % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);

    // label sprite
    g.add(makeLabel(c.label, col));

    scene.add(g);
    chakraGroups[c.id] = g;
    body.traverse(o => { if (o.isMesh){ o.userData.chakraId = c.id; pickTargets.push(o); } });
  });
}

function makeLabel(text, col){
  const cv = document.createElement('canvas'); cv.width=256; cv.height=64;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#'+col.getHexString(); ctx.font = 'bold 34px monospace';
  ctx.textAlign='center'; ctx.shadowColor='#000'; ctx.shadowBlur=8;
  ctx.fillText(text, 128, 44);
  const tex = new THREE.CanvasTexture(cv);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true }));
  spr.scale.set(5,1.25,1); spr.position.y = 3.6; return spr;
}

// --- ROSIE: ethereal wireframe head ---
function rosieHead(col){
  const grp = new THREE.Group();
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(2, 2),
    new THREE.MeshBasicMaterial({ color:col, wireframe:true, transparent:true, opacity:0.7 }));
  const brain = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 4),
    new THREE.MeshStandardMaterial({ color:0xcbd5e1, emissive:col, emissiveIntensity:0.5, roughness:0.6, flatShading:true }));
  const p = brain.geometry.attributes.position;
  for (let i=0;i<p.count;i++){ const n=0.18*Math.sin(p.getX(i)*3)*Math.cos(p.getY(i)*3);
    p.setXYZ(i,p.getX(i)*(1+n),p.getY(i)*(1+n),p.getZ(i)*(1+n)); }
  p.needsUpdate=true; brain.geometry.computeVertexNormals();
  grp.add(head, brain); return grp;
}

// --- a11oy: 16-node knotted Khipu cord (vertical pendant + knots) ---
function khipuCord(col){
  const grp = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color:col, emissive:col, emissiveIntensity:0.3, roughness:0.5 });
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,4.4,8), mat);
  grp.add(cord);
  for (let i=0;i<16;i++){
    const y = 2 - i*(4/15);
    const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.22,0.07,40,6,2,3), mat);
    knot.position.y = y; knot.rotation.x = i*0.5; grp.add(knot);
  }
  return grp;
}

// --- amaru: serpent-coil neural mesh ---
function serpentCoil(col){
  const grp = new THREE.Group();
  const serpent = new THREE.Mesh(new THREE.TorusKnotGeometry(1.7,0.16,180,12,2,3),
    new THREE.MeshStandardMaterial({ color:col, emissive:col, emissiveIntensity:0.45, roughness:0.4, metalness:0.3 }));
  const cage = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4,1),
    new THREE.MeshBasicMaterial({ color:col, wireframe:true, transparent:true, opacity:0.3 }));
  grp.add(serpent, cage); return grp;
}

// --- sentra: hexagonal shield with hex panels ---
function hexShield(col){
  const grp = new THREE.Group();
  const shield = new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.1,0.4,6),
    new THREE.MeshStandardMaterial({ color:0x1a2230, emissive:col, emissiveIntensity:0.25, roughness:0.5, metalness:0.4 }));
  shield.rotation.x = Math.PI/2;
  grp.add(shield);
  // hex panel rings (wireframe hexagons)
  for (let r=0.7; r<=2; r+=0.65){
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r,0.03,6,6),
      new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:0.6 }));
    ring.position.z = 0.25; grp.add(ring);
  }
  return grp;
}

// --- killinchu: kestrel (cone+wings) + 53 drone dots over terrain ---
function kestrelDrones(col){
  const grp = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.4,1.6,8),
    new THREE.MeshStandardMaterial({ color:col, emissive:col, emissiveIntensity:0.5, roughness:0.4 }));
  body.rotation.x = Math.PI/2; grp.add(body);
  const wingGeo = new THREE.BoxGeometry(2.6,0.06,0.5);
  const wing = new THREE.Mesh(wingGeo, new THREE.MeshStandardMaterial({ color:col, emissive:col, emissiveIntensity:0.3 }));
  grp.add(wing);
  // 53 drone dots scattered below in a terrain disc
  const dotGeo = new THREE.SphereGeometry(0.06,6,6);
  const dotMat = new THREE.MeshBasicMaterial({ color:0xffe4b0 });
  for (let i=0;i<53;i++){
    const a = Math.random()*Math.PI*2, rr = Math.random()*2.4;
    const d = new THREE.Mesh(dotGeo, dotMat);
    d.position.set(Math.cos(a)*rr, -1.6 - Math.random()*0.4, Math.sin(a)*rr);
    grp.add(d);
  }
  return grp;
}

function buildStarfield(){
  const n = MOBILE ? 900 : 1800, pos = [];
  for (let i=0;i<n;i++) pos.push((Math.random()-0.5)*300,(Math.random()-0.5)*300,(Math.random()-0.5)*300);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color:0x33415a, size:0.4 })));
}

// ---------- picking: click a chakra body -> open its codex ----------
function onPick(ev){
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((ev.clientX-rect.left)/rect.width)*2 - 1;
  pointer.y = -((ev.clientY-rect.top)/rect.height)*2 + 1;
  raycaster.setFromCamera(pointer, camera);
  // kernels handle their own dots; here we test chakra bodies + kernel dots
  const hits = raycaster.intersectObjects(scene.children, true);
  for (const h of hits){
    if (h.object.userData && h.object.userData.kernelClick){ h.object.userData.kernelClick(); return; }
    if (h.object.userData && h.object.userData.chakraId){ openChakraCodex(h.object.userData.chakraId); return; }
  }
}

function onResize(){
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
}

function animate(){
  requestAnimationFrame(animate);
  if (document.hidden) return;          // battery saver
  const t = clock.getElapsedTime(), dt = clock.getDelta();
  // each chakra rotates at its own rate
  if (!REDUCED){
    CHAKRAS.forEach(c => { const g = chakraGroups[c.id]; if (g) g.children[0].rotation.y += c.rate*0.02; });
  }
  // decay each chakra's emit pulse -> rim opacity flares then settles
  for (const id in chakraGroups){
    const g = chakraGroups[id];
    if (g.userData.rim){
      g.userData.emit = Math.max(0, (g.userData.emit||0) - dt*1.8);
      g.userData.rim.material.opacity = 0.5 + g.userData.emit*0.5;
      g.userData.rim.scale.setScalar(1 + g.userData.emit*0.15);
    }
  }
  updateOuroboros(t);
  updateKernels(t);
  controls.update();
  composer.render();
}

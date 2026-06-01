// Mesh Cathedral — shared config. Doctrine v11 LOCKED (749 / 14 / 163).
// ZERO BANDAID: every endpoint is real; missing data is shown honestly as "—".

export const GOLD = 0xd4a444;
export const BG   = '#0a0e14';

// The 5 chakras. Positions = pentagon around the Ouroboros ring (radius R).
// Each carries 7 universal kernels + 2 vertical kernels (= 45 total across the mesh).
export const UNIVERSAL_KERNELS = [
  { name:'SIGN',   does:'DSSE signing of any action',            substrate:'wire-d' },
  { name:'GATE',   does:'Yuyay-13 axis check',                   substrate:'puriq-os' },
  { name:'CHAIN',  does:'Khipu DAG append + RS(10,6)',           substrate:'khipu-os' },
  { name:'MEMORY', does:'Unay receipt-keyed recall',             substrate:'unay' },
  { name:'REPLAY', does:'AYNI event-sourcing',                   substrate:'ayni-os' },
  { name:'MCP',    does:'Tool-bus exposure',                     substrate:'hatun-mcp' },
  { name:'WIRE',   does:'Cross-organ traceparent (Wire D/E/F/G)',substrate:'wire-d' },
];

// Ouroboros loop step colours (mirror chakras.md §3 colour key)
export const LOOP_STEPS = [
  { step:'SIGN',   color:0x7fe3ff },
  { step:'GATE',   color:0xffd23f },
  { step:'CHAIN',  color:0xd4a444 },
  { step:'MEMORY', color:0x9dff7f },
  { step:'REPLAY', color:0xff7fd0 },
];

const HF = (s) => `https://szlholdings-${s}.hf.space`;

export const CHAKRAS = [
  {
    id:'rosie', label:'ROSIE', glyph:'wireframe head',
    angle: Math.PI/2,            // center-ish / top of pentagon visually; placed at front
    color:0x7fe3ff, rate:0.18, base: HF('rosie'),
    vertical:[ {name:'AIDE',does:'personal assistant agent'},
               {name:'RECALL-PERSONAL',does:'personal-memory recall'} ],
    // receipts metric: rosie exposes Prometheus rosie_receipts_total at /metrics (REAL)
    metrics:{ url: HF('rosie')+'/metrics', kind:'prom', key:'rosie_receipts_total' },
    health:{ url: HF('rosie')+'/healthz', kind:'json' },
    codex:[
      { label:'Rosie Cookbook — /api/rosie/v2/cookbook', href: HF('rosie')+'/api/rosie/v2/cookbook' },
      { label:'Rosie Identity (v3 · doctrine v11) — /api/rosie/v2/identity', href: HF('rosie')+'/api/rosie/v2/identity' },
    ],
  },
  {
    id:'a11oy', label:'A11OY', glyph:'16-node Khipu cord',
    angle: Math.PI/2 + 2*Math.PI/5,
    color:0x3b82f6, rate:0.13, base: HF('a11oy'),
    vertical:[ {name:'ROUTE',does:'LLM router'},
               {name:'ORCHESTRATE',does:'PURIQ-OS host'} ],
    // a11oy exposes no live receipt counter yet -> honestly contributes 0 (not faked)
    metrics:{ url: HF('a11oy')+'/api/a11oy/healthz', kind:'json', key:'khipu_nodes' },
    health:{ url: HF('a11oy')+'/api/a11oy/healthz', kind:'json' },
    codex:[
      { label:'PURIQ formulas — /api/a11oy/v1/puriq/formulas', href: HF('a11oy')+'/api/a11oy/v1/puriq/formulas' },
      { label:'Hatun-MCP tool list — /api/a11oy/v1/hatun-mcp/tools', href: HF('a11oy')+'/api/a11oy/v1/hatun-mcp/tools' },
    ],
  },
  {
    id:'amaru', label:'AMARU', glyph:'serpent-coil neural mesh',
    angle: Math.PI/2 + 4*Math.PI/5,
    color:0x9dff7f, rate:0.11, base: HF('amaru'),
    vertical:[ {name:'CORTEX-LEDGER',does:'memory-cortex ledger'},
               {name:'AXIS-TRACK',does:'yuyay axis tracking'} ],
    // amaru exposes no live receipt counter yet -> honestly contributes 0 (not faked)
    metrics:{ url: HF('amaru')+'/api/amaru/healthz', kind:'json', key:'khipu_nodes' },
    health:{ url: HF('amaru')+'/api/amaru/healthz', kind:'json' },
    codex:[
      { label:'Amaru Cortex — /api/amaru/v1/cortex/stats', href: HF('amaru')+'/api/amaru/v1/cortex/stats' },
      { label:'Amaru health (traceparent LIVE) — /api/amaru/healthz', href: HF('amaru')+'/api/amaru/healthz' },
    ],
  },
  {
    id:'sentra', label:'SENTRA', glyph:'hexagonal shield',
    angle: Math.PI/2 + 6*Math.PI/5,
    color:0xff7fd0, rate:0.16, base: HF('sentra'),
    vertical:[ {name:'FILTER',does:'dual-use / content gate'},
               {name:'THREAT-SCORE',does:'immune-system threat scoring'} ],
    // sentra exposes no live receipt counter yet -> honestly contributes 0 (not faked)
    metrics:{ url: HF('sentra')+'/api/sentra/healthz', kind:'json', key:'khipu_nodes' },
    health:{ url: HF('sentra')+'/api/sentra/healthz', kind:'json' },
    codex:[
      { label:'Dual-use check — /sentra/dual-use/check', href: HF('sentra')+'/sentra/dual-use/check' },
      { label:'Sentra health (immune system) — /api/sentra/healthz', href: HF('sentra')+'/api/sentra/healthz' },
    ],
  },
  {
    id:'killinchu', label:'KILLINCHU', glyph:'kestrel + 53 drones',
    angle: Math.PI/2 + 8*Math.PI/5,
    color:0xffd23f, rate:0.14, base: HF('killinchu'),
    vertical:[ {name:'GEOFENCE',does:'geospatial boundary'},
               {name:'MISSION-PLAN',does:'mission/route planning'} ],
    // killinchu exposes khipu_nodes (real chain depth) in /healthz
    metrics:{ url: HF('killinchu')+'/api/killinchu/healthz', kind:'json', key:'khipu_nodes' },
    health:{ url: HF('killinchu')+'/api/killinchu/healthz', kind:'json' },
    codex:[
      { label:'Killinchu Cookbook — /api/killinchu/v2/cookbook', href: HF('killinchu')+'/api/killinchu/v2/cookbook' },
      { label:'Killinchu health — /api/killinchu/healthz', href: HF('killinchu')+'/api/killinchu/healthz' },
    ],
  },
];

export const RING_RADIUS = 13;   // Ouroboros torus radius
// ?forceMobile=1 lets reviewers/screenshots exercise the mobile branch on desktop.
const FORCE_MOBILE = /[?&]forceMobile=1/.test(location.search);
export const MOBILE = FORCE_MOBILE || ((typeof window.SZLMobileControls !== 'undefined')
  ? window.SZLMobileControls.isMobileDevice() : (('ontouchstart' in window)||navigator.maxTouchPoints>0));
export const REDUCED = (typeof window.SZLMobileControls !== 'undefined')
  ? window.SZLMobileControls.prefersReducedMotion()
  : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const PARTICLE_COUNT = MOBILE ? 80 : 200;

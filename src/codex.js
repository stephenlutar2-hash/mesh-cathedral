// Codex panel — click any chakra -> its codex (recipes/theses/formulas) opens in
// the side panel. Click a kernel dot -> that kernel's docs + recent live activity.
// Top-right "All Codices" -> unified search across all 5 chakras' codices.
// Doctrine v11 LOCKED. ZERO BANDAID — links are real; live activity shows honest state.
import { CHAKRAS, UNIVERSAL_KERNELS } from './config.js';

let panel, body, closeBtn;

export function initCodex(){
  panel = document.getElementById('panel');
  body = document.getElementById('panelBody');
  closeBtn = document.getElementById('panelClose');
  closeBtn.onclick = closePanel;
  document.getElementById('allCodices').onclick = openAllCodices;
  addEventListener('keydown', e => { if (e.key==='Escape') closePanel(); });
}

function openPanel(){ panel.classList.add('open'); }
function closePanel(){ panel.classList.remove('open'); }

function chakraById(id){ return CHAKRAS.find(c => c.id===id); }

// ---------- chakra codex ----------
export function openChakraCodex(id){
  const c = chakraById(id); if (!c) return;
  const col = '#'+c.color.toString(16).padStart(6,'0');
  const kernels = UNIVERSAL_KERNELS.map(k => `<span class="ktag">${k.name}</span>`).join('')
    + c.vertical.map(k => `<span class="ktag vert">${k.name}</span>`).join('');
  body.innerHTML = `
    <h2 style="color:${col}">${c.label}</h2>
    <div class="sub">${c.glyph} · 9 kernels (7 universal + 2 vertical)</div>
    <h3>Codex</h3>
    ${c.codex.map(x => `<a class="link" href="${x.href}" target="_blank" rel="noopener">${x.label}</a>`).join('')}
    <h3>Kernels (wheel)</h3>
    <div id="kernelList">${kernels}</div>
    <h3>Live</h3>
    <div class="kv" id="liveBox">polling ${c.label}…</div>
  `;
  openPanel();
  pollChakraLive(c);
}

async function pollChakraLive(c){
  const boxEl = document.getElementById('liveBox');
  try {
    const r = await fetch(c.health.url, { cache:'no-store' });
    if (!r.ok){ boxEl.textContent = `health → HTTP ${r.status}`; return; }
    let j; try { j = await r.json(); } catch(e){ boxEl.textContent='health → 200 (non-JSON)'; return; }
    const bits = [];
    if (j.status) bits.push(`status: <b>${j.status}</b>`);
    if (j.version) bits.push(`version: ${j.version}`);
    if (j.doctrine) bits.push(`doctrine: ${j.doctrine}`);
    if (j.numbers) bits.push(`numbers: ${j.numbers.declarations}/${j.numbers.axioms}/${j.numbers.sorries}`);
    else if (j.declarations!==undefined) bits.push(`decl: ${j.declarations} · sorries: ${j.sorries}`);
    if (j.gates) bits.push(`gates: ${j.gates}`);
    if (j.traceparent_propagating) bits.push('traceparent: LIVE');
    boxEl.innerHTML = bits.length ? bits.join('<br>') : '200 OK (no detail fields)';
  } catch(e){ boxEl.textContent = 'flagship unreachable (honest offline state)'; }
}

// ---------- kernel panel ----------
export function openKernelPanel(c, kernel, vertical){
  const col = '#'+c.color.toString(16).padStart(6,'0');
  const sub = vertical ? 'vertical kernel' : `universal kernel · substrate: ${kernel.substrate}`;
  body.innerHTML = `
    <h2 style="color:${col}">${kernel.name}</h2>
    <div class="sub">${c.label} · ${sub}</div>
    <h3>What it does</h3>
    <div class="kv">${kernel.does}</div>
    ${kernel.substrate ? `<h3>Substrate</h3><div class="kv">package: <b>${kernel.substrate}</b></div>` : ''}
    <h3>Chakra codex</h3>
    ${c.codex.map(x => `<a class="link" href="${x.href}" target="_blank" rel="noopener">${x.label}</a>`).join('')}
    <h3>Recent activity</h3>
    <div class="kv" id="liveBox">polling ${c.label}…</div>
    <p style="font-size:11px;color:#6b7c90;margin-top:18px">Spec: docs/architecture/chakras.md — the Ouroboros loop threads SIGN→GATE→CHAIN→MEMORY→REPLAY through every chakra. Doctrine v11 LOCKED (749/14/163).</p>
  `;
  openPanel();
  pollChakraLive(c);
}

// ---------- unified "All Codices" search ----------
function openAllCodices(){
  const all = CHAKRAS.flatMap(c => c.codex.map(x => ({...x, chakra:c.label, color:c.color, id:c.id})));
  body.innerHTML = `
    <h2>All Codices</h2>
    <div class="sub">Unified search across all 5 chakras (${all.length} codex links · 45 kernels)</div>
    <input id="codexSearch" placeholder="filter recipes / formulas / theses…"
      style="width:100%;padding:10px;border-radius:8px;border:1px solid #ffffff22;background:#0a0e14;color:#e8eef6;font-size:14px;margin-bottom:12px" />
    <div id="codexResults"></div>
  `;
  openPanel();
  const input = document.getElementById('codexSearch');
  const out = document.getElementById('codexResults');
  const render = (q='') => {
    const ql = q.toLowerCase();
    const rows = all.filter(x => (x.label+x.chakra).toLowerCase().includes(ql));
    out.innerHTML = rows.map(x => {
      const col = '#'+x.color.toString(16).padStart(6,'0');
      return `<a class="link" href="${x.href}" target="_blank" rel="noopener">
        <span style="color:${col};font-weight:700">${x.chakra}</span> · ${x.label}</a>`;
    }).join('') || '<div class="kv">no match</div>';
  };
  render();
  input.oninput = () => render(input.value);
  input.focus();
}

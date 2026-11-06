// Aurora canvas + a "swarm" page build. Multiplayer cursors draw grey wireframe boxes, type the text in letter by letter,
// reveal images top to bottom, then the real styling fades in. The idea is a tribute to Swarm by Joel Califa; this is a small independent implementation.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mode = new URLSearchParams(location.search).get('swarm');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rand = (a, b) => a + Math.random() * (b - a);
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// ---- aurora: three drifting orbs + slow op-art rings that follow the mouse. Runs only while the hero is on screen. ----
function aurora() {
  const cv = $('#aurora-canvas'); if (!cv || reduced) return;
  const ctx = cv.getContext('2d');
  let w, h, frame = 0, run = false, raf;
  const m = { x: .5, y: .5, tx: .5, ty: .5 };
  const orbs = [
    { x: .35, y: .4, r: .5, vx: .0003, vy: .0002, c: 'rgba(239,68,68,.14)' },
    { x: .7, y: .45, r: .42, vx: -.0002, vy: .0003, c: 'rgba(185,28,28,.10)' },
    { x: .5, y: .8, r: .48, vx: .0002, vy: -.0002, c: 'rgba(255,255,255,.03)' },
  ];
  const size = () => { w = cv.width = innerWidth; h = cv.height = innerHeight; };
  addEventListener('resize', size, { passive: true }); size();
  addEventListener('mousemove', (e) => { m.tx = e.clientX / w; m.ty = e.clientY / h; }, { passive: true });
  const draw = () => {
    if (!run) return;
    frame++; m.x += (m.tx - m.x) * .04; m.y += (m.ty - m.y) * .04;
    ctx.clearRect(0, 0, w, h);
    for (const o of orbs) {
      o.x += o.vx; o.y += o.vy;
      if (o.x < .1 || o.x > .9) o.vx *= -1; if (o.y < .1 || o.y > .9) o.vy *= -1;
      const px = (o.x + (m.x - .5) * .06) * w, py = (o.y + (m.y - .5) * .06) * h, r = o.r * Math.min(w, h);
      const g = ctx.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, o.c); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
    }
    const cx = w * .5 + (m.x - .5) * 20, cy = h * .45 + (m.y - .5) * 20, base = (frame * .4) % 120;
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const r = base + i * 140, a = Math.max(0, .04 - r / (Math.max(w, h) * .7) * .04);
      if (a > .005) { ctx.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke(); }
    }
    raf = requestAnimationFrame(draw);
  };
  const start = () => { if (!run) { run = true; draw(); } };
  const stop = () => { run = false; cancelAnimationFrame(raf); };
  start();
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? start() : stop())), { threshold: .02 }).observe($('#hero'));
}

// ---- swarm ----
const COLORS = ['#F24E1E', '#A259FF', '#1ABCFE', '#0ACF83', '#FF7262', '#FFC700', '#E8467C', '#14AE5C', '#9747FF'];
const SPEEDS = [1, 2, 4, 8];
const IMG_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 9"/></svg>';
const ARROW = (c) => `<svg width="22" height="22" viewBox="0 0 24 24" style="left:-3px;top:-3px"><path d="M5 3l14 7.5-6 1.8-2.2 6.2z" fill="${c}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
const CROSS = (c) => `<svg width="24" height="24" viewBox="0 0 24 24" style="left:-12px;top:-12px"><path d="M12 4v16M4 12h16" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/><path d="M12 4v16M4 12h16" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>`;

function swarm() {
  history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  const roots = [$('#dock'), $('#app')];
  const inSvg = (el) => !!el.closest('svg');
  const all = roots.flatMap((r) => $$('*', r)).filter((el) => !inSvg(el) || false);

  // ---------- 1. find the layers ----------
  const painted = (el) => {
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor, hasBg = bg && !/^rgba\(\d+, \d+, \d+, 0\)$|^transparent$/.test(bg);
    const hasImg = cs.backgroundImage !== 'none', hasSh = cs.boxShadow !== 'none';
    const hasBd = ['Top', 'Right', 'Bottom', 'Left'].some((s) => parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none' && !/, 0\)$/.test(cs['border' + s + 'Color']));
    return hasBg || hasImg || hasSh || hasBd ? { fill: hasBg || hasImg || hasSh, radius: cs.borderRadius } : null;
  };
  const gridEl = $('.hero-bg-grid');
  const layers = [], rectOf = new Map(), textRoots = new Set();
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const doc = (el) => { const r = el.getBoundingClientRect(); return { top: r.top + scrollY, left: r.left }; };
  const depth = (el) => { let d = 0; for (let e = el; e; e = e.parentElement) d++; return d; };
  const add = (type, el, extra = {}) => { const p = doc(el); const L = { type, el, top: p.top, left: p.left, h: el.getBoundingClientRect().height, lh: parseFloat(getComputedStyle(el).lineHeight) || 20, fixed: !!el.closest('.dock-container'), depth: depth(el), done: false, by: null, ...extra }; layers.push(L); return L; };

  for (const el of all) {
    if (el === gridEl || gridEl?.contains(el) || el.closest('#toast') || !visible(el)) continue;
    if (el.tagName === 'IMG' || el.matches('.hero-wordmark-svg')) { add('img', el); continue; }
    const pt = painted(el);
    if (pt) rectOf.set(el, add('rect', el, pt));
  }
  const ownsText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.data.trim());
  for (const el of all) {
    if (el.closest('#toast') || el.closest('svg') || !visible(el) || gridEl?.contains(el) || !ownsText(el)) continue;
    if (getComputedStyle(el).display === 'inline') {
      let p = el.parentElement, inside = false;
      for (; p; p = p.parentElement) if (textRoots.has(p)) { inside = true; break; }
      if (inside) continue;
    }
    textRoots.add(el);
    const ownerOf = (n) => { for (let p = n.parentElement; p; p = p.parentElement) if (textRoots.has(p)) return p; return null; };
    const units = [];
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) if (n.data.trim() && ownerOf(n) === el) units.push(n);
    const rl = rectOf.get(el);
    if (rl) rl.nodes = units; else add('text', el, { nodes: units });
  }
  // dependencies: a layer waits for the nearest painted ancestor (a text layer also waits for its own box)
  for (const L of layers) {
    let p = L.type === 'rect' ? L.el.parentElement : L.el;
    for (; p; p = p.parentElement) if (rectOf.has(p) && rectOf.get(p) !== L) { L.dep = rectOf.get(p); break; }
  }
  layers.sort((a, b) => a.top - b.top || a.depth - b.depth || (a.type === 'rect' ? -1 : 1) - (b.type === 'rect' ? -1 : 1) || a.left - b.left);
  // Only the subjects are built while the swarm runs: boxes, titles and one line on what each thing is. The rest waits for the end.
  const DEFER = '.hero-actions,.hero-stats-row,.hud-tech-tags,.flagship-meta,.flagship-metrics-row,.flagship-links,.saai-architecture-explorer,.spec-list,.subgrid-footer,.bento-footer,.bento-controls,.bento-link,.exp-sub,.exp-note,.edu-line,.about-text + .about-text,.quote-box,.principle-desc,.email-action-box,.social-links-row,.footer-meta,.about-grid .tech-tags-group';
  const deferred = [];
  for (let i = layers.length - 1; i >= 0; i--) if (layers[i].el.closest(DEFER)) deferred.push(layers.splice(i, 1)[0]);
  const total = layers.length;

  // small svg icons (button arrows, link icons) show once their owner is built
  const icons = $$('svg', roots[1]).filter((s) => !s.closest('.hero-wordmark-svg')).concat($$('svg', roots[0]));
  icons.forEach((s) => s.classList.add('sw-ic'));
  const pending = new Map();
  for (const L of layers) pending.set(L.el, (pending.get(L.el) || 0) + 1);

  // ---------- 2. hide everything ----------
  document.body.classList.add('sw-run');
  gridEl?.classList.add('sw-i');
  const oneLine = (t) => {   // length of the first sentence, cut to about one line
    const m = t.match(/^[\s\S]{20,110}?[.!?](?=\s|$)/);
    if (m) return m[0].length;
    if (t.length <= 96) return t.length;
    const cut = t.lastIndexOf(' ', 90); return cut > 20 ? cut : 90;
  };
  for (const L of layers) {
    if (L.type === 'rect') L.el.classList.add('sw-r');
    else if (L.type === 'img') L.el.classList.add('sw-i');
    if (L.nodes) {
      L.el.classList.add('sw-t');
      const fullT = L.nodes.map((n) => n.data).join('');
      let left = fullT.trim().length >= 37 ? (L.cap = oneLine(fullT)) : Infinity;   // long text: only its first line is built
      L.units = L.nodes.map((n) => {
        const vis = n.data.slice(0, Math.max(0, left)); left -= n.data.length;
        const w = document.createElement('span'); w.className = 'sw-w';
        const typed = document.createTextNode(''), rest = document.createElement('span'); rest.className = 'sw-rest'; rest.textContent = vis;
        w.append(typed, rest);
        if (vis.length < n.data.length) { const tail = document.createElement('span'); tail.className = 'sw-tail'; tail.textContent = n.data.slice(vis.length); w.append(tail); }
        n.replaceWith(w);
        return { w, typed, rest, vis, full: n.data, node: n };
      });
      L.len = L.units.reduce((s, u) => s + u.vis.length, 0);
    }
  }
  for (const L of deferred) L.el.classList.add('sw-x');   // gone until the swarm ends, so the boxes carry no empty space
  const setTyped = (L, n) => {
    let left = n, last = null;
    for (const u of L.units) {
      const k = clamp(left, 0, u.vis.length); left -= k;
      u.typed.data = u.vis.slice(0, k); u.rest.textContent = u.vis.slice(k);
      if (k > 0 && k < u.vis.length) last = u;
    }
    return last;
  };
  const cmp = (a, b) => a.top - b.top || a.depth - b.depth || (a.type === 'rect' ? -1 : 1) - (b.type === 'rect' ? -1 : 1) || a.left - b.left;
  const refresh = () => {   // the page is shorter now that the extras are out of the layout: re-measure
    for (const L of layers) { const r = L.el.getBoundingClientRect(); L.top = r.top + (L.fixed ? 0 : scrollY); L.left = r.left; L.h = r.height; L.w = r.width; }
    layers.sort(cmp);
  };
  refresh();
  const restoreText = (L) => { L.el.classList.remove('sw-t'); for (const u of L.units) { u.w.replaceWith(u.node); } };

  // ---------- 3. overlay, HUD, agents ----------
  const root = document.createElement('div'); root.className = 'sw-root';
  const N = 9;
  root.innerHTML = `<div class="sw-shield"></div><div class="sw-ruler sw-rt"></div><div class="sw-ruler sw-rl"></div><canvas class="sw-fx"></canvas><div class="sw-intro">PS</div>
    <div class="sw-hud"><span class="sw-dots">${COLORS.slice(0, 4).map((c) => `<i style="background:${c}"></i>`).join('')}</span>
    <span class="sw-status"><span id="sw-ag"><b>${N}</b> agents</span><span id="sw-ly"><b>0</b> / ${total} layers</span><span class="sw-bar"><i></i></span></span>
    <button data-a="tour" class="on">Touring</button><button data-a="speed">2×</button><button data-a="live" class="pri" hidden>Go live</button><button data-a="x" class="x" title="Exit (Esc)">✕</button></div>`;
  document.body.append(root);
  const hud = $('.sw-hud', root), lyEl = $('#sw-ly', root), fill = $('.sw-bar i', root), intro = $('.sw-intro', root);
  const btn = (a) => $(`[data-a="${a}"]`, root);
  requestAnimationFrame(() => { root.classList.add('on'); hud.classList.add('on'); });

  const ag = Array.from({ length: N }, (_, i) => {
    const color = COLORS[i], el = document.createElement('div'); el.className = 'sw-cur'; el.style.opacity = 0; el.innerHTML = ARROW(color);
    root.append(el);
    const left = i % 2 === 0;
    return { el, color, shape: 'arrow', x: left ? -40 : innerWidth + 40, y: rand(120, innerHeight - 120), st: 'idle', wake: .3 + i * .22, speed: rand(480, 1000), L: null, t0: 0, dur: 0, fx: 0, fy: 0, bend: 0, wx: innerWidth / 2, wy: innerHeight / 2, wt: 0, ph: null, sel: null, typed: 0, guide: null, sayAt: rand(1.5, 5) };
  });

  let T = 0, last = performance.now(), done = 0, tour = true, speed = 2, over = false, finishing = false;
  let autoY = 0, lastUser = -99, manualOff = false, lastRefresh = 0;   // autoY: where our own scrolling left the page; a different position means the visitor scrolled
  const setShape = (a, s) => { if (a.shape !== s) { a.shape = s; a.el.innerHTML = s === 'cross' ? CROSS(a.color) : ARROW(a.color); } };
  const rectNow = (L) => L.el.getBoundingClientRect();

  // ---- the crazy part: comet trails, sparks, shockwaves, guide lines, slams, speech bubbles, shake, confetti ----
  const fxc = $('.sw-fx', root), fx = fxc.getContext('2d'); let parts = [], rings = [];
  const fsize = () => { fxc.width = innerWidth; fxc.height = innerHeight; }; fsize(); addEventListener('resize', fsize);
  const burst = (x, y, color, n = 18, sp = 280) => { for (let i = 0; i < n && parts.length < 800; i++) { const an = Math.random() * 6.283, v = rand(.3, 1) * sp; parts.push({ x, y, vx: Math.cos(an) * v, vy: Math.sin(an) * v - 40, life: 0, max: rand(.5, 1.1), s: rand(2, 5), c: Math.random() < .3 ? '#fff' : color, g: 420 }); } };
  const ring = (x, y, color, big = 140) => rings.push({ x, y, c: color, r: 4, max: big, life: 0 });
  const confetti = () => { for (let i = 0; i < 70; i++) parts.push({ x: innerWidth / 2 + rand(-140, 140), y: innerHeight + 10, vx: rand(-620, 620), vy: -rand(600, 1200), life: 0, max: rand(1.4, 2.8), s: rand(5, 10), c: COLORS[(Math.random() * COLORS.length) | 0], g: 900, rect: true, rot: rand(0, 6) }); };
  const trail = (a) => { parts.push({ x: a.x + rand(-2, 2), y: a.y + rand(-2, 2), vx: rand(-20, 20), vy: rand(-20, 20), life: 0, max: rand(.2, .4), s: rand(2, 3.5), c: a.color, g: 0 }); };
  const shake = () => { const t = $('#app'); t.classList.remove('sw-shake'); void t.offsetWidth; t.classList.add('sw-shake'); };
  const pop = (el) => { el.classList.remove('sw-pop'); void el.offsetWidth; el.classList.add('sw-pop'); setTimeout(() => el.classList.remove('sw-pop'), 700); };
  const SAY = ['ship it', 'LGTM', '+1', 'nice', 'tests green', 'merging…', 'wow', 'deploy!', 'rebasing', 'ok ok ok', '🔥', 'refactor?', 'on it', 'looks good'];
  const say = (a) => { const d = document.createElement('div'); d.className = 'sw-say'; d.textContent = SAY[(Math.random() * SAY.length) | 0]; a.el.append(d); setTimeout(() => d.remove(), 1700); };
  const drawFx = (dt) => {
    fx.clearRect(0, 0, fxc.width, fxc.height);
    const d = Math.min(dt, .05);
    fx.setLineDash([5, 4]); fx.lineWidth = 1;                       // design-tool guide lines through the box being drawn
    for (const a of ag) if (a.guide) { const g = a.guide; fx.strokeStyle = a.color + 'aa'; fx.beginPath(); fx.moveTo(g.l, 0); fx.lineTo(g.l, fxc.height); fx.moveTo(g.r, 0); fx.lineTo(g.r, fxc.height); fx.moveTo(0, g.t); fx.lineTo(fxc.width, g.t); fx.moveTo(0, g.b); fx.lineTo(fxc.width, g.b); fx.stroke(); }
    fx.setLineDash([]);
    for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.life += d; const p = r.life / .6; if (p >= 1) { rings.splice(i, 1); continue; } fx.globalAlpha = 1 - p; fx.strokeStyle = r.c; fx.lineWidth = 3 * (1 - p) + 1; fx.beginPath(); fx.arc(r.x, r.y, r.r + (r.max - r.r) * easeOut(p), 0, 7); fx.stroke(); }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.life += d; if (p.life >= p.max) { parts.splice(i, 1); continue; }
      p.vy += p.g * d; p.x += p.vx * d; p.y += p.vy * d; fx.globalAlpha = 1 - p.life / p.max; fx.fillStyle = p.c;
      if (p.rect) { fx.save(); fx.translate(p.x, p.y); fx.rotate(p.rot + p.life * 8); fx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6); fx.restore(); } else fx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    }
    fx.globalAlpha = 1;
  };

  const finish = (L) => {
    L.done = true; done++;
    const left = pending.get(L.el) - 1; pending.set(L.el, left);
    if (left === 0) $$('svg', L.el).forEach((s) => s.classList.remove('sw-ic'));
    if (L.units && !L.cap) restoreText(L);
    else if (L.cap) $$('.sw-caret', L.el).forEach((c) => c.remove());
  };
  const styleRect = (L) => {
    L.el.classList.add('sw-fade'); L.el.classList.remove('sw-r');
    setTimeout(() => L.el.classList.remove('sw-fade'), 500);
  };
  const revealImg = (L) => {
    const el = L.el; el.style.clipPath = 'inset(0 0 100% 0)'; el.classList.remove('sw-i'); void el.offsetWidth;
    el.style.transition = 'clip-path .7s cubic-bezier(.2,.75,.2,1)'; el.style.clipPath = 'inset(0 0 0 0)';
    setTimeout(() => { el.style.clipPath = ''; el.style.transition = ''; }, 900);
  };
  const instant = (L) => {   // build a layer with no cursor (skipped or scrolled past)
    if (L.done) return;
    if (L.type === 'rect') L.el.classList.remove('sw-r'); else if (L.type === 'img') L.el.classList.remove('sw-i');
    if (L.cap && L.units) setTyped(L, L.cap);
    finish(L);
  };
  const topNow = (L) => L.top - (L.fixed ? 0 : scrollY);
  const reach = (L) => topNow(L) < innerHeight - 8;
  const eligible = (L) => !L.done && !L.by && (!L.dep || L.dep.done);
  const pick = () => {
    let edge = null;   // a block that starts above the screen is only taken when nothing in view is left
    for (const L of layers) {
      if (!eligible(L)) continue;
      const t = topNow(L);
      if (t + L.h < -60) { instant(L); continue; }
      if (t < innerHeight - 8) { if (t >= -20) return L; if (!edge) edge = L; }
    }
    return edge;
  };
  const makePh = (L, a) => {
    const d = document.createElement('div'); d.className = 'sw-ph' + (L.type === 'rect' && !L.fill ? ' line' : '');
    if (L.type === 'rect') d.style.borderRadius = L.radius;
    if (L.type === 'img') d.innerHTML = IMG_ICON;
    root.insertBefore(d, ag[0].el); return d;
  };
  const makeSel = (thin) => {
    const s = document.createElement('div'); s.className = 'sw-sel' + (thin ? ' thin' : ''); s.innerHTML = '<i></i><i></i><i></i><i></i><em></em>';
    root.insertBefore(s, ag[0].el); return s;
  };
  const place = (node, r, w, h) => { node.style.transform = `translate(${r.left}px,${r.top}px)`; node.style.width = w + 'px'; node.style.height = h + 'px'; };

  const golive = (instantly) => {
    if (over) return; over = true;
    removeEventListener('keydown', onKey); removeEventListener('wheel', cancelTour); removeEventListener('touchstart', cancelTour); removeEventListener('scroll', onScroll);
    for (const a of ag) { a.ph?.remove(); a.sel?.remove(); if (a.L && !a.L.done && a.L.units) { restoreText(a.L); a.L.done = true; } }
    layers.forEach(instant);
    for (const L of layers) if (L.cap && L.units) { restoreText(L); L.el.classList.add('sw-in'); setTimeout(() => L.el.classList.remove('sw-in'), 600); }
    for (const L of deferred) { L.el.classList.remove('sw-x'); L.el.classList.add('sw-in'); setTimeout(() => L.el.classList.remove('sw-in'), 600); }
    icons.forEach((s) => s.classList.remove('sw-ic'));
    document.body.classList.remove('sw-run'); gridEl?.classList.remove('sw-i');
    document.documentElement.style.scrollBehavior = '';
    root.classList.add('off'); $('#app')?.classList.remove('sw-shake');
    if (tour && !instantly) scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => root.remove(), 750);
  };
  const cancelTour = () => { lastUser = T; if (tour) { tour = false; btn('tour').classList.remove('on'); btn('tour').textContent = 'Tour'; document.documentElement.style.scrollBehavior = ''; } };
  const onKey = (e) => { if (e.key === 'Escape') golive(true); else if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(e.key)) cancelTour(); };
  const onScroll = () => { if (Math.abs(scrollY - autoY) > 3) cancelTour(); };
  addEventListener('keydown', onKey); addEventListener('wheel', cancelTour, { passive: true }); addEventListener('touchstart', cancelTour, { passive: true }); addEventListener('scroll', onScroll, { passive: true });
  document.documentElement.style.scrollBehavior = 'auto';
  hud.addEventListener('click', (e) => {
    const a = e.target.closest('button')?.dataset.a; if (!a) return;
    if (a === 'x') golive(true);
    else if (a === 'live') golive(false);
    else if (a === 'speed') { speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]; btn('speed').textContent = speed + '×'; }
    else if (a === 'tour') { tour = !tour; manualOff = !tour; autoY = scrollY; btn('tour').classList.toggle('on', tour); btn('tour').textContent = tour ? 'Touring' : 'Tour'; document.documentElement.style.scrollBehavior = tour ? 'auto' : ''; }
  });

  const beginFly = (a, L) => {
    L.by = a; a.L = L; a.st = 'fly'; a.t0 = T; a.fx = a.x; a.fy = a.y; setShape(a, 'arrow');
    const r = rectNow(L), d = Math.hypot(r.left - a.x, r.top - a.y);
    a.dur = clamp(d / a.speed, .25, .85); a.bend = (Math.random() < .5 ? -1 : 1) * rand(.04, .13) * Math.min(d, 600);
  };
  const park = (a) => {   // after a layer: rest near the work, then look for the next one
    a.st = 'idle'; a.L = null; a.wt = 0;
  };

  const frame = (now) => {
    if (over) return;
    const dt = Math.min(.2, (now - last) / 1000) * speed; last = now; T += dt;
    if (T - lastRefresh > .5) { refresh(); lastRefresh = T; }
    if (T > 2.4) intro.classList.add('gone');

    for (const a of ag) {
      if (T < a.wake) continue;
      a.el.style.opacity = 1;
      const L = a.L;
      a.guide = null;
      if (a.st === 'idle') {
        const nxt = T > 2.4 && !finishing ? pick() : null;
        if (nxt) beginFly(a, nxt);
        else {                                                    // drift around, like saai's scanning phase
          if (T > a.wt) { a.wx = innerWidth * rand(.08, .92); a.wy = innerHeight * rand(.15, .85); a.wt = T + rand(1.2, 2.6); }
          const k = Math.min(1, dt * 1.6); a.x += (a.wx - a.x) * k; a.y += (a.wy - a.y) * k;
        }
      } else if (a.st === 'fly') {
        const r = rectNow(L), p = clamp((T - a.t0) / a.dur, 0, 1), e = ease(p);
        const dx = r.left - a.fx, dy = r.top - a.fy, D = Math.hypot(dx, dy) || 1, s = Math.sin(Math.PI * e);
        a.x = a.fx + dx * e - (dy / D) * a.bend * s; a.y = a.fy + dy * e + (dx / D) * a.bend * s;
        if (p >= 1) {
          setShape(a, 'cross'); a.t0 = T; a.x = r.left; a.y = r.top; ring(a.x, clamp(a.y, 0, innerHeight), a.color, 70);
          if (L.type === 'text') { a.st = 'frame'; a.dur = clamp(r.width / (a.speed * .9), .3, .6); a.sel = makeSel(false); }
          else { a.st = 'drag'; a.dur = clamp(Math.hypot(r.width, r.height) / (a.speed * .8), .35, 1.1); a.ph = makePh(L, a); a.sel = makeSel(false); }
        }
      } else if (a.st === 'drag' || a.st === 'frame') {
        const r = rectNow(L), p = clamp((T - a.t0) / a.dur, 0, 1), e = ease(p);
        const lh = L.lh;
        const w = Math.max(1, e * r.width), h = a.st === 'frame' ? Math.max(1, Math.min(r.height, lh) * e) : Math.max(1, e * r.height);
        place(a.sel, r, w, h); $('em', a.sel).textContent = `${Math.round(w)} × ${Math.round(h)}`;
        if (a.ph) place(a.ph, r, w, h);
        a.guide = { l: r.left, t: r.top, r: r.left + w, b: r.top + h };
        a.x = clamp(r.left + w, 24, innerWidth - 16); a.y = clamp(r.top + h, 24, innerHeight - 70);
        if (p >= 1) {
          if (a.st === 'frame') {
            const fr = rectNow(L); place(a.sel, fr, fr.width, fr.height); setShape(a, 'arrow');
            a.sel.classList.add('thin');
            L.el.classList.remove('sw-t'); a.st = 'type'; a.t0 = T; a.typed = 0;
            a.cps = clamp(L.len / 2.6, 38, 90) * rand(.9, 1.1);    // chars per second, a long paragraph never takes more than ~3s
          } else { setShape(a, 'arrow'); a.st = 'hold'; a.t0 = T; a.dur = rand(.12, .2); }
        }
      } else if (a.st === 'hold') {
        const r = rectNow(L); place(a.sel, r, r.width, r.height); if (a.ph) place(a.ph, r, r.width, r.height);
        if (T - a.t0 >= a.dur) {
          if (L.type === 'rect') styleRect(L); else revealImg(L);
          const rr = rectNow(L); pop(L.el);
          for (const [x, y] of [[rr.left, rr.top], [rr.right, rr.top], [rr.left, rr.bottom], [rr.right, rr.bottom]]) burst(clamp(x, 6, innerWidth - 6), clamp(y, 6, innerHeight - 6), a.color, 3, 160);
          ring(a.x, a.y, a.color, 120);
          a.ph.classList.add('fade'); const ph = a.ph; setTimeout(() => ph.remove(), 400); a.ph = null;
          a.sel.remove(); a.sel = null; a.t0 = T;
          if (L.units) { a.st = 'type'; a.typed = 0; a.cps = clamp(L.len / 2.6, 38, 90) * rand(.9, 1.1); L.el.classList.remove('sw-t'); }
          else { a.st = 'settle'; a.dur = L.type === 'img' ? .6 : .3; }
        }
      } else if (a.st === 'type') {
        const r = rectNow(L); if (a.sel) place(a.sel, r, r.width, r.height);
        a.typed = Math.min(L.len, a.typed + a.cps * dt);
        const u = setTyped(L, Math.floor(a.typed));
        $$('.sw-caret', L.el).forEach((c) => c.remove());
        if (u) { const c = document.createElement('span'); c.className = 'sw-caret'; u.w.insertBefore(c, u.rest); const cr = c.getBoundingClientRect(); a.x = clamp(cr.right + 10, 24, innerWidth - 16); a.y = clamp(cr.bottom + 6, 24, innerHeight - 70); }
        if (a.typed >= L.len) {
          a.sel?.remove(); a.sel = null; a.st = 'settle'; a.t0 = T; a.dur = .2;
        }
      } else if (a.st === 'settle') {
        if (T - a.t0 >= a.dur) { finish(L); park(a); }
      }
      if (a.st === 'fly' || a.st === 'drag' || a.st === 'frame') trail(a);
      a.el.style.transform = `translate(${a.x}px,${a.y}px)`;
    }

    // tour: scroll on once everything in view is claimed, but never past the top of a block that is still being built.
    // If the visitor scrolled instead, the cursors build wherever they are; if they stop for a few seconds the tour carries on.
    const inReach = layers.some((l) => eligible(l) && reach(l));
    if (!tour && !manualOff && !finishing && T > 2.4 && !inReach && T - lastUser > 4) {
      tour = true; btn('tour').classList.add('on'); btn('tour').textContent = 'Touring'; document.documentElement.style.scrollBehavior = 'auto'; autoY = scrollY;
    }
    if (tour && T > 2.4 && !inReach) {
      let limit = Infinity;
      for (const l of layers) if (!l.done && !l.fixed && l.top < scrollY + innerHeight - 8) limit = Math.min(limit, l.top - 90);
      const nxt = layers.find((l) => !l.done && !l.by);
      if (nxt) {
        const gap = Math.min(nxt.top - innerHeight * .45, limit) - scrollY;
        if (gap > 0) { scrollTo(0, scrollY + clamp(gap * 2, 90, 420) * dt); autoY = scrollY; }
      }
    }
    const pct = done / total;
    fill.style.width = (pct * 100).toFixed(0) + '%';
    lyEl.innerHTML = `<b>${done}</b> / ${total} layers`;
    drawFx(dt);
    if (done >= total && !finishing && ag.every((a) => a.st === 'idle')) {
      finishing = true; confetti(); ring(innerWidth / 2, innerHeight / 2, '#ef4444', 380);
      btn('live').hidden = false; btn('tour').hidden = true; btn('speed').hidden = true; fill.style.width = '100%';
      setTimeout(() => golive(false), 2600);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// ---- opening: a short motion-design showreel on the site's own dark and crimson (ball, hard-hitting type, an easing curve, a name card), then a circle wipe into the swarm ----
function intro() {
  return new Promise((resolve) => {
    const root = document.createElement('div'); root.className = 'in-root';
    root.innerHTML = '<canvas class="in-cv"></canvas><div class="in-skip">click or press any key to skip</div>';
    document.body.append(root);
    const cv = $('.in-cv', root), ctx = cv.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let W, H, u;
    const size = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); u = Math.min(W / 1000 * 1.1, H / 600); };
    size(); addEventListener('resize', size);

    const INK = '#f5f5f5', RED = '#ef4444', DARK = '#050505', GREY = '#8a8a8a';
    const c01 = (v) => clamp(v, 0, 1), seg = (t, a, b) => c01((t - a) / (b - a)), lerp = (a, b, p) => a + (b - a) * p;
    const oBack = (p) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
    const oElastic = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - .75) * (2 * Math.PI) / 3) + 1);
    const inCubic = (p) => p * p * p;
    const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };   // deterministic noise, so any frame can be drawn on its own
    const END = 5.2, SKIP_TO = 4.5, SLOW = 1.2;   // SLOW stretches the timeline: about 6 seconds of real time

    const font = (size, family = 'Bebas Neue', weight = 400) => { ctx.font = `${weight} ${size}px "${family}", Impact, sans-serif`; };
    const text = (s, x, y, size, color, o = {}) => {
      ctx.save(); ctx.globalAlpha = o.alpha ?? 1; ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); ctx.scale(o.sx ?? 1, o.sy ?? 1);
      font(size, o.family, o.weight); ctx.fillStyle = color; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, 0, 0); ctx.restore();
    };
    const hand = (s, x, y, size, color, p, rot = 0) => {
      if (p <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); font(size, 'Caveat', 600); const w = ctx.measureText(s).width;
      ctx.beginPath(); ctx.rect(-6, -size, (w + 12) * p, size * 1.5); ctx.clip(); ctx.fillStyle = color; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, 0, 0); ctx.restore();
    };
    const polyline = (pts, p, color, lw, dash) => {
      const n = Math.max(1, Math.floor((pts.length - 1) * p)); ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; if (dash) ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i <= n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      if (p < 1) { const f = (pts.length - 1) * p - n; if (f > 0 && pts[n + 1]) ctx.lineTo(lerp(pts[n][0], pts[n + 1][0], f), lerp(pts[n][1], pts[n + 1][1], f)); }
      ctx.stroke(); ctx.restore();
    };
    const arrow = (x1, y1, x2, y2, bend, p, color) => {
      if (p <= 0) return;
      const mx = (x1 + x2) / 2 + bend, my = (y1 + y2) / 2 - bend, pts = [];
      for (let i = 0; i <= 24; i++) { const s = i / 24; pts.push([(1 - s) * (1 - s) * x1 + 2 * (1 - s) * s * mx + s * s * x2, (1 - s) * (1 - s) * y1 + 2 * (1 - s) * s * my + s * s * y2]); }
      polyline(pts, p, color, 2.4 * u);
      if (p > .92) { const a = Math.atan2(y2 - pts[22][1], x2 - pts[22][0]); ctx.save(); ctx.translate(x2, y2); ctx.rotate(a); ctx.strokeStyle = color; ctx.lineWidth = 2.4 * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-10 * u, -7 * u); ctx.lineTo(0, 0); ctx.lineTo(-10 * u, 7 * u); ctx.stroke(); ctx.restore(); }
    };
    const squiggle = (x, y, w, p, color) => { const pts = []; for (let i = 0; i <= 40; i++) pts.push([x + (w * i) / 40, y + Math.sin(i * .9) * 4 * u]); polyline(pts, p, color, 2.4 * u); };
    const letters = (s, size, fn) => {
      font(size); const ws = [...s].map((ch) => ctx.measureText(ch).width), tw = ws.reduce((a, b) => a + b, 0); let x = (W - tw) / 2;
      [...s].forEach((ch, i) => { fn(ch, i, x, ws[i], tw); x += ws[i]; });
      return tw;
    };
    const burst = (ox, oy, lt, n, color) => {   // sparks, computed from time alone
      if (lt < 0 || lt > .7) return; ctx.save(); ctx.fillStyle = color;
      for (let i = 0; i < n; i++) { const an = hash(i) * 6.283, v = (200 + hash(i + 50) * 700) * u, x = ox + Math.cos(an) * v * lt, y = oy + Math.sin(an) * v * lt + 500 * u * lt * lt; ctx.globalAlpha = 1 - lt / .7; ctx.fillRect(x, y, (3 + hash(i + 9) * 5) * u, (3 + hash(i + 9) * 5) * u); }
      ctx.restore();
    };

    // ---- scene 1: the ball (0 – 1.0) ----
    const G = () => H * .76, R = () => 24 * u;
    const ballAt = (t) => {
      const r = R(), g = G(); let y;
      if (t < .35) { const p = t / .35; y = lerp(-2 * r, g - r, p * p); }
      else { y = g - r; for (const [a, b, h] of [[.35, .72, .32], [.72, .92, .11], [.92, 1.02, .03]]) if (t >= a && t < b) { const p = (t - a) / (b - a); y = g - r - H * h * 4 * p * (1 - p); } }
      return { x: W * .2 + W * .6 * c01(t / 1.05), y };
    };
    const scene1 = (t) => {
      const g = G(), r = R();
      polyline([[W * .1, g], [W * .9, g]], easeOut(seg(t, 0, .3)), INK, 1.6 * u);
      for (let k = 10; k >= 1; k--) { const tt = t - k * .03; if (tt > 0) { const b = ballAt(tt); ctx.save(); ctx.globalAlpha = .35 * (1 - k / 11); ctx.strokeStyle = INK; ctx.lineWidth = 1.3 * u; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 7); ctx.stroke(); ctx.restore(); } }
      const b = ballAt(t), vy = (ballAt(t + .008).y - ballAt(t - .008).y) / .016;
      let sy = 1 + c01(Math.abs(vy) / (H * 8)) * .35, sx = 1 / Math.sqrt(sy);
      for (const [ti, k] of [[.35, .4], [.72, .3], [.92, .2]]) { const q = (t - ti) / .09; if (q >= 0 && q < 1) { const s = Math.sin(Math.PI * q) * k; sy = 1 - s; sx = 1 + s * .9; } }
      ctx.save(); ctx.translate(b.x, b.y + r * (1 - sy)); ctx.scale(sx, sy); ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.restore();
      hand('zero fluff', W * .3, H * .24, 44 * u, RED, seg(t, .3, .62), -.07);
      hand('squash!', W * .52, g + 74 * u, 38 * u, INK, seg(t, .5, .8), -.04);
      arrow(W * .55, g + 48 * u, ballAt(.72).x + 6 * u, g + 8 * u, -22 * u, easeOut(seg(t, .5, .85)), INK);
    };

    // ---- scene 2: hard-hitting words (1.0 – 2.6) ----
    const WORDS = [['BUILD.', 0, .4], ['BREAK.', .4, .8], ['FIX.', .8, 1.2], ['SHIP.', 1.2, 1.6]];
    const scene2 = (t) => {
      for (const [w, a, b] of WORDS) {
        if (t < a || t >= b + .005) continue;
        const lt = t - a; font(100); const size = Math.min(H * .52, (W * .84) / ctx.measureText(w).width * 100), baseY = H * .66;
        if (w === 'BUILD.') letters(w, size, (ch, i, x) => { const d = i * .022; for (let k = 4; k >= 0; k--) { const p = oBack(seg(lt - k * .01, d, d + .17)); text(ch, x, baseY - (1 - p) * H * .85, size, INK, { alpha: k ? .12 : 1 }); } });
        else if (w === 'BREAK.') {   // shatters into slices that slide back together
          font(size); const tw = ctx.measureText(w).width, x0 = (W - tw) / 2, p = easeOut(seg(lt, .02, .3)), bands = 8;
          for (let i = 0; i < bands; i++) {
            const y0 = baseY - size * .8 + (size * .8 * i) / bands, hh = (size * .85) / bands + 1, dx = (hash(i * 3.1) - .5) * W * .45 * (1 - p);
            ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, hh); ctx.clip(); text(w, x0 + dx, baseY, size, i % 3 === 0 ? RED : INK); ctx.restore();
          }
        } else if (w === 'FIX.') {   // glitch: split, flicker, zoom pulses
          const f = Math.floor(lt * 50), on = hash(f) > .18, s = 1 + (lt < .1 ? .12 * (1 - lt / .1) : 0), jx = (hash(f + 3) - .5) * 14 * u * (lt < .26 ? 1 : .2);
          ctx.save(); ctx.translate(W / 2, baseY - size * .3); ctx.scale(s, s);
          if (on) { text('FIX.', jx - 9 * u, size * .3, size, RED, { align: 'center', alpha: .85 }); text('FIX.', jx + 9 * u, size * .3, size, '#7dd3fc', { align: 'center', alpha: .5 }); text('FIX.', jx, size * .3, size, INK, { align: 'center' }); }
          ctx.restore();
          for (let i = 0; i < 3; i++) { const gy = baseY - size * (.15 + hash(f + i) * .6); ctx.fillStyle = RED; ctx.globalAlpha = .55; ctx.fillRect(0, gy, W, 3 * u); ctx.globalAlpha = 1; }
        } else {
          const p = oBack(seg(lt, 0, .16)), s = 1 + .7 * (1 - c01(p)), jx = lt < .18 ? (hash(Math.floor(lt * 80)) - .5) * 10 * u : 0;
          font(size); const tw = ctx.measureText(w).width, cx = W / 2 + jx, cy = baseY - size * .34;
          ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); text(w, 0, size * .34, size, RED, { align: 'center' }); ctx.restore();
          if (lt > .1) {
            const gp = seg(lt, .1, .3); ctx.save(); ctx.strokeStyle = INK; ctx.globalAlpha = .6; ctx.lineWidth = 1.2 * u; ctx.setLineDash([6 * u, 5 * u]);
            ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W * gp, cy); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H * gp); ctx.stroke(); ctx.setLineDash([]);
            const bx = W / 2 - tw / 2, by = baseY - size * .72, bw = tw, bh = size * .72; ctx.strokeRect(bx, by, bw, bh);
            for (const [x, y] of [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]]) ctx.fillRect(x - 4 * u, y - 4 * u, 8 * u, 8 * u);
            ctx.restore(); text(`x: ${Math.round(W / 2)}   y: ${Math.round(cy)}`, bx, by - 10 * u, 14 * u, INK, { family: 'JetBrains Mono', weight: 500, alpha: .8 });
          }
          burst(W / 2, cy, lt - .04, 46, RED); burst(W / 2, cy, lt - .04, 22, INK);
        }
      }
    };

    // ---- scene 3: the easing curve (2.6 – 3.5) ----
    const scene3 = (t) => {
      const x0 = W * .18, x1 = W * .82, y0 = H * .78, y1 = H * .22, dx = x1 - x0;
      polyline([[x0, y1 - 30 * u], [x0, y0], [x1 + 20 * u, y0]], easeOut(seg(t, 0, .22)), INK, 1.6 * u);
      text('quality', x0 - 14 * u, y1 - 40 * u, 15 * u, GREY, { family: 'JetBrains Mono', weight: 500, alpha: seg(t, .1, .3) });
      text('time', x1 + 24 * u, y0 + 22 * u, 15 * u, GREY, { family: 'JetBrains Mono', weight: 500, alpha: seg(t, .1, .3), align: 'right' });
      polyline([[x0, y0], [x1, y1]], easeOut(seg(t, .05, .4)), GREY, 2 * u, [8 * u, 7 * u]);
      hand('talk is cheap', x0 + dx * .56, y0 - (y0 - y1) * .3 + 70 * u, 40 * u, RED, seg(t, .25, .5), -.05);
      const bez = (s) => { const m = 1 - s; return [m * m * m * x0 + 3 * m * m * s * (x0 + dx * .5) + 3 * m * s * s * (x1 - dx * .5) + s * s * s * x1, m * m * m * y0 + 3 * m * m * s * y0 + 3 * m * s * s * y1 + s * s * s * y1]; };
      const pts = []; for (let i = 0; i <= 60; i++) pts.push(bez(i / 60));
      polyline(pts, ease(seg(t, .3, .75)), RED, 4.5 * u);
      for (const [x, y] of [[x0, y0], [x1, y1]]) { ctx.fillStyle = INK; ctx.globalAlpha = seg(t, .3, .5); ctx.beginPath(); ctx.arc(x, y, 7 * u, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
      hand('tested ✓', x0 + dx * .08, y1 + 60 * u, 46 * u, INK, seg(t, .6, .85), -.04);
      const q = seg(t, .55, .9); if (q > 0) { const [x, y] = bez(ease(q)); ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(x, y, 12 * u, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2 * u; ctx.stroke(); }
    };

    // ---- scene 4: the name card (3.5 – 5.2) ----
    let dot = { x: W / 2, y: H / 2, r: 0 };
    const scene4 = (t) => {
      const sz = Math.min(H * .3, (W * .8) / 3.6), y1 = H * .46, y2 = y1 + sz * .96; let endX = 0;
      letters('PIYUSH', sz, (ch, i, x) => { const p = oBack(seg(t, i * .03, i * .03 + .2)); text(ch, x, y1 + (1 - p) * H * .5, sz, INK, { alpha: c01(p * 2) }); });
      letters('SISONDIA', sz, (ch, i, x, w) => { const p = oBack(seg(t, .15 + i * .028, .15 + i * .028 + .2)); text(ch, x, y2 + (1 - p) * H * .5, sz, INK, { alpha: c01(p * 2) }); endX = x + w; });
      const dr = 20 * u * oElastic(seg(t, .5, .9)); dot = { x: endX + 20 * u, y: y2 - 8 * u, r: dr };
      ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(dot.x, dot.y, dr, 0, 7); ctx.fill();
      text('AI ENGINEER · I SHIP END TO END', W / 2, y2 + 44 * u, 17 * u, GREY, { family: 'JetBrains Mono', weight: 500, align: 'center', alpha: seg(t, .35, .6) });
      const nx = dot.x - 300 * u, ny = y2 + 108 * u;
      hand('open to roles', nx, ny, 42 * u, RED, seg(t, .6, .9), -.04);
      arrow(nx + 215 * u, ny - 16 * u, dot.x - 8 * u, y2 + 8 * u, 36 * u, easeOut(seg(t, .65, .95)), RED);
      squiggle(nx, ny + 14 * u, 205 * u, seg(t, .85, 1.15), RED);
    };

    // ---- the frame ----
    let grid = null;
    const bar = (t, tb) => {   // a crimson bar sweeps across at each cut
      const p = seg(t, tb - .08, tb + .08); if (p <= 0 || p >= 1) return;
      const a = p < .5 ? 0 : (p - .5) * 2 * W, b = p < .5 ? p * 2 * W : W; ctx.fillStyle = RED; ctx.fillRect(a, 0, b - a, H);
    };
    const render = (t) => {
      ctx.fillStyle = DARK; ctx.fillRect(0, 0, W, H);
      const gr = ctx.createRadialGradient(W / 2, H / 2, H * .1, W / 2, H / 2, H * 1.1); gr.addColorStop(0, 'rgba(239,68,68,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = W * .17; x < W; x += W * .33) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } ctx.stroke();
      // screen shake on the SHIP slam
      const st = t - 2.2, sh = st > 0 && st < .3 ? (1 - st / .3) * 9 * u : 0;
      ctx.save(); if (sh) ctx.translate((hash(Math.floor(t * 90)) - .5) * sh * 2, (hash(Math.floor(t * 90) + 7) - .5) * sh * 2);
      if (t < 1.0) scene1(t); else if (t < 2.6) scene2(t - 1.0); else if (t < 3.5) scene3(t - 2.6); else scene4(t - 3.5);
      ctx.restore();
      if (st > 0 && st < .08) { ctx.fillStyle = '#fff'; ctx.globalAlpha = (1 - st / .08) * .5; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }   // one-frame flash
      for (const tb of [1.0, 2.6, 3.5]) bar(t, tb);
      if (t >= 4.45) {   // the red dot swallows the screen, then dark takes over
        const diag = Math.hypot(W, H) * 1.05;
        ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(dot.x, dot.y, dot.r + diag * inCubic(seg(t, 4.45, 4.85)), 0, 7); ctx.fill();
        ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(dot.x, dot.y, diag * easeOut(seg(t, 4.7, 5.2)), 0, 7); ctx.fill();
      }
      if (!grid) { grid = document.createElement('canvas'); grid.width = 4; grid.height = 4; const g = grid.getContext('2d'); g.fillStyle = 'rgba(0,0,0,.09)'; g.fillRect(0, 0, 4, 1); }
      if (t < 4.5) { ctx.fillStyle = ctx.createPattern(grid, 'repeat'); ctx.fillRect(0, 0, W, H); }   // faint scanlines
      if (t < 4.45) { ctx.fillStyle = RED; ctx.fillRect(0, H - 3, W * (t / END), 3); text(`00:0${Math.min(6, Math.floor(t * SLOW))} / 00:06`, 18, H - 14, 12 * u, GREY, { family: 'JetBrains Mono', weight: 500 }); }
    };

    let t0 = performance.now(), off = 0, raf, finished = false;
    const end = () => { if (finished) return; finished = true; cancelAnimationFrame(raf); removeEventListener('keydown', skip); root.removeEventListener('click', skip); removeEventListener('resize', size); resolve(); root.classList.add('out'); setTimeout(() => root.remove(), 600); };
    const skip = () => { const raw = (performance.now() - t0) / 1000 / SLOW + off; if (raw < SKIP_TO) off += SKIP_TO - raw; };
    addEventListener('keydown', skip); root.addEventListener('click', skip);
    const loop = () => { const t = (performance.now() - t0) / 1000 / SLOW + off; render(Math.min(t, END)); if (t >= END) end(); else raf = requestAnimationFrame(loop); };
    const fonts = Promise.race([Promise.all([document.fonts.load('400 100px "Bebas Neue"'), document.fonts.load('600 40px Caveat'), document.fonts.load('500 14px "JetBrains Mono"')]), new Promise((r) => setTimeout(r, 1500))]);
    fonts.then(() => { t0 = performance.now(); raf = requestAnimationFrame(loop); });
    window.__introRender = render;
  });
}

// ---- hero: a spotlight and a little parallax that follow the mouse (the glitches are CSS) ----
function heroFx() {
  const hero = $('#hero'); if (!hero || reduced || matchMedia('(hover:none)').matches) return;
  addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect(); if (r.bottom < 0) return;
    hero.style.setProperty('--mx', e.clientX - r.left + 'px'); hero.style.setProperty('--my', e.clientY - r.top + 'px');
    hero.style.setProperty('--px', (e.clientX / innerWidth - .5).toFixed(3)); hero.style.setProperty('--py', (e.clientY / innerHeight - .5).toFixed(3));
  }, { passive: true });
}

export async function initFx() {
  aurora(); heroFx();
  if (reduced) return;
  if (mode === 'off' || innerWidth < 700) return;
  if (new URLSearchParams(location.search).get('intro') !== 'off') await intro();
  swarm();
}

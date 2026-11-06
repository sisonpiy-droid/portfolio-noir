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
  const total = layers.length;

  // small svg icons (button arrows, link icons) show once their owner is built
  const icons = $$('svg', roots[1]).filter((s) => !s.closest('.hero-wordmark-svg')).concat($$('svg', roots[0]));
  icons.forEach((s) => s.classList.add('sw-ic'));
  const pending = new Map();
  for (const L of layers) pending.set(L.el, (pending.get(L.el) || 0) + 1);

  // ---------- 2. hide everything ----------
  document.body.classList.add('sw-run');
  gridEl?.classList.add('sw-i');
  for (const L of layers) {
    if (L.type === 'rect') L.el.classList.add('sw-r');
    else if (L.type === 'img') L.el.classList.add('sw-i');
    if (L.nodes) {
      L.el.classList.add('sw-t');
      L.units = L.nodes.map((n) => {
        const w = document.createElement('span'); w.className = 'sw-w';
        const typed = document.createTextNode(''), rest = document.createElement('span'); rest.className = 'sw-rest'; rest.textContent = n.data;
        w.append(typed, rest); n.replaceWith(w);
        return { w, typed, rest, full: n.data, node: n };
      });
      L.len = L.units.reduce((s, u) => s + u.full.length, 0);
    }
  }
  const setTyped = (L, n) => {
    let left = n, last = null;
    for (const u of L.units) {
      const k = clamp(left, 0, u.full.length); left -= k;
      u.typed.data = u.full.slice(0, k); u.rest.textContent = u.full.slice(k);
      if (k > 0 && k < u.full.length) last = u;
    }
    return last;
  };
  const restoreText = (L) => { L.el.classList.remove('sw-t'); for (const u of L.units) { u.w.replaceWith(u.node); } };

  // ---------- 3. overlay, HUD, agents ----------
  const root = document.createElement('div'); root.className = 'sw-root';
  const N = 9;
  root.innerHTML = `<div class="sw-shield"></div><div class="sw-ruler sw-rt"></div><div class="sw-ruler sw-rl"></div><div class="sw-intro">PS</div>
    <div class="sw-hud"><span class="sw-dots">${COLORS.slice(0, 4).map((c) => `<i style="background:${c}"></i>`).join('')}</span>
    <span class="sw-status"><span id="sw-ag"><b>${N}</b> agents</span><span id="sw-ly"><b>0</b> / ${total} layers</span><span class="sw-bar"><i></i></span></span>
    <button data-a="tour" class="on">Touring</button><button data-a="speed">4×</button><button data-a="live" class="pri" hidden>Go live</button><button data-a="x" class="x" title="Exit (Esc)">✕</button></div>`;
  document.body.append(root);
  const hud = $('.sw-hud', root), lyEl = $('#sw-ly', root), fill = $('.sw-bar i', root), intro = $('.sw-intro', root);
  const btn = (a) => $(`[data-a="${a}"]`, root);
  requestAnimationFrame(() => { root.classList.add('on'); hud.classList.add('on'); });

  const ag = Array.from({ length: N }, (_, i) => {
    const color = COLORS[i], el = document.createElement('div'); el.className = 'sw-cur'; el.style.opacity = 0; el.innerHTML = ARROW(color);
    root.append(el);
    const left = i % 2 === 0;
    return { el, color, shape: 'arrow', x: left ? -40 : innerWidth + 40, y: rand(120, innerHeight - 120), st: 'idle', wake: .3 + i * .22, speed: rand(480, 1000), L: null, t0: 0, dur: 0, fx: 0, fy: 0, bend: 0, wx: innerWidth / 2, wy: innerHeight / 2, wt: 0, ph: null, sel: null, typed: 0 };
  });

  let T = 0, last = performance.now(), done = 0, tour = true, speed = 4, over = false, finishing = false;
  let autoY = 0, lastUser = -99, manualOff = false;   // autoY: where our own scrolling left the page; a different position means the visitor scrolled
  const setShape = (a, s) => { if (a.shape !== s) { a.shape = s; a.el.innerHTML = s === 'cross' ? CROSS(a.color) : ARROW(a.color); } };
  const rectNow = (L) => L.el.getBoundingClientRect();
  const finish = (L) => {
    L.done = true; done++;
    const left = pending.get(L.el) - 1; pending.set(L.el, left);
    if (left === 0) $$('svg', L.el).forEach((s) => s.classList.remove('sw-ic'));
    if (L.units) restoreText(L);
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
    icons.forEach((s) => s.classList.remove('sw-ic'));
    document.body.classList.remove('sw-run'); gridEl?.classList.remove('sw-i');
    document.documentElement.style.scrollBehavior = '';
    root.classList.add('off');
    if (tour && !instantly) scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => root.remove(), 750);
    liveFx();
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
    if (T > 2.4) intro.classList.add('gone');

    for (const a of ag) {
      if (T < a.wake) continue;
      a.el.style.opacity = 1;
      const L = a.L;
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
          setShape(a, 'cross'); a.t0 = T; a.x = r.left; a.y = r.top;
          if (L.type === 'text') { a.st = 'frame'; a.dur = clamp(r.width / (a.speed * .9), .3, .6); a.sel = makeSel(false); }
          else { a.st = 'drag'; a.dur = clamp(Math.hypot(r.width, r.height) / (a.speed * .8), .35, 1.1); a.ph = makePh(L, a); a.sel = makeSel(false); }
        }
      } else if (a.st === 'drag' || a.st === 'frame') {
        const r = rectNow(L), p = clamp((T - a.t0) / a.dur, 0, 1), e = ease(p);
        const lh = L.lh;
        const w = Math.max(1, e * r.width), h = a.st === 'frame' ? Math.max(1, Math.min(r.height, lh) * e) : Math.max(1, e * r.height);
        place(a.sel, r, w, h); $('em', a.sel).textContent = `${Math.round(w)} × ${Math.round(h)}`;
        if (a.ph) place(a.ph, r, w, h);
        a.x = clamp(r.left + w, 24, innerWidth - 16); a.y = clamp(r.top + h, 24, innerHeight - 70);
        if (p >= 1) {
          if (a.st === 'frame') {
            const fr = rectNow(L); place(a.sel, fr, fr.width, fr.height); a.sel.classList.add('thin'); setShape(a, 'arrow');
            L.el.classList.remove('sw-t'); a.st = 'type'; a.t0 = T; a.typed = 0;
            a.cps = clamp(L.len / 2.6, 38, 90) * rand(.9, 1.1);    // chars per second, a long paragraph never takes more than ~3s
          } else { setShape(a, 'arrow'); a.st = 'hold'; a.t0 = T; a.dur = rand(.12, .2); }
        }
      } else if (a.st === 'hold') {
        const r = rectNow(L); place(a.sel, r, r.width, r.height); if (a.ph) place(a.ph, r, r.width, r.height);
        if (T - a.t0 >= a.dur) {
          if (L.type === 'rect') styleRect(L); else revealImg(L);
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
        if (a.typed >= L.len) { a.sel?.remove(); a.sel = null; a.st = 'settle'; a.t0 = T; a.dur = .2; }
      } else if (a.st === 'settle') {
        if (T - a.t0 >= a.dur) { finish(L); park(a); }
      }
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
    if (done >= total && !finishing && ag.every((a) => a.st === 'idle')) {
      finishing = true; btn('live').hidden = false; btn('tour').hidden = true; btn('speed').hidden = true; fill.style.width = '100%';
      setTimeout(() => golive(false), 2600);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// ---- opening: glyph rain, a boot console, a glitching MUSE title, a flash, then the swarm ----
const BOOT = [
  '> piyush.sys  v2027  [boot]',
  '> vc-pipeline ........ 486 tests green',
  '> aangan .............. EN + HI online',
  '> territory-desk ..... 119 workbooks ok',
  '> kargo ............... blind scoring on',
  '> releasing the swarm_',
];
function intro() {
  return new Promise((resolve) => {
    const root = document.createElement('div'); root.className = 'in-root';
    root.innerHTML = '<canvas class="in-rain"></canvas><pre class="in-term"></pre><div class="in-title"><span data-t="PIYUSH">PIYUSH</span><small>AI ENGINEER · I SHIP END TO END</small></div><div class="in-crt"></div><div class="in-flash"></div><div class="in-skip">press any key or click to skip</div>';
    document.body.append(root);
    const cv = $('.in-rain', root), ctx = cv.getContext('2d'), term = $('.in-term', root);
    let w, h, cols, drops, alive = true, raf, finished = false;
    const size = () => { w = cv.width = innerWidth; h = cv.height = innerHeight; cols = Math.ceil(w / 16); drops = Array.from({ length: cols }, () => rand(-40, 0)); };
    size();
    const G = 'アイウエオカキクケコサシスセソ01{}<>/\\#$%';
    const rain = () => {
      if (!alive) return;
      ctx.fillStyle = 'rgba(5,5,5,.16)'; ctx.fillRect(0, 0, w, h); ctx.font = '14px JetBrains Mono, monospace';
      for (let i = 0; i < cols; i++) {
        const y = drops[i] * 16;
        ctx.fillStyle = Math.random() < .04 ? '#fff' : 'rgba(239,68,68,.75)';
        ctx.fillText(G[(Math.random() * G.length) | 0], i * 16, y);
        if (y > h && Math.random() > .975) drops[i] = 0;
        drops[i] += .5 + (i % 5) * .12;
      }
      raf = requestAnimationFrame(rain);
    };
    rain();
    const end = () => {
      if (finished) return; finished = true; alive = false; cancelAnimationFrame(raf);
      removeEventListener('keydown', end); root.removeEventListener('click', end);
      root.classList.add('flash');
      setTimeout(() => { resolve(); root.classList.add('out'); setTimeout(() => root.remove(), 700); }, 240);
    };
    addEventListener('keydown', end); root.addEventListener('click', end);
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      for (const l of BOOT) {
        for (const ch of l) { if (finished) return; term.textContent += ch; await sleep(11); }
        term.textContent += '\n'; await sleep(70);
      }
      await sleep(250); if (finished) return;
      root.classList.add('title'); await sleep(1100); if (finished) return;
      root.classList.add('shake'); await sleep(450); end();
    })();
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

// ---- the live page: scroll reveals, decoding titles, count-ups, a mouse glow on cards, a scroll bar ----
let liveStarted = false;
function scramble(el) {
  if (el.children.length) return;
  const txt = el.textContent, G = '█▓▒░<>/\\#01{}', t0 = performance.now();
  const step = (now) => {
    const p = clamp((now - t0) / 700, 0, 1), keep = Math.floor(txt.length * p);
    el.textContent = txt.split('').map((c, i) => (i < keep || c === ' ' ? c : G[(Math.random() * G.length) | 0])).join('');
    if (p < 1) requestAnimationFrame(step); else el.textContent = txt;
  };
  requestAnimationFrame(step);
}
function countUp(el) {
  const m = el.textContent.match(/^(\D*)(\d+)(.*)$/); if (!m) return;
  const end = +m[2], t0 = performance.now();
  const step = (now) => {
    const p = clamp((now - t0) / 1200, 0, 1);
    el.textContent = m[1] + Math.round(end * (1 - Math.pow(1 - p, 3))) + m[3];
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function liveFx() {
  if (liveStarted || reduced) return; liveStarted = true;
  const bar = document.createElement('div'); bar.id = 'progress'; document.body.append(bar);
  const onScroll = () => { bar.style.transform = `scaleX(${clamp(scrollY / ((document.documentElement.scrollHeight - innerHeight) || 1), 0, 1)})`; };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  $$('.hero-stat-box .stat-val').forEach(countUp);
  addEventListener('mousemove', (e) => {
    const c = e.target.closest?.('.glass-card'); if (!c) return;
    const r = c.getBoundingClientRect(); c.style.setProperty('--gx', e.clientX - r.left + 'px'); c.style.setProperty('--gy', e.clientY - r.top + 'px');
  }, { passive: true });
  if (!('IntersectionObserver' in window)) return;
  const items = $$('.section-header,.section-divider-bar,.glass-card,.hud-card').filter((el) => el.getBoundingClientRect().top + scrollY > innerHeight * .9);
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const t = e.target; t.classList.add('in'); io.unobserve(t);
    $$('.section-title,.contact-title,.flagship-title', t).forEach(scramble);
    $$('.metric-num', t).forEach(countUp);
    setTimeout(() => { t.classList.remove('rv', 'in'); t.style.transitionDelay = ''; }, 1100);
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  items.forEach((el, i) => { el.classList.add('rv'); el.style.transitionDelay = (i % 3) * 90 + 'ms'; io.observe(el); });
}

export async function initFx() {
  aurora(); heroFx();
  if (reduced) return;
  if (mode === 'off' || innerWidth < 700) { liveFx(); return; }
  if (new URLSearchParams(location.search).get('intro') !== 'off') await intro();
  swarm();
}

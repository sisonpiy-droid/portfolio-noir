// Aurora canvas + a "swarm" page build: named multiplayer cursors drag out every block and fill it in, while the page tours itself.
// The idea is a tribute to Swarm by Joel Califa; this is a small independent implementation.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mode = new URLSearchParams(location.search).get('swarm');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rand = (a, b) => a + Math.random() * (b - a);
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

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
const NAMES = ['Ada', 'Linus', 'Grace', 'Alan', 'Margaret', 'Ken', 'Barbara', 'Dennis', 'Radia', 'Guido', 'Frances', 'Bjarne', 'Hedy', 'Tim'];
const COLORS = ['#F24E1E', '#A259FF', '#1ABCFE', '#0ACF83', '#FF7262', '#FFC700', '#9747FF', '#E8467C', '#14AE5C', '#0D99FF', '#FF8A00', '#00B5CE'];
const TARGETS = '.nav-dock,.hero-wordmark-svg,.hero-script,.hero-name,.hero-role-pill,.hero-desc,.hero-actions,.hero-stats-row,.hero-cutout-wrap,.hud-card,.hud-tech-tags,.section-divider-bar,.section-header,.glass-card';
const SPEEDS = [1, 2, 4];

function swarm() {
  history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  const all = $$(TARGETS).map((el) => { const r = el.getBoundingClientRect(); return { el, top: r.top + scrollY, left: r.left, done: false, by: null }; })
    .sort((a, b) => a.top - b.top || a.left - b.left);
  all.forEach((t) => t.el.classList.add('sw-h'));

  const root = document.createElement('div'); root.className = 'sw-root';
  root.innerHTML = `<div class="sw-ruler sw-rt"></div><div class="sw-ruler sw-rl"></div><div class="sw-splash">PS</div>
    <div class="sw-hud"><span class="sw-dots"></span><span class="sw-sep"></span>
    <span class="sw-status"><span id="sw-st">Scanning page…</span><span class="sw-bar"><i></i></span></span>
    <button data-a="tour" class="on">Touring</button><button data-a="speed">1×</button><button data-a="live" class="pri" hidden>Go live</button><button data-a="x" class="x" title="Exit (Esc)">✕</button></div>`;
  document.body.append(root);
  const hud = $('.sw-hud', root), st = $('#sw-st', root), fill = $('.sw-bar i', root), btn = (a) => $(`[data-a="${a}"]`, root);

  const N = Math.min(14, NAMES.length);
  const cs = Array.from({ length: N }, (_, i) => {
    const color = COLORS[i % COLORS.length], el = document.createElement('div');
    el.className = 'sw-cur'; el.style.opacity = 0;
    el.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 3l14 7.5-6 1.8-2.2 6.2z" fill="${color}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg><b style="background:${color}">${NAMES[i]}</b>`;
    root.append(el);
    const left = i % 2 === 0;
    return { el, color, x: left ? -60 : innerWidth + 60, y: rand(80, innerHeight - 80), st: 'idle', wake: .9 + i * .11, t: null, sel: null, t0: 0, dur: 0, fx: 0, fy: 0, bend: 0, wx: 0, wy: 0, wt: 0 };
  });
  $('.sw-dots', root).innerHTML = cs.slice(0, 3).map((c, i) => `<i style="background:${c.color}">${NAMES[i][0]}</i>`).join('') + `<span style="margin-left:6px">+${N - 3}</span>`;
  requestAnimationFrame(() => hud.classList.add('on'));

  let T = 0, last = performance.now(), painted = 0, tour = true, speed = 1, over = false, finishing = false;
  const rectOf = (t) => t.el.getBoundingClientRect();
  document.documentElement.style.scrollBehavior = 'auto';

  const reveal = (t) => {
    if (t.done) return; t.done = true; painted++;
    t.el.classList.remove('sw-h'); t.el.classList.add('sw-in');
    setTimeout(() => t.el.classList.remove('sw-in'), 400);
  };
  const next = () => {
    for (const t of all) {
      if (t.done || t.by) continue;
      const r = rectOf(t);
      if (r.bottom < -80) { reveal(t); continue; }        // already scrolled past: just show it
      return r.top < innerHeight + 40 ? t : null;          // sorted by position, so nothing further is in reach yet
    }
    return null;
  };
  const makeSel = (c) => {
    const s = document.createElement('div'); s.className = 'sw-sel'; s.style.borderColor = c.color;
    s.innerHTML = `<i style="border-color:${c.color}"></i><i style="border-color:${c.color}"></i><i style="border-color:${c.color}"></i><i style="border-color:${c.color}"></i><em style="background:${c.color}"></em>`;
    root.append(s); return s;
  };
  const dropSel = (s) => { s.classList.add('fade'); setTimeout(() => s.remove(), 400); };

  const golive = (instant) => {
    if (over) return; over = true;
    removeEventListener('keydown', onKey); removeEventListener('wheel', cancelTour); removeEventListener('touchstart', cancelTour);
    if (instant) all.forEach(reveal);
    document.documentElement.style.scrollBehavior = '';
    root.classList.add('off');
    if (tour && !instant) scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { root.remove(); }, 650);
  };
  const cancelTour = () => { if (tour) { tour = false; btn('tour').classList.remove('on'); btn('tour').textContent = 'Tour'; document.documentElement.style.scrollBehavior = ''; } };
  const onKey = (e) => { if (e.key === 'Escape') golive(true); else if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(e.key)) cancelTour(); };
  addEventListener('keydown', onKey); addEventListener('wheel', cancelTour, { passive: true }); addEventListener('touchstart', cancelTour, { passive: true });
  root.addEventListener('click', (e) => {
    const a = e.target.closest('button')?.dataset.a; if (!a) return;
    if (a === 'x') golive(true);
    else if (a === 'live') golive(false);
    else if (a === 'speed') { speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]; btn('speed').textContent = speed + '×'; }
    else if (a === 'tour') { tour = !tour; btn('tour').classList.toggle('on', tour); btn('tour').textContent = tour ? 'Touring' : 'Tour'; document.documentElement.style.scrollBehavior = tour ? 'auto' : ''; }
  });

  const frame = (now) => {
    if (over) return;
    const dt = Math.min(.2, (now - last) / 1000) * speed; last = now; T += dt;
    if (T > .8) $('.sw-splash', root).classList.add('gone');

    for (const c of cs) {
      if (T < c.wake) continue;
      c.el.style.opacity = 1;
      if (c.st === 'idle' && !finishing) {
        const t = next();
        if (t) {
          t.by = c; c.t = t; c.st = 'fly'; c.t0 = T; c.fx = c.x; c.fy = c.y;
          const r = rectOf(t); const d = Math.hypot(r.left - c.x, r.top - c.y);
          c.dur = clamp(d / 900, .22, .7); c.bend = (Math.random() < .5 ? -1 : 1) * rand(.05, .14) * Math.min(d, 600);
        } else {                                                          // nothing in reach: drift near the bottom of the viewport
          if (T > c.wt) { c.wx = innerWidth * rand(.1, .9); c.wy = innerHeight * rand(.55, .9); c.wt = T + rand(1, 2.2); }
          c.x += (c.wx - c.x) * Math.min(1, dt * 2.2); c.y += (c.wy - c.y) * Math.min(1, dt * 2.2);
        }
      } else if (c.st === 'idle' && finishing) {
        c.x += (innerWidth * (c.x > innerWidth / 2 ? 1.1 : -.1) - c.x) * Math.min(1, dt * 2);
      }
      if (c.st === 'fly') {
        const r = rectOf(c.t), p = clamp((T - c.t0) / c.dur, 0, 1), e = ease(p);
        const tx = r.left, ty = r.top, dx = tx - c.fx, dy = ty - c.fy, L = Math.hypot(dx, dy) || 1;
        c.x = c.fx + dx * e - (dy / L) * c.bend * Math.sin(Math.PI * e);
        c.y = c.fy + dy * e + (dx / L) * c.bend * Math.sin(Math.PI * e);
        if (p >= 1) { c.st = 'drag'; c.t0 = T; c.dur = clamp(.28 + (r.width * r.height) / 1.3e6, .3, .9); c.sel = makeSel(c); }
      } else if (c.st === 'drag') {
        const r = rectOf(c.t), p = clamp((T - c.t0) / c.dur, 0, 1), e = ease(p);
        const ex = r.left + e * r.width, ey = r.top + e * r.height;
        c.x = ex; c.y = clamp(ey, 12, innerHeight - 24);
        const s = c.sel, w = Math.max(1, ex - r.left), h = Math.max(1, ey - r.top);
        s.style.transform = `translate(${r.left}px,${r.top}px)`; s.style.width = w + 'px'; s.style.height = h + 'px';
        $('em', s).textContent = `${Math.round(w)} × ${Math.round(h)}`;
        if (p >= 1) { reveal(c.t); dropSel(c.sel); c.sel = null; c.t = null; c.st = 'idle'; c.wt = 0; }
      }
      c.el.style.transform = `translate(${c.x}px,${c.y}px)`;
    }

    // tour: keep scrolling toward the first block nobody has started yet
    if (tour) {
      const pend = all.find((t) => !t.done && !t.by);
      if (pend && T > 1.1) {
        const want = pend.top - innerHeight * .8, gap = want - scrollY;
        if (gap > 0) scrollTo(0, scrollY + clamp(gap * 2.2, 60, 520) * dt);
      }
    }
    const pct = painted / all.length;
    fill.style.width = (pct * 100).toFixed(0) + '%';
    st.textContent = T < .8 ? 'Scanning page…' : painted < all.length ? `Building · ${(pct * 100).toFixed(0)}%` : 'Page built';
    if (painted >= all.length && !finishing && cs.every((c) => c.st === 'idle')) {
      finishing = true; btn('live').hidden = false; btn('tour').hidden = true; btn('speed').hidden = true; fill.style.width = '100%';
      setTimeout(() => golive(false), 2200);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

export function initFx() {
  aurora();
  if (reduced || mode === 'off') return;
  swarm();
}

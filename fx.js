// Animations: aurora canvas, cursor-swarm page build (with auto tour), text scramble, tilt, magnetic buttons, marquee, progress bar.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const q = new URLSearchParams(location.search).get('swarm');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);

// ---- aurora: drifting crimson orbs + slow op-art rings, eased toward the mouse ----
function aurora() {
  const cv = $('#aurora'); if (!cv || reduced) return;
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
}

// ---- text scramble: letters decode into place ----
function scramble(el) {
  if (reduced || el.children.length) return;
  const txt = el.textContent, glyphs = '█▓▒░<>/\\#01{}', t0 = performance.now(), dur = 650;
  const step = (now) => {
    const p = clamp((now - t0) / dur, 0, 1), keep = Math.floor(txt.length * p);
    el.textContent = txt.split('').map((c, i) => (i < keep || c === ' ' ? c : glyphs[Math.random() * glyphs.length | 0])).join('');
    if (p < 1) requestAnimationFrame(step); else el.textContent = txt;
  };
  requestAnimationFrame(step);
}

function countUp() {
  $$('.stats b').forEach((el) => {
    const txt = el.textContent, m = txt.match(/^(\d+)(.*)$/); if (!m) return;
    const end = +m[1], tail = m[2], t0 = performance.now();
    const step = (now) => {
      const t = clamp((now - t0) / 1400, 0, 1);
      el.textContent = Math.round(end * ease(t)) + tail;
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = '0' + tail; requestAnimationFrame(step);
  });
}

// ---- swarm: hide every block, then a flock of named cursors paints them back, top-down, while the page tours itself ----
const NAMES = [['Claude', '#ff5252'], ['Gemini', '#4da3ff'], ['Piyush', '#ffd24d'], ['Rules', '#3ddc97'], ['Tests', '#c084fc'], ['Deploy', '#ff9f43'], ['Supabase', '#2dd4bf'], ['Vercel', '#f5f5f5'], ['Next.js', '#f472b6'], ['Postgres', '#60a5fa']];
const TARGETS = '.nav,.ghost-word,.hero-txt>*,.photo,.marquee,.sec,h2,.sublead,.two p,blockquote,.principles>div,.sub,.tl>div,.edu>div,.card,.filters,.mcard,.mail,.social,footer>*';

function swarm(onPainted) {
  scrollTo(0, 0);
  const all = $$(TARGETS).map((el) => {
    const r = el.getBoundingClientRect();
    return { el, top: r.top + scrollY, left: r.left, done: false, by: null };
  }).sort((a, b) => a.top - b.top || a.left - b.left);
  all.forEach((t) => t.el.classList.add('sw-h'));

  const root = document.createElement('div'); root.className = 'sw-root';
  const bar = document.createElement('div'); bar.className = 'sw-bar';
  bar.innerHTML = '<span class="sw-label">Scanning page…</span><span class="sw-track"><i></i></span><span class="sw-mode">Touring</span><button aria-label="Skip the build">Skip ✕</button>';
  document.body.append(root, bar);
  const fill = $('i', bar), label = $('.sw-label', bar), mode = $('.sw-mode', bar);

  const cs = NAMES.map(([name, col], i) => {
    const el = document.createElement('div'); el.className = 'cur'; el.style.opacity = 0;
    el.innerHTML = `<svg width="18" height="18" viewBox="0 0 16 16"><path d="M1 1l5 14 2-6 6-2z" fill="${col}" stroke="#000" stroke-width=".8"/></svg><span style="background:${col}">${name}</span>`;
    root.append(el);
    return { el, x: innerWidth * (.1 + .08 * i), y: -40, st: 'idle', t: null, t0: 0, dur: 0, fx: 0, fy: 0, wake: performance.now() + i * 140 };
  });

  let painted = 0, tour = true, finished = false;
  document.documentElement.style.scrollBehavior = 'auto';
  const rectOf = (t) => t.el.getBoundingClientRect();

  const paintNow = (t) => {
    if (t.done) return; t.done = true; painted++;
    t.el.classList.remove('sw-h'); t.el.style.clipPath = '';
    if (t.el.matches('.stats')) countUp();
    if (t.el.matches('h1,h2,.sub')) scramble(t.el);
  };
  const next = () => {
    for (const t of all) {
      if (t.done || t.by !== null) continue;
      if (!t.el.isConnected) { t.done = true; painted++; continue; }
      const r = rectOf(t);
      if (r.bottom < -80) { paintNow(t); continue; }       // scrolled past: just show it
      if (r.top < innerHeight + 40) return t;
      return null;                                         // sorted: nothing further is in reach yet
    }
    return null;
  };

  const stop = (instant) => {
    if (finished) return; finished = true;
    if (instant) all.forEach(paintNow);
    cs.forEach((c) => c.el.classList.add('gone'));
    mode.textContent = 'Live'; label.textContent = 'Page built'; fill.style.width = '100%';
    document.documentElement.style.scrollBehavior = '';
    if (tour && !instant) scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { root.remove(); bar.classList.add('gone'); setTimeout(() => bar.remove(), 600); }, 900);
    removeEventListener('keydown', onKey);
    onPainted?.();
  };
  const onKey = (e) => { if (e.key === 'Escape') stop(true); else if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(e.key)) cancelTour(); };
  const cancelTour = () => { if (tour) { tour = false; mode.textContent = 'Scroll to build'; document.documentElement.style.scrollBehavior = ''; } };
  addEventListener('keydown', onKey);
  addEventListener('wheel', cancelTour, { passive: true });
  addEventListener('touchstart', cancelTour, { passive: true });
  $('button', bar).addEventListener('click', () => stop(true));

  const frame = (now) => {
    if (finished) return;
    for (const c of cs) {
      if (now < c.wake) continue;
      c.el.style.opacity = 1;
      if (c.st === 'idle') {
        const t = next();
        if (t) { t.by = c; c.t = t; c.st = 'fly'; c.t0 = now; c.fx = c.x; c.fy = c.y; const r = rectOf(t); c.dur = clamp(Math.hypot(r.left - c.x, r.top - c.y) / 1.7, 260, 700); }
        else { c.x += (innerWidth * (.15 + .7 * Math.random()) - c.x) * .002; c.y += (innerHeight * .85 - c.y) * .01; }
      }
      if (c.st === 'fly') {
        const r = rectOf(c.t), p = clamp((now - c.t0) / c.dur, 0, 1), e = ease(p);
        const tx = r.left + 6, ty = r.top + Math.min(r.height / 2, 30);
        c.x = c.fx + (tx - c.fx) * e; c.y = c.fy + (ty - c.fy) * e;
        if (p >= 1) { c.st = 'paint'; c.t0 = now; c.dur = 320 + Math.min(700, r.width * .5 + r.height * .5); c.t.el.classList.remove('sw-h'); c.t.el.classList.add('sw-p'); }
      } else if (c.st === 'paint') {
        const r = rectOf(c.t), p = clamp((now - c.t0) / c.dur, 0, 1), e = ease(p);
        c.t.el.style.clipPath = `inset(0 ${(100 - e * 100).toFixed(1)}% 0 0)`;
        c.x = r.left + e * r.width; c.y = r.top + r.height * (.5 + .38 * Math.sin(p * 11));
        if (p >= 1) { c.t.el.classList.remove('sw-p'); paintNow(c.t); c.st = 'idle'; c.t = null; }
      }
      c.el.style.transform = `translate(${c.x}px,${c.y}px)`;
    }
    // tour: scroll toward the first block nobody has started yet
    if (tour) {
      const pending = all.find((t) => !t.done && t.by === null);
      if (pending) {
        const want = pending.top - innerHeight * .5;
        if (want > scrollY) scrollTo(0, scrollY + clamp((want - scrollY) * .05, .6, 34));
      }
    }
    const pct = painted / all.length;
    fill.style.width = (pct * 100).toFixed(0) + '%';
    label.textContent = painted < all.length ? `Building page… ${(pct * 100).toFixed(0)}%` : 'Page built';
    if (painted >= all.length && cs.every((c) => c.st === 'idle')) return stop(false);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// ---- reveals (used when the swarm is switched off) ----
function reveals() {
  const items = $$('.sec,h2,.sublead,.two>div,.principles>div,.tl>div,.edu>div,.card,.mcard,.mail,.social');
  if (reduced || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -36px 0px' });
  items.forEach((el, i) => { el.classList.add('rv'); el.style.transitionDelay = (i % 3) * 70 + 'ms'; io.observe(el); });
}

function activeNav() {
  const links = $$('.nav a[href^="#"]');
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { threshold: .3 });
  $$('section[id]').forEach((s) => io.observe(s));
}

function parallax() {
  const g = $('.ghost-word'), ph = $('.photo'); if (!g || reduced) return;
  addEventListener('mousemove', (e) => {
    const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    g.style.transform = `translate(${x * -26}px,${y * -16}px)`; ph.style.transform = `translate(${x * 14}px,${y * 10}px)`;
  }, { passive: true });
  addEventListener('scroll', () => { g.style.opacity = Math.max(0, 1 - scrollY / 500); }, { passive: true });
}

// 3D tilt on small cards, magnetic pull on buttons
function hovers() {
  if (reduced || matchMedia('(hover:none)').matches) return;
  document.addEventListener('mousemove', (e) => {
    const card = e.target.closest?.('.mcard,.principles>div,.tl>div');
    $$('.tilt').forEach((el) => { if (el !== card) { el.classList.remove('tilt'); el.style.transform = ''; } });
    if (card) {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.classList.add('tilt'); card.style.transform = `perspective(700px) rotateX(${(-y * 9).toFixed(1)}deg) rotateY(${(x * 9).toFixed(1)}deg) translateY(-3px)`;
    }
    const btn = e.target.closest?.('.btn');
    $$('.btn.mag').forEach((b) => { if (b !== btn) { b.classList.remove('mag'); b.style.transform = ''; } });
    if (btn) { const r = btn.getBoundingClientRect(); btn.classList.add('mag'); btn.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * .25).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * .35).toFixed(1)}px)`; }
  }, { passive: true });
}

function progressBar() {
  const b = $('#progress'); if (!b) return;
  addEventListener('scroll', () => { b.style.transform = `scaleX(${clamp(scrollY / (document.documentElement.scrollHeight - innerHeight || 1), 0, 1)})`; }, { passive: true });
}

export function initFx() {
  aurora(); activeNav(); parallax(); hovers(); progressBar();
  if (reduced || q === 'off') { reveals(); return; }
  history.scrollRestoration = 'manual';
  swarm();
}

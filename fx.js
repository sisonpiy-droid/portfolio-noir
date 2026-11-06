// Animations: aurora canvas, cursor-swarm intro, scroll reveals, count-up, active nav, mouse parallax.
const $ = (s, r = document) => r.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const q = new URLSearchParams(location.search).get('swarm');

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

// ---- swarm intro: named cursors repaint the page top-down by peeling a cover away ----
function swarm(done) {
  if (reduced || q === 'off') return done();
  const cover = document.createElement('div');
  cover.className = 'swarm';
  const cursors = [['Claude', '#ff5252'], ['Gemini', '#4da3ff'], ['Piyush', '#ffd24d'], ['Rules', '#3ddc97']].map(([name, col], i) => {
    const el = document.createElement('div');
    el.className = 'cur';
    el.innerHTML = `<svg width="18" height="18" viewBox="0 0 16 16"><path d="M1 1l5 14 2-6 6-2z" fill="${col}" stroke="#000" stroke-width=".8"/></svg><span style="background:${col}">${name}</span>`;
    cover.append(el);
    return { el, ph: i * 1.7, sp: .9 + i * .25 };
  });
  document.body.append(cover);
  document.body.classList.add('locked');
  const dur = 2600, t0 = performance.now();
  let over = false;
  const end = () => { if (over) return; over = true; cover.remove(); document.body.classList.remove('locked'); done(); };
  addEventListener('keydown', (e) => e.key === 'Escape' && end());
  cover.addEventListener('click', end);
  const tick = (now) => {
    if (over) return;
    const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 2.2), y = e * innerHeight;
    cover.style.clipPath = `inset(${y}px 0 0 0)`;
    for (const c of cursors) {
      const x = innerWidth * (.5 + .4 * Math.sin(now / 420 * c.sp + c.ph)), yy = y + 14 * Math.sin(now / 200 + c.ph);
      c.el.style.transform = `translate(${x}px,${yy}px)`; c.el.style.opacity = t < .97 ? 1 : 0;
    }
    t < 1 ? requestAnimationFrame(tick) : end();
  };
  requestAnimationFrame(tick);
}

// ---- count-up on hero stats ("486", "9", "82/82") ----
function countUp() {
  document.querySelectorAll('.stats b').forEach((el) => {
    const txt = el.textContent, m = txt.match(/^(\d+)(.*)$/); if (!m || reduced) return;
    const end = +m[1], tail = m[2], t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / 1400);
      el.textContent = Math.round(end * (1 - Math.pow(1 - t, 3))) + tail;
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = '0' + tail; requestAnimationFrame(step);
  });
}

function reveals() {
  const items = document.querySelectorAll('.sec, h2, .sublead, .two > div, .principles > div, .tl > div, .edu > div, .card, .mcard, .mail, .social');
  if (reduced || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -36px 0px' });
  items.forEach((el, i) => { el.classList.add('rv'); el.style.transitionDelay = (i % 3) * 70 + 'ms'; io.observe(el); });
}

function activeNav() {
  const links = [...document.querySelectorAll('.nav a[href^="#"]')];
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { threshold: .3 });
  document.querySelectorAll('section[id]').forEach((s) => io.observe(s));
}

function parallax() {
  const g = $('.ghost-word'), ph = $('.photo'); if (!g || reduced) return;
  addEventListener('mousemove', (e) => {
    const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    g.style.transform = `translate(${x * -26}px,${y * -16}px)`; ph.style.transform = `translate(${x * 14}px,${y * 10}px)`;
  }, { passive: true });
  addEventListener('scroll', () => { g.style.opacity = Math.max(0, 1 - scrollY / 500); }, { passive: true });
}

export function initFx() {
  aurora(); reveals(); activeNav(); parallax();
  document.body.classList.add('pre');
  swarm(() => { document.body.classList.replace('pre', 'built'); countUp(); });
}

import { profile as p, stats, about, scoreParts, flagships, filters, matrix } from './content.js';

import { initFx } from './fx.js';

const $ = (s, r = document) => r.querySelector(s);
const chips = (a) => a.map((t) => `<span class="chip">${t}</span>`).join('');
const links = (a) => a.map(([l, h], i) => `<a class="btn ${i ? 'ghost' : ''}" href="${h}" target="_blank" rel="noopener">${l} →</a>`).join('');
const n2 = (i) => String(i).padStart(2, '0');

$('#nav').innerHTML = `
  <a class="logo" href="#top">PS</a>
  <a href="#about">About</a><a href="#flagships">Flagships</a><a href="#matrix">Matrix</a><a href="#contact">Contact</a>
  <a class="room" href="${p.room}" target="_blank" rel="noopener">3D Room ↗</a>
  <a class="avail" href="#contact"><i></i>Available</a>`;

const flagship = (f, i) => `
  <article class="card">
    <div class="card-main">
      <div class="tag"><i></i>${f.tag}</div>
      <h3>${f.title}</h3>
      <p>${f.desc}</p>
      ${f.note ? `<p class="note">${f.note}</p>` : ''}
      <div class="fstats">${f.stats.map(([n, l]) => `<div><b>${n}</b><span>${l}</span></div>`).join('')}</div>
      <ul>${f.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
      <div class="chips">${chips(f.stack)}</div>
      <div class="links">${links(f.links)}</div>
    </div>
    ${f.img ? `<figure><img src="${f.img}" alt="${f.imgAlt}" loading="lazy"></figure>` : ''}
    ${f.inspector ? `
    <div class="inspect" id="inspect">
      <div class="mono dim">SCORE BREAKDOWN // click a part to inspect</div>
      <div class="bar">${scoreParts.map((s, j) => `<button class="${j ? '' : 'on'}" style="flex:${s.v}" data-i="${j}">${s.k}<small>${s.v}</small></button>`).join('')}</div>
      <p id="inspect-d"><b>${scoreParts[0].k} · ${scoreParts[0].v}/100</b> ${scoreParts[0].d}</p>
    </div>` : ''}
  </article>`;

$('#app').innerHTML = `
<section class="hero" id="top">
  <div class="ghost-word" aria-hidden="true">PORTFOLIO</div>
  <div class="hero-grid">
    <div class="hero-txt">
      <div class="mono">PORTFOLIO</div>
      <div class="hello">Hello, I'm</div>
      <h1>${p.name.toUpperCase()}.</h1>
      <div class="mono crimson">${p.role.toUpperCase()}</div>
      <p class="lead">${p.tagline}</p>
      <div class="links"><a class="btn" href="#contact">Initiate dispatch</a><a class="btn ghost" href="#flagships">Explore the work</a></div>
      <div class="stats">${stats.map((s) => `<div><b>${s.n}</b><span>${s.l}</span></div>`).join('')}</div>
    </div>
    <div class="photo"><div class="block"></div><img src="me.jpg" alt="Piyush Sisondia"><span class="badge"><i></i>${p.chip}</span></div>
  </div>
</section>

<div class="marquee" aria-hidden="true"><div class="track">${[0, 1].map(() => `<span>${['Next.js', 'TypeScript', 'Postgres', 'Supabase', 'Gemini', 'Claude', 'Playwright', 'Vitest', 'Vercel', 'HubSpot', 'Telegram'].map((t) => `<b>${t}</b><i>✦</i>`).join('')}</span>`).join('')}</div></div>

<section id="about">
  <div class="sec"><span class="mono crimson">// 01.00 SEC_ABOUT</span><span class="mono dim">INDEX [01 / 04]</span></div>
  <h2>Background &amp; Philosophy</h2>
  <div class="two">
    <div>${about.bio.map((t) => `<p>${t}</p>`).join('')}<blockquote>“${about.quote}”</blockquote></div>
    <div class="principles">${about.principles.map((x, i) => `<div><b class="crimson">${n2(i + 1)}</b><h4>${x.t}</h4><p>${x.d}</p></div>`).join('')}</div>
  </div>
  <h3 class="sub">Business background</h3>
  <div class="tl">${about.experience.map((e) => `<div><span class="mono dim">${e.d}</span><h4>${e.w}</h4><em>${e.s}</em><p>${e.n}</p></div>`).join('')}</div>
  <div class="edu">
    <div><h4 class="mono crimson">EDUCATION</h4>${about.education.map((e) => `<p>${e.w}<br><span class="dim">${e.d}</span></p>`).join('')}</div>
    <div><h4 class="mono crimson">COURSES</h4><div class="chips">${chips(about.courses)}</div></div>
  </div>
</section>

<section id="flagships">
  <div class="sec"><span class="mono crimson">// 02.00 SEC_FLAGSHIPS</span><span class="mono dim">INDEX [02 / 04]</span></div>
  <h2>Flagship Deployments</h2>
  <p class="sublead">Products I built end to end, with the tests, the data safety and the deploy behind them.</p>
  ${flagships.map(flagship).join('')}
</section>

<section id="matrix">
  <div class="sec"><span class="mono crimson">// 03.00 SEC_MATRIX</span><span class="mono dim">INDEX [03 / 04]</span></div>
  <h2>The Systems Matrix</h2>
  <div class="filters" id="filters">${filters.map((f, i) => `<button class="${i ? '' : 'on'}" data-f="${f}">${f} (${f === 'All' ? matrix.length : matrix.filter((m) => m.cat === f).length})</button>`).join('')}</div>
  <div class="grid" id="grid"></div>
</section>

<section id="contact">
  <div class="sec"><span class="mono crimson">// 04.00 SEC_CONTACT</span><span class="mono dim">INDEX [04 / 04]</span></div>
  <h2>Let's build something that ships.</h2>
  <p class="sublead">Open to AI and product engineering roles. Prefer the game version? <a href="${p.room}" target="_blank" rel="noopener">Drive around my portfolio</a>.</p>
  <div class="mail"><a href="mailto:${p.email}">${p.email}</a><button class="btn" id="copy">Copy email address</button></div>
  <div class="social"><a href="${p.github}" target="_blank" rel="noopener">GitHub</a><a href="${p.linkedin}" target="_blank" rel="noopener">LinkedIn</a><a href="${p.cv}" target="_blank" rel="noopener">CV</a><span class="dim">${p.location}</span></div>
</section>
<footer><span>© 2026 ${p.full}.</span><span class="dim">Noir &amp; Crimson. Built by hand, tested before shipped.</span></footer>`;

// score inspector: fade-swap the text
$('#inspect')?.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  const s = scoreParts[+b.dataset.i], d = $('#inspect-d');
  $('#inspect').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  d.classList.add('swap');
  setTimeout(() => { d.innerHTML = `<b>${s.k} · ${s.v}/100</b> ${s.d}`; d.classList.remove('swap'); }, 180);
});

// matrix filter
const grid = $('#grid');
const draw = (f) => {
  grid.innerHTML = matrix.filter((m) => f === 'All' || m.cat === f).map((m) => `
    <article class="mcard"><span class="mono crimson">#SYS-${m.id}</span><h4>${m.title}</h4><p>${m.d}</p>
    <div class="chips">${chips(m.tags)}</div>${m.href ? `<a class="more" href="${m.href}" target="_blank" rel="noopener">${m.cta}</a>` : ''}</article>`).join('');
};
draw('All');
$('#filters').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  $('#filters').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  grid.classList.add('out');
  setTimeout(() => { draw(b.dataset.f); grid.classList.remove('out'); }, 180);
});

// copy email, with a toast
let tt;
const toast = (msg) => { $('#toast-msg').textContent = msg; $('#toast').classList.add('show'); clearTimeout(tt); tt = setTimeout(() => $('#toast').classList.remove('show'), 3000); };
$('#copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(p.email); toast(`Copied to clipboard: ${p.email}`); } catch { toast(`Direct email: ${p.email}`); }
});

initFx();

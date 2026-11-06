import { profile as p, stats, about, scoreParts, flagships, filters, matrix, hud, hudTags, cardTags } from './content.js';
import { initFx } from './fx.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const tag = (a, c = 'tech-tag') => a.map((t) => `<span class="${c}">${t}</span>`).join('');
const n2 = (i) => String(i + 1).padStart(2, '0');
const ext = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>';
const arrow = '<svg class="btn-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';

$('#dock').innerHTML = `
  <nav class="nav-dock" aria-label="Main Navigation">
    <a href="#hero" class="nav-brand" aria-label="Home"><span class="brand-monogram">PS</span><span class="brand-label">PIYUSH<span style="color:var(--accent-red)">.</span></span></a>
    <div class="nav-links">
      <a href="#about" class="nav-item">About</a><a href="#flagships" class="nav-item">Flagships</a><a href="#projects" class="nav-item">Matrix</a><a href="#contact" class="nav-item">Contact</a>
      <a href="${p.room}" target="_blank" rel="noopener" class="nav-item">3D Room ↗</a>
    </div>
    <div class="dock-right"><div class="dock-status"><span class="status-dot"></span><span>Available</span></div><a href="#contact" class="dock-cta">DISPATCH →</a></div>
  </nav>`;

const first = flagships.find((f) => f.title === 'VC Pipeline Intelligence'), rest = flagships.filter((f) => f !== first && f.title !== 'Muse');   // VC Pipeline leads; Muse lives in the hero only
const links = (l, cls) => l.map(([t, h], i) => `<a class="${cls(i)}" href="${h}" target="_blank" rel="noopener">${t}</a>`).join('');
const sub = (f) => `
  <article class="glass-card subgrid-card">
    <div class="subgrid-top">
      <div class="subgrid-badge-row"><div class="flagship-badge">${f.tag.replace(' // ', ' // ')}</div></div>
      <h3 class="subgrid-title">${f.title}</h3>
      <p class="subgrid-desc">${f.desc}${f.note ? ' ' + f.note : ''}</p>
      <ul class="spec-list">${f.bullets.map((b) => `<li class="spec-item">${b}</li>`).join('')}</ul>
    </div>
    <div class="subgrid-footer"><div class="subgrid-tags">${tag(cardTags[f.title] || f.stack.slice(0, 2))}</div>
      <div class="card-links">${links(f.links, () => '')}</div></div>
  </article>`;

$('#app').innerHTML = `
<section id="hero" class="hero-section">
  <div class="hero-bg-grid" aria-hidden="true"><div class="grid-line line-1"></div><div class="grid-line line-2"></div><div class="grid-line line-3"></div></div>
  <div class="hero-wordmark-svg" aria-hidden="true"><svg viewBox="0 0 1000 215" preserveAspectRatio="xMidYMid meet"><text x="0" y="205" font-size="270" textLength="1000" lengthAdjust="spacingAndGlyphs">PORTFOLIO</text></svg></div>
  <div class="hero-stage-grid">
    <div class="hero-flank left-flank">
      <div class="hero-script">Hello, I'm</div>
      <h1 class="hero-name">${p.name.toUpperCase()}<span class="accent-red-dot">.</span></h1>
      <div class="hero-role-pill"><span class="pill-dot">●</span><span>${p.role.toUpperCase()}</span></div>
      <p class="hero-desc">Building <strong>AI products end to end</strong>, led by <strong>Muse</strong>, a companion that remembers you, plus voice agents and investor intelligence, with <strong>rules that keep the model honest</strong>.</p>
      <div class="hero-actions"><a href="#contact" class="btn btn-crimson hero-btn"><span>INITIATE DISPATCH</span>${arrow}</a><a href="#flagships" class="btn btn-glass hero-btn"><span>EXPLORE THE WORK</span></a></div>
      <div class="hero-stats-row">${stats.map((s) => `<div class="hero-stat-box"><span class="stat-val">${s.n}</span><span class="stat-lbl">${s.l}</span></div>`).join('')}</div>
    </div>
    <div class="hero-center-col"><div class="hero-cutout-wrap"><div class="hero-portrait-panel" aria-hidden="true"></div><img src="me.jpg" alt="Piyush Sisondia" class="hero-cutout-img"><div class="cutout-status-badge"><span class="status-pulse-red">●</span> ${p.chip}</div></div></div>
    <div class="hero-flank right-flank"><div class="hud-stack">
      ${hud.map((h, i) => `<div class="hud-card"><div class="hud-card-header"><span class="hud-idx">${n2(i)}.</span><span class="hud-tag">${h.tag}</span></div><div class="hud-card-title">${h.title}</div><div class="hud-card-desc">${h.desc}</div></div>`).join('')}
      <div class="hud-tech-tags">${tag(hudTags)}</div>
    </div></div>
  </div>
</section>

<div class="section-divider-bar" aria-hidden="true"><span>// 01.00 SEC_ABOUT</span><span class="divider-line"></span><span>INDEX [01 / 05]</span></div>

<section id="about" class="section">
  <div class="section-header"><div class="section-tag">ENGINEER PROFILE</div><h2 class="section-title">Background &amp; Philosophy</h2></div>
  <div class="about-container"><div class="glass-card about-grid">
    <div class="about-text-col">
      <p class="about-text">I build <strong>AI products end to end</strong>: the data model, the rules, the model calls, the tests and the deploy. Most of what you see here is solo work, built with Claude Code as my coding assistant.</p>
      <p class="about-text">Before software I spent <strong>3+ years in early-stage startups, venture investing and wealth advisory</strong>, and founded a startup of my own. That is why I build tools that run a business process, not demos. I am now at MESA School of Business, class of 2027.</p>
      <div class="quote-box">“${about.quote}”</div>
    </div>
    <div class="about-principles-col"><ul class="principles-list">
      ${about.principles.map((x, i) => `<li class="principle-item"><span class="principle-num">${n2(i)}</span><div><div class="principle-title">${x.t}</div><div class="principle-desc">${x.d}</div></div></li>`).join('')}
    </ul></div>
  </div></div>
  <div class="about-container"><div class="glass-card about-grid">
    <div><div class="col-title">BUSINESS BACKGROUND</div>
      ${about.experience.map((e) => `<div class="exp-item"><div class="exp-when">${e.d}</div><div class="exp-title">${e.w}</div><div class="exp-sub">${e.s}</div><div class="exp-note">${e.n}</div></div>`).join('')}
    </div>
    <div><div class="col-title">EDUCATION</div>${about.education.map((e) => `<div class="edu-line"><b>${e.w}</b>${e.d}</div>`).join('')}
      <div class="col-title" style="margin-top:24px">COURSES</div><div class="tech-tags-group">${tag(about.courses)}</div></div>
  </div></div>
</section>

<section id="flagships" class="section">
  <div class="section-header"><div class="section-tag">ARCHITECTURAL SHOWCASE</div><h2 class="section-title">Flagship Deployments</h2>
    <p class="section-desc">Products built end to end, with the tests, the data safety and the deploy behind them.</p></div>
  <div class="flagship-container">
    <article class="glass-card highlighted-card">
      <div class="card-glow-red"></div>
      <div class="flagship-header"><div class="flagship-badge"><span>●</span> ${first.tag}</div><div class="flagship-meta">${first.note}</div></div>
      <div class="flagship-body">
        <h3 class="flagship-title">${first.title}</h3>
        <p class="flagship-desc">${first.desc}</p>
        <div class="flagship-metrics-row">${[...first.stats, ['5', 'Score Factors']].map(([n, l]) => `<div class="metric-pill"><div class="metric-num">${n}</div><div class="metric-desc">${l}</div></div>`).join('')}</div>
        <div class="flagship-links">${links(first.links, (i) => (i ? 'btn btn-glass' : 'btn btn-primary'))}</div>
        <div class="saai-architecture-explorer">
          <div class="explorer-header"><div class="explorer-title">0–100 EXPLAINABLE SCORE</div><div class="explorer-sub">Click a factor to inspect its weight</div></div>
          <div class="layer-tabs" role="tablist">${scoreParts.map((s, i) => `<button class="layer-tab ${i ? '' : 'active'}" data-i="${i}" role="tab" aria-selected="${!i}">S${i + 1}: ${s.k} · ${s.v}</button>`).join('')}</div>
          <div class="layer-inspector-pane"><div id="layer-content">
            <div class="layer-inspect-badge" id="li-badge"></div><h4 class="layer-inspect-title" id="li-title"></h4><p class="layer-inspect-desc" id="li-desc"></p><div class="tech-tags-group" id="li-tags"></div>
          </div></div>
        </div>
      </div>
    </article>
    <div class="flagship-subgrid">${rest.map(sub).join('')}</div>
  </div>
</section>

<section id="projects" class="section">
  <div class="section-header"><div class="section-tag">ENGINEERING INDEX</div><h2 class="section-title">The Systems Matrix</h2>
    <p class="section-desc">Smaller builds across agents, consumer products and the interactive version of this site.</p>
    <div class="bento-controls">${filters.map((f, i) => `<button class="filter-btn ${i ? '' : 'active'}" data-filter="${f}">${f === 'All' ? `All Systems (${matrix.length})` : f}</button>`).join('')}</div></div>
  <div class="bento-grid">${matrix.map((m) => `
    <div class="glass-card bento-card" data-category="${m.cat}">
      <div class="bento-top"><span class="category-chip">${m.cat}</span>${m.href ? `<a href="${m.href}" target="_blank" rel="noopener noreferrer" class="bento-link" aria-label="${m.title}">${ext}</a>` : `<span class="bento-id">#SYS-${m.id}</span>`}</div>
      <h3 class="bento-title">${m.title}</h3><p class="bento-desc">${m.d}</p>
      <div class="bento-footer"><div class="bento-tags">${tag(m.tags, 'tag')}</div></div>
    </div>`).join('')}</div>
</section>

<section id="contact" class="section">
  <div class="glass-card contact-card"><div class="contact-glow-red"></div>
    <div class="contact-content">
      <div class="section-tag">DIRECT CONNECT</div>
      <h2 class="contact-title">Let's Build Something That Ships.</h2>
      <p class="contact-subtitle">Open to AI and product engineering roles. Prefer the game version? <a href="${p.room}" target="_blank" rel="noopener">Drive around my portfolio</a>.</p>
      <div class="email-action-box"><span class="email-address">${p.email}</span><button class="btn btn-primary copy-btn" id="copy" aria-label="Copy Email"><span>Copy Email Address</span></button></div>
      <div class="social-links-row">
        <a class="social-pill" href="${p.github}" target="_blank" rel="noopener noreferrer"><span>github.com/sisonpiy-droid</span></a>
        <a class="social-pill" href="${p.linkedin}" target="_blank" rel="noopener noreferrer"><span>linkedin.com/in/piyush-sisondia</span></a>
        <a class="social-pill" href="${p.cv}" target="_blank" rel="noopener noreferrer"><span>piyushsisondia.cv</span></a>
      </div>
      <div class="footer-meta"><span>© 2026 Piyush Sisondia. Designed with Noir &amp; Crimson Op-Art.</span><span>Built end to end. Tested before it ships.</span></div>
    </div>
  </div>
</section>`;

// score explorer: fade-swap like saai's layer inspector
const showPart = (i) => {
  const s = scoreParts[i];
  $('#li-badge').textContent = `SCORE FACTOR ${n2(i)} // ${s.k.toUpperCase()} · ${s.v}/100`;
  $('#li-title').textContent = s.t; $('#li-desc').textContent = s.d; $('#li-tags').innerHTML = tag(s.tags);
};
showPart(0);
const tabs = $$('.layer-tab'), pane = $('#layer-content');
tabs.forEach((tab) => tab.addEventListener('click', () => {
  tabs.forEach((t) => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', t === tab); });
  pane.style.opacity = '0'; pane.style.transform = 'translateY(6px)';
  setTimeout(() => { showPart(+tab.dataset.i); pane.style.opacity = '1'; pane.style.transform = 'none'; }, 180);
}));

// matrix filter
$$('.filter-btn').forEach((b) => b.addEventListener('click', () => {
  $$('.filter-btn').forEach((x) => x.classList.toggle('active', x === b));
  $$('.bento-card').forEach((c) => c.classList.toggle('hidden', b.dataset.filter !== 'All' && c.dataset.category !== b.dataset.filter));
}));

// copy email + toast
let tt;
const toast = (m) => { $('#toast-message').textContent = m; $('#toast').classList.add('show'); clearTimeout(tt); tt = setTimeout(() => $('#toast').classList.remove('show'), 3200); };
$('#copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(p.email); toast(`Copied to clipboard: ${p.email}`); } catch { toast(`Direct email: ${p.email}`); }
});

// active nav item
const items = $$('.nav-item[href^="#"]');
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) items.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)); }), { threshold: .3 });
$$('section[id]').forEach((s) => io.observe(s));

initFx();

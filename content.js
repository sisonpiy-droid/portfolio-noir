// All the words live here. Facts are taken from piyush-sisondia.vercel.app (its content.js) and piyushsisondia.cv.
export const profile = {
  name: 'Piyush',
  full: 'Piyush Sisondia',
  role: 'AI Engineer · I ship end to end',
  tagline: 'I build AI products end to end, from the rules that keep them honest to the deploy.',
  email: 'sisonpiy@gmail.com',
  linkedin: 'https://www.linkedin.com/in/piyush-sisondia',
  github: 'https://github.com/sisonpiy-droid',
  cv: 'https://piyushsisondia.cv',
  room: 'https://piyush-sisondia.vercel.app',
  location: 'Gurugram, India',
  chip: 'SHIPS TO PRODUCTION',
};

export const stats = [
  { n: '486', l: 'Tests passing' },
  { n: '9', l: 'Products shipped' },
  { n: '82/82', l: 'Refreshed, 0 errors' },
];

export const about = {
  bio: [
    'I build AI products end to end: the data model, the rules, the model calls, the tests and the deploy. Most of what you see here is solo work, built with Claude Code as my coding assistant.',
    'Before software I spent 3+ years in early-stage startups, venture investing and wealth advisory, and founded a startup of my own. That is why I build tools that run a business process, not demos. I am now at MESA School of Business, class of 2027.',
  ],
  quote: 'The model extracts. Rules decide. Tests prove it.',
  principles: [
    { t: 'The model extracts, rules decide', d: 'In Aangan and Territory Desk, written rules set every status. The model never does, and a test enforces it.' },
    { t: 'Privacy by design', d: 'Kargo redacts names before the model sees a CV. VC Pipeline’s refresh role cannot read the founder’s notes, and a test confirms the database refuses.' },
    { t: 'Prove it with tests', d: '486 tests in VC Pipeline. Territory Desk held its hard rules across 119 random workbooks.' },
  ],
  experience: [
    { w: 'Founder & Business Lead, LoyalTap', s: 'Offline-first loyalty platform', d: 'Jul 2024 – Dec 2025', n: '25+ merchant interviews; pilots across 4 businesses with 60+ users.' },
    { w: 'Impact Manager, Bellwether Associates', s: 'Wealth management and venture capital', d: 'Nov 2023 – Apr 2024', n: 'Secured ₹10L+ in allocations; supported ₹50L–₹1Cr investment discussions.' },
    { w: 'Founding Growth Manager, Meteor Venture', s: 'Early-stage investment platform and angel network', d: 'May – Nov 2023', n: 'Grew individual investors 9x and the institutional pipeline 100x; led 20+ interns.' },
    { w: 'Manager, JRG Financial Services', s: 'Wealth and risk management', d: 'May 2022 – Apr 2023', n: 'Managed 30+ HNI relationships behind a 10x AUM roadmap; ran hiring, payroll and compliance.' },
  ],
  education: [
    { w: 'Postgraduate programme, MESA School of Business', d: 'Class of 2027' },
    { w: 'BBA Marketing, Manipal Academy of Higher Education', d: '2019 – 2022 · Grade 8.73' },
  ],
  courses: ['Business Analytics for Decision Making · Colorado', 'Foundations of Marketing Analytics · ESSEC', 'Six Sigma Yellow Belt', 'Google Project Management'],
};

export const scoreParts = [
  { k: 'Recency', v: 30, t: 'Verified in the last 30 days', d: 'How recent the verified signal is. Stale and undated items are rejected before they are scored.', tags: ['30-Day Window', 'Undated Items Rejected'] },
  { k: 'Relevance', v: 30, t: 'Does the signal match the round?', d: 'How closely the signal matches the founder’s round. Gemini classifies it, with schema-validated output.', tags: ['Gemini Classifier', 'Schema-Validated'] },
  { k: 'Evidence', v: 20, t: 'Quoted, not paraphrased', d: 'Every quoted excerpt must appear verbatim on the fetched page, and the investor must be named.', tags: ['Verbatim Excerpts', 'Investor Named'] },
  { k: 'Fit', v: 15, t: 'Stage and sector fit', d: 'How well the investor fits the founder’s stage and sector.', tags: ['Stage Fit', 'Sector Fit'] },
  { k: 'Relationship', v: 5, t: 'Founder notes stay private', d: 'Existing contact history, which the refresh role can never read or overwrite.', tags: ['DB Role Isolation', 'Tested'] },
];

// The hero project: Muse. Its explorer on the first flagship card.
export const museParts = [
  { k: 'Personalities', t: 'Twenty starter personalities', d: 'Twenty ready-made personalities to talk to, built around relationship continuity: the point is that they remember you.', tags: ['20 Starters', 'Relationship Continuity'] },
  { k: 'Memory', t: 'Ranked and recalled', d: 'Memories are ranked and recalled in later conversations, so a personality can pick up where you left off.', tags: ['Ranked Memory', 'Recall Across Chats'] },
  { k: 'Models', t: 'Gemini or Anthropic', d: 'Both models sit behind one provider interface, so the model behind a personality can change without changing the product.', tags: ['Gemini', 'Anthropic'] },
  { k: 'Solo mode', t: 'No account needed', d: 'A solo mode with no account keeps everything in the browser, while the model key stays on the server.', tags: ['Browser-Only Data', 'Key Stays Server-Side'] },
  { k: 'Spec first', t: 'Built from a product spec', d: 'Built in phases: foundation, core experience, conversation and memory. An end-to-end test plays out the spec’s most important scenario against the real model.', tags: ['PRD-Driven', 'End-to-End Test'] },
];

export const hud = [
  { tag: 'FUNDRAISING', title: 'VC Pipeline Intelligence', desc: 'Verified investor signals ranked 0–100. 486 tests, 82 of 82 refreshed.' },
  { tag: 'VOICE AI', title: 'Aangan AI Front Desk', desc: 'Answers every call in English and Hindi. The model reads, rules decide.' },
  { tag: 'OPERATIONS', title: 'Territory Desk', desc: 'Franchise decisions that held across 119 random workbooks.' },
];
export const hudTags = ['Next.js', 'TypeScript', 'Supabase', 'Gemini', 'Postgres', 'Vercel'];
export const cardTags = {
  'Aangan AI Front Desk': ['Voice AI', 'HubSpot'],
  'Territory Desk': ['Rules Engine', 'OpenStreetMap'],
  'Kargo Hiring Dashboard': ['Next.js', 'Gemini'],
  'Muse': ['Next.js', 'Prisma'],
  'LoyalTap': ['n8n', 'Unit Economics'],
};

// Flagships first (order matters), then the matrix.
export const flagships = [
  {
    tag: 'FUNDRAISING TOOL // AI + DATA', title: 'VC Pipeline Intelligence',
    desc: 'Which investors should a first-time founder contact this week, and what public evidence says so? Searches public sources per investor, verifies every piece of evidence, and ranks with a fixed, explainable 0–100 score.',
    note: 'MESA final evaluation, built for a case founder.',
    bullets: ['Fetches each page, reads the publish date, rejects stale, undated or duplicate items', 'Refresh runs as a database role that cannot read the founder’s notes', 'Three production refreshes: 82 of 82 investors, zero errors'],
    stack: ['Next.js', 'TypeScript', 'Postgres (Supabase)', 'Gemini Flash', 'Tavily', 'Vitest', 'Playwright'],
    stats: [['486', 'Tests'], ['82/82', 'Refreshed'], ['0–100', 'Explainable score']],
    img: 'img/vc-pipeline.webp', imgAlt: 'The priority queue: 31 of 82 investors have a fresh, relevant signal.', inspector: true,
    links: [['Live app', 'https://vc-pipeline-intelligence.vercel.app'], ['Code', 'https://github.com/sisonpiy-droid/vc-pipeline-intelligence']],
  },
  {
    tag: 'VOICE AI // OPS AUTOMATION', title: 'Aangan AI Front Desk',
    desc: 'A voice agent answers every call in English and Hindi, qualifies the lead and books the consultation. Gemini only reads the call; written rules in code decide every lead.',
    note: 'MESA case: an interior design studio. Tested on sample transcripts; a real inbound call has not yet been run end to end.',
    bullets: ['Supabase is the system of record; HubSpot gets a contact and a deal', 'Calendly booking flows back through a signed webhook', 'Telegram handoff to the team; flags agent lines that leak pricing'],
    stack: ['Node.js', 'Vercel serverless', 'Supabase', 'Gemini', 'HubSpot API', 'Calendly webhooks', 'Telegram Bot API'],
    stats: [['90', 'Tests'], ['24/7', 'EN + HI'], ['0', 'Model-set statuses']],
    img: 'img/aangan-architecture.webp', imgAlt: 'Components map: caller, voice agent, backend, database, Gemini, rules, booking, CRM, Telegram.',
    links: [['Code', 'https://github.com/sisonpiy-droid/aangan-agent']],
  },
  {
    tag: 'OPERATIONS TOOL // FRANCHISE EXPANSION', title: 'Territory Desk',
    desc: 'Upload the applications, get a decision, a reason and a next step for every franchise applicant. Deterministic rules, no language model in the decisions.',
    note: 'Operations hackathon, Case 1. Profit figures use editable placeholders, not the brand’s real numbers.',
    bullets: ['Hard rules: one store per pin code, never more approvals than slots', 'Ask the desk: “Why is APP-007 on hold?” and the decision changes with new facts', 'Live site finder on OpenStreetMap data'],
    stack: ['JavaScript', 'SheetJS', 'h3-js', 'Vercel serverless', 'OpenStreetMap', 'jsdom', 'Playwright'],
    stats: [['119', 'Random workbooks'], ['29', 'Answer-key checks'], ['81/81', 'Phrasings answered']],
    img: 'img/territory-desk.webp', imgAlt: 'Where 20 sample applications landed, slots filled by territory and drop-out reasons.',
    links: [['Live app', 'https://territory-desk.vercel.app'], ['Code', 'https://github.com/sisonpiy-droid/territory-desk']],
  },
  {
    tag: 'HIRING TOOL // AI', title: 'Kargo Hiring Dashboard',
    desc: 'CV screening that is fast, explainable and blind to names. The model only ever sees the redacted CV and the rubric.',
    note: 'MESA case: a founder hiring product managers.',
    bullets: ['Name, email and phone pulled out with plain code before the model runs', 'Each CV scored 0–10 per criterion with a one-line reason, then a weighted 0–100', 'Nothing is emailed until the founder clicks Send'],
    stack: ['Next.js', 'Supabase', 'Gemini Flash', 'Resend', 'Vercel'],
    stats: [['100', 'Point rubric'], ['0', 'Names seen by the model'], ['PM + Sr PM', 'Rubrics']],
    img: 'img/kargo-hiring.webp', imgAlt: 'A candidate scorecard with rubric scores and a one-line reason each.',
    links: [['Code', 'https://github.com/sisonpiy-droid/kargo-hiring']],
  },
  {
    tag: 'CONSUMER AI PRODUCT', title: 'Muse',
    desc: 'Create anyone. Talk to anyone. AI personalities that remember you. Built from a product spec in phases, around relationship continuity.',
    note: 'Live on Vercel · about 70 commits',
    bullets: ['20 starter personalities with ranked, recalled memories', 'Gemini or Anthropic behind one provider interface', 'No-account solo mode in the browser; the model key stays on the server'],
    stack: ['Next.js', 'Prisma', 'Postgres', 'Auth', 'Gemini', 'Anthropic'],
    stats: [['20', 'Personalities'], ['2', 'Model Providers'], ['~70', 'Commits'], ['Live', 'On Vercel']],
    links: [['Live app', 'https://muse-two-brown.vercel.app']],
  },
  {
    tag: 'MY STARTUP // FOUNDER & BUSINESS LEAD', title: 'LoyalTap',
    desc: 'Loyalty rewards for neighbourhood shops, verified from a photo of the bill. Taken from 25+ merchant interviews to a live pilot.',
    note: 'Jul 2024 – Dec 2025.',
    bullets: ['Built lean workflows and reward logic with n8n, Lovable and Hugging Face', 'Evaluated unit economics for SaaS and performance-based pricing', 'Reward thresholds tuned to around 3% on top of credit card cashback'],
    stack: ['n8n', 'Lovable', 'Hugging Face', 'Unit economics'],
    stats: [['60+', 'Pilot users'], ['4', 'Businesses'], ['25+', 'Merchant interviews']],
    links: [],
  },
];

export const filters = ['All', 'AI & Agents', 'Consumer', 'Interactive'];

export const matrix = [
  { id: '00', cat: 'Interactive', title: 'Interactive 3D Portfolio', d: 'A drivable Three.js portfolio: drift, boost, night mode and a gallery of every project. The game version of this page.', tags: ['Three.js', 'Vite'], href: 'https://piyush-sisondia.vercel.app', cta: 'Drive it →' },
  { id: '01', cat: 'AI & Agents', title: 'JARVIS', d: 'A personal AI chief of staff on a scheduled cloud function. Telegram alerts, a daily briefing, a risk engine and a cost log of every model call. Runs 24/7 at zero hosting cost.', tags: ['Supabase', 'Edge functions', 'TypeScript', 'Gemini'] },
  { id: '02', cat: 'AI & Agents', title: 'LinkedIn Draft Assistant', d: 'A note on Telegram becomes a sourced LinkedIn draft in your voice, citing news from the last 45 days. It never posts on its own.', tags: ['Telegram', 'Gemini', 'Google News RSS'], href: 'https://github.com/sisonpiy-droid/mihir-ai-telegram', cta: 'Code →' },
  { id: '03', cat: 'Consumer', title: 'Reel Match', d: 'Two people, one QR code, one thing you will both watch. Claude turns both moods into a 30-title shortlist; a mutual swipe is a match. Built in a day.', tags: ['React', 'Claude', 'TMDB', 'Supabase'] },
  { id: '04', cat: 'Consumer', title: 'TripSync', d: 'Group trips without the endless group chat. Destinations are scored against every person’s budget, dates and dislikes, then voted on. Built in two days.', tags: ['Next.js', 'TypeScript', 'Supabase', 'Gemini'] },
  { id: '05', cat: 'AI & Agents', title: 'Presence', d: 'An MVP of emotionally meaningful AI conversation, shipped to real testers behind a serverless proxy with a passcode and hourly rate limits.', tags: ['React', 'Serverless', 'Claude / Gemini'] },
];

document.getElementById('year').textContent = new Date().getFullYear();

const listEl = document.getElementById('scenario-list');
const selectEl = document.getElementById('industry-select');
const searchEl = document.getElementById('search-input');
const modalEl = document.getElementById('scenario-modal');
const matrixEl = document.getElementById('matrix-view');
const hintEl = document.getElementById('perspective-hint');
const perspectiveBtn = document.getElementById('perspective-btn');
const perspectivePanel = document.getElementById('perspective-panel');
const perspectiveOptionsEl = document.getElementById('perspective-options');
const perspectiveSummaryEl = document.getElementById('perspective-summary');
const rerollBtn = document.getElementById('perspective-reroll');

const SEARCH_PLACEHOLDER = 'Search scenarios…';

const FACTORS = [
  { id: 'political', label: 'Political', blurb: 'Government, policy, trade, stability' },
  { id: 'economic', label: 'Economic', blurb: 'Growth, rates, costs, demand' },
  { id: 'sociocultural', label: 'Socio-Cultural', blurb: 'Demographics, values, habits' },
  { id: 'technological', label: 'Technological', blurb: 'AI, automation, infrastructure' },
  { id: 'legal', label: 'Legal', blurb: 'Regulation, compliance, liability' },
  { id: 'environmental', label: 'Environmental', blurb: 'Climate, energy, resources' }
];

const scenarios = window.SPOD_SCENARIOS || [];
const perspectiveData = window.SPOD_PERSPECTIVES || {};
const perspective = { random: false, factors: [] };

function populateIndustries(data) {
  const industries = [...new Set(data.map(s => s.industry))].sort();
  industries.forEach(industry => {
    const opt = document.createElement('option');
    opt.value = industry;
    opt.textContent = industry;
    selectEl.appendChild(opt);
  });
}

function render(data) {
  listEl.innerHTML = '';
  if (data.length === 0) {
    listEl.innerHTML = '<p style="color:var(--muted)">No scenarios match your filters.</p>';
    return;
  }
  data.forEach(s => {
    const card = document.createElement('article');
    card.className = 'scenario-card';
    card.innerHTML = `
      <span class="industry-tag">${s.industry}</span>
      <h3>${s.title}</h3>
      <p>${s.setup.slice(0, 110)}${s.setup.length > 110 ? '…' : ''}</p>
    `;
    card.addEventListener('click', () => openModal(s));
    listEl.appendChild(card);
  });
}

function applyFilters() {
  const industry = selectEl.value;
  const query = searchEl.value.trim().toLowerCase();
  const filtered = scenarios.filter(s => {
    const matchesIndustry = industry === 'all' || s.industry === industry;
    const matchesQuery = !query || s.title.toLowerCase().includes(query) || s.setup.toLowerCase().includes(query);
    return matchesIndustry && matchesQuery;
  });
  render(filtered);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ---- Perspective picker -------------------------------------------------

function buildPerspectiveOptions() {
  FACTORS.forEach(f => {
    perspectiveOptionsEl.appendChild(optionRow(f.id, f.label, f.blurb));
  });
  perspectiveOptionsEl.appendChild(optionRow('random', 'Random', 'We pick 2 for you'));
}

function optionRow(value, label, blurb) {
  const row = el('label', 'perspective-option');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.value = value;
  const text = el('span', 'perspective-option-text');
  text.appendChild(el('span', 'perspective-option-label', label));
  text.appendChild(el('span', 'perspective-option-blurb', blurb));
  row.appendChild(box);
  row.appendChild(text);
  return row;
}

function rollRandomFactors() {
  const pool = FACTORS.map(f => f.id);
  const picks = [];
  while (picks.length < 2) {
    picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picks;
}

function orderedFactors() {
  return FACTORS.filter(f => perspective.factors.includes(f.id));
}

function syncPerspectiveUI() {
  const picked = perspective.factors;
  perspectiveOptionsEl.querySelectorAll('input').forEach(box => {
    if (box.value === 'random') {
      box.checked = perspective.random;
      box.disabled = false;
      return;
    }
    box.checked = picked.includes(box.value);
    box.disabled = perspective.random || (picked.length >= 2 && !box.checked);
    box.closest('.perspective-option').classList.toggle('is-disabled', box.disabled);
  });
  rerollBtn.classList.toggle('hidden', !perspective.random);

  const names = orderedFactors().map(f => f.label);
  if (perspective.random) {
    perspectiveSummaryEl.textContent = 'Random: ' + names.join(' + ');
  } else if (picked.length === 0) {
    perspectiveSummaryEl.textContent = 'Pick 2';
  } else if (picked.length === 1) {
    perspectiveSummaryEl.textContent = names[0] + ' + pick 1 more';
  } else {
    perspectiveSummaryEl.textContent = names.join(' + ');
  }
  perspectiveBtn.classList.toggle('is-active', picked.length > 0);
}

perspectiveOptionsEl.addEventListener('change', (e) => {
  const box = e.target;
  if (box.value === 'random') {
    perspective.random = box.checked;
    perspective.factors = box.checked ? rollRandomFactors() : [];
  } else if (box.checked) {
    if (perspective.factors.length < 2) perspective.factors.push(box.value);
  } else {
    perspective.factors = perspective.factors.filter(id => id !== box.value);
  }
  syncPerspectiveUI();
  refreshView();
});

rerollBtn.addEventListener('click', () => {
  perspective.factors = rollRandomFactors();
  syncPerspectiveUI();
  refreshView();
});

document.getElementById('perspective-clear').addEventListener('click', clearPerspective);

function clearPerspective() {
  perspective.random = false;
  perspective.factors = [];
  syncPerspectiveUI();
  refreshView();
}

function setPanelOpen(open) {
  perspectivePanel.classList.toggle('hidden', !open);
  perspectiveBtn.setAttribute('aria-expanded', String(open));
}

perspectiveBtn.addEventListener('click', () => {
  setPanelOpen(perspectivePanel.classList.contains('hidden'));
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('#perspective')) setPanelOpen(false);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setPanelOpen(false);
});

// ---- 2x2 scenario generator --------------------------------------------

const QUADRANTS = [
  { key: 'bb', s1: 'better', s2: 'better' },
  { key: 'wb', s1: 'worse', s2: 'better' },
  { key: 'bw', s1: 'better', s2: 'worse' },
  { key: 'ww', s1: 'worse', s2: 'worse' }
];

const CLOSINGS = {
  both_better: 'Both forces are tailwinds at once. The question is how much of the upside you are actually set up to capture.',
  both_worse: 'Both forces are headwinds at once, and there is little slack left to absorb the blow.',
  mixed: 'The two forces pull in opposite directions, so a plan built around only one of them will be wrong.'
};

function stateLabel(state) {
  return state === 'better' ? 'Better' : 'Worse';
}

function quadrantTag(q, f1, f2) {
  return `${f1.label} ${stateLabel(q.s1)} + ${f2.label} ${stateLabel(q.s2)}`;
}

function quadrantTitle(q, f1, f2) {
  if (q.s1 === 'better' && q.s2 === 'better') return 'Tailwinds on Both Fronts';
  if (q.s1 === 'worse' && q.s2 === 'worse') return 'Headwinds on Both Fronts';
  const up = q.s1 === 'better' ? f1 : f2;
  const down = q.s1 === 'better' ? f2 : f1;
  return `${up.label} Lifts, ${down.label} Drags`;
}

function quadrantQuestions(q, f1, f2) {
  const l1 = f1.label.toLowerCase();
  const l2 = f2.label.toLowerCase();
  if (q.s1 === 'better' && q.s2 === 'better') {
    return [
      `If ${l1} and ${l2} conditions both get better, which opportunity would you move on first?`,
      'What would you need in place — people, capital, capacity — to capture it before competitors do?',
      'What could go wrong precisely because things are going right, and what early warning would you watch for?'
    ];
  }
  if (q.s1 === 'worse' && q.s2 === 'worse') {
    return [
      `If ${l1} and ${l2} conditions both get worse, which commitments do you protect and which do you pause?`,
      'What would you do in the first 90 days, and who needs to hear it first?',
      'Which part of your model is most fragile in this world, and what could you do now to reduce that exposure?'
    ];
  }
  const up = (q.s1 === 'better' ? f1 : f2).label.toLowerCase();
  const down = (q.s1 === 'better' ? f2 : f1).label.toLowerCase();
  return [
    `With ${up} conditions getting better but ${down} conditions getting worse, which force do you plan around, and why?`,
    `How far can the upside in ${up} conditions offset the pressure in ${down} conditions, and what can it not offset?`,
    'What signal would tell you the balance is tipping, and what would trigger you to act?'
  ];
}

function headline(text) {
  const colon = text.indexOf(':');
  if (colon > 0 && colon <= 110) return text.slice(0, colon);
  const plain = text.replace(/\.$/, '');
  if (plain.length <= 110) return plain;
  return plain.slice(0, plain.lastIndexOf(' ', 110)) + '…';
}

function withStop(text) {
  return text.endsWith('…') ? text : text + '.';
}

function buildQuadrants(industry, f1, f2) {
  const statements = perspectiveData[industry];
  return QUADRANTS.map(q => {
    const closing = q.s1 === q.s2
      ? (q.s1 === 'better' ? CLOSINGS.both_better : CLOSINGS.both_worse)
      : CLOSINGS.mixed;
    const tag = quadrantTag(q, f1, f2);
    const first = statements[f1.id][q.s1];
    const second = statements[f2.id][q.s2];
    return {
      key: q.key,
      s1: q.s1,
      s2: q.s2,
      tag,
      industry: `${industry} · ${tag}`,
      title: quadrantTitle(q, f1, f2),
      preview: `${withStop(headline(first))} ${withStop(headline(second))}`,
      setup: `Picture the world a few years from now. ${first} ${second} ${closing}`,
      questions: quadrantQuestions(q, f1, f2)
    };
  });
}

function matrixCard(s) {
  const card = el('article', 'scenario-card matrix-card matrix-' + s.key);
  card.appendChild(el('span', 'industry-tag', s.tag));
  card.appendChild(el('h3', '', s.title));
  card.appendChild(el('p', '', s.preview));
  card.addEventListener('click', () => openModal(s));
  return card;
}

function renderMatrix(industry, f1, f2) {
  const quads = buildQuadrants(industry, f1, f2);
  const byKey = Object.fromEntries(quads.map(s => [s.key, s]));
  matrixEl.innerHTML = '';

  const head = el('div', 'matrix-head');
  head.appendChild(el('h2', '', `${industry}: ${f1.label} × ${f2.label}`));
  head.appendChild(el('p', '', 'Each force gets better or worse, giving four worlds to plan for. Open a quadrant to work through it with your team.'));
  const actions = el('div', 'matrix-actions');
  if (perspective.random) {
    const reroll = el('button', 'link-btn', 'Re-roll Random');
    reroll.type = 'button';
    reroll.addEventListener('click', () => rerollBtn.click());
    actions.appendChild(reroll);
  }
  const clear = el('button', 'link-btn', 'Back to all scenarios');
  clear.type = 'button';
  clear.addEventListener('click', clearPerspective);
  actions.appendChild(clear);
  head.appendChild(actions);
  matrixEl.appendChild(head);

  const grid = el('div', 'matrix');
  grid.appendChild(el('div', 'matrix-corner'));
  grid.appendChild(el('div', 'matrix-col-head', `${f1.label} Better`));
  grid.appendChild(el('div', 'matrix-col-head', `${f1.label} Worse`));
  grid.appendChild(el('div', 'matrix-row-head', `${f2.label} Better`));
  grid.appendChild(matrixCard(byKey.bb));
  grid.appendChild(matrixCard(byKey.wb));
  grid.appendChild(el('div', 'matrix-row-head', `${f2.label} Worse`));
  grid.appendChild(matrixCard(byKey.bw));
  grid.appendChild(matrixCard(byKey.ww));
  matrixEl.appendChild(grid);
}

function setHint(text) {
  hintEl.textContent = text || '';
  hintEl.classList.toggle('hidden', !text);
}

function refreshView() {
  const industry = selectEl.value;
  const picked = perspective.factors.length;
  const matrixReady = picked === 2 && industry !== 'all' && perspectiveData && perspectiveData[industry];

  if (picked === 1) {
    setHint('Pick one more perspective to build your 2×2.');
  } else if (picked === 2 && industry === 'all') {
    setHint('Now choose a specific industry above to build your 2×2.');
  } else {
    setHint('');
  }

  if (matrixReady) {
    const [f1, f2] = orderedFactors();
    renderMatrix(industry, f1, f2);
    matrixEl.classList.remove('hidden');
    listEl.classList.add('hidden');
    searchEl.disabled = true;
    searchEl.placeholder = 'Search is off while a 2×2 is showing';
  } else {
    matrixEl.classList.add('hidden');
    listEl.classList.remove('hidden');
    searchEl.disabled = false;
    searchEl.placeholder = SEARCH_PLACEHOLDER;
    applyFilters();
  }
}

selectEl.addEventListener('change', refreshView);
searchEl.addEventListener('input', applyFilters);

// ---- Scenario modal -----------------------------------------------------

function openModal(s) {
  document.getElementById('modal-industry').textContent = s.industry;
  document.getElementById('modal-title').textContent = s.title;
  document.getElementById('modal-setup').textContent = s.setup;
  const qList = document.getElementById('modal-questions');
  qList.innerHTML = '';
  s.questions.forEach(q => {
    const li = document.createElement('li');
    li.textContent = q;
    qList.appendChild(li);
  });
  modalEl.classList.remove('hidden');
}

document.getElementById('modal-close').addEventListener('click', () => {
  modalEl.classList.add('hidden');
});

modalEl.addEventListener('click', (e) => {
  if (e.target === modalEl) modalEl.classList.add('hidden');
});

populateIndustries(scenarios);
buildPerspectiveOptions();
syncPerspectiveUI();
refreshView();

document.getElementById('year').textContent = new Date().getFullYear();

const listEl = document.getElementById('scenario-list');
const selectEl = document.getElementById('industry-select');
const searchEl = document.getElementById('search-input');
const modalEl = document.getElementById('scenario-modal');

let scenarios = [];

fetch('data/scenarios.json')
  .then(res => res.json())
  .then(data => {
    scenarios = data;
    populateIndustries(scenarios);
    render(scenarios);
  });

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

selectEl.addEventListener('change', applyFilters);
searchEl.addEventListener('input', applyFilters);

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

const gareGrid = document.getElementById('gare-grid');
const resultsSection = document.getElementById('results');
const gareSelector = document.querySelector('.gare-selector');
const resultsTitle = document.getElementById('results-title');
const linesContainer = document.getElementById('lines-container');
const backBtn = document.getElementById('back-btn');
const timeFilter = document.getElementById('time-filter');
const lineFilter = document.getElementById('line-filter');

let currentGare = null;

function komootUrl(lat, lng) {
  return `https://www.komoot.com/discover/${lat.toFixed(4)}/${lng.toFixed(4)}?sport=racebike`;
}

function renderGares() {
  gareGrid.innerHTML = '';
  DATA.gares.forEach(gare => {
    const totalStations = gare.lines.reduce((sum, l) => sum + l.stations.length, 0);
    const card = document.createElement('div');
    card.className = 'gare-card';
    card.innerHTML = `
      <h3>${gare.name}</h3>
      <div class="line-badges">
        ${gare.lines.map(l => `<span class="line-badge" style="background:${l.color}">${l.id}</span>`).join('')}
      </div>
      <div class="station-count">${totalStations} stations vélo</div>
    `;
    card.addEventListener('click', () => showGare(gare));
    gareGrid.appendChild(card);
  });
}

function showGare(gare) {
  currentGare = gare;
  gareSelector.classList.add('hidden');
  resultsSection.classList.remove('hidden');
  resultsTitle.textContent = gare.name;

  lineFilter.innerHTML = '<option value="all">Toutes</option>';
  gare.lines.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l.id;
    opt.textContent = l.name;
    lineFilter.appendChild(opt);
  });

  renderStations();
}

function matchTimeFilter(travelTime) {
  const val = timeFilter.value;
  if (val === 'all') return true;
  if (val === '20-30') return travelTime >= 20 && travelTime < 30;
  if (val === '30-40') return travelTime >= 30 && travelTime < 40;
  if (val === '40-50') return travelTime >= 40 && travelTime < 50;
  if (val === '50+') return travelTime >= 50;
  return true;
}

function renderStations() {
  if (!currentGare) return;
  linesContainer.innerHTML = '';
  const selectedLine = lineFilter.value;
  let anyResults = false;

  currentGare.lines.forEach(line => {
    if (selectedLine !== 'all' && line.id !== selectedLine) return;

    const filtered = line.stations.filter(s => matchTimeFilter(s.travelTime));
    if (filtered.length === 0) return;
    anyResults = true;

    const section = document.createElement('div');
    section.className = 'line-section';
    section.innerHTML = `
      <div class="line-header">
        <span class="line-badge" style="background:${line.color}">${line.id}</span>
        <h3>${line.name}</h3>
      </div>
      <div class="station-grid">
        ${filtered.map(s => `
          <div class="station-card">
            <div class="station-name">${s.name}</div>
            <div class="station-meta">
              <span>🕐 ~${s.travelTime} min</span>
              <span>Zone ${s.zone}</span>
            </div>
            <span class="landscape-tag">${s.landscape}</span>
            <a class="komoot-link" href="${komootUrl(s.lat, s.lng)}" target="_blank" rel="noopener">
              🗺️ Voir sur Komoot
            </a>
          </div>
        `).join('')}
      </div>
    `;
    linesContainer.appendChild(section);
  });

  if (!anyResults) {
    linesContainer.innerHTML = '<div class="no-results">Aucune station trouvée avec ces filtres</div>';
  }
}

backBtn.addEventListener('click', () => {
  currentGare = null;
  resultsSection.classList.add('hidden');
  gareSelector.classList.remove('hidden');
});

timeFilter.addEventListener('change', renderStations);
lineFilter.addEventListener('change', renderStations);

renderGares();

const gareList = document.getElementById('gare-list');
const garePicker = document.getElementById('gare-picker');
const controls = document.getElementById('controls');
const backBtn = document.getElementById('back-btn');
const gareNameEl = document.getElementById('gare-name');
const lineFilter = document.getElementById('line-filter');
const legend = document.getElementById('legend');
const stationCount = document.getElementById('station-count');

let map = null;
let markers = [];
let currentGare = null;

function needsDarkText(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

function komootUrl(lat, lng) {
  return `https://www.komoot.com/discover/tours/@${lat.toFixed(4)},${lng.toFixed(4)},12z?sport=racebike`;
}

function initMap() {
  if (map || typeof L === 'undefined') return;
  map = L.map('map', { zoomControl: true }).setView([48.85, 2.35], 9);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);
}

function makeIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="28" viewBox="0 0 20 28">
    <circle cx="10" cy="10" r="9" fill="${color}" stroke="white" stroke-width="2"/>
    <line x1="10" y1="19" x2="10" y2="27" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;
  return L.divIcon({ html: svg, iconSize: [20, 28], iconAnchor: [10, 27], popupAnchor: [0, -28], className: '' });
}

function clearMarkers() {
  markers.forEach(m => map && map.removeLayer(m));
  markers = [];
}

function renderMarkers() {
  if (!currentGare || !map) return;
  clearMarkers();
  const sl = lineFilter.value;
  let count = 0;

  currentGare.lines.forEach(line => {
    if (sl !== 'all' && line.id !== sl) return;
    line.stations.forEach(s => {
      const marker = L.marker([s.lat, s.lng], { icon: makeIcon(line.color) });
      marker.bindPopup(`
        <div class="popup-name">${s.name}</div>
        <div class="popup-time">🚆 ${s.travelTime} min depuis Paris</div>
        <div class="popup-meta">${line.name} &nbsp;·&nbsp; Zone ${s.zone}</div>
        <div class="popup-landscape">${s.landscape}</div><br>
        <a class="popup-komoot" href="${komootUrl(s.lat, s.lng)}" target="_blank" rel="noopener">Voir sur Komoot →</a>
      `, { maxWidth: 260 });
      marker.addTo(map);
      markers.push(marker);
      count++;
    });
  });

  stationCount.textContent = `${count} station${count > 1 ? 's' : ''} affichée${count > 1 ? 's' : ''}`;

  if (markers.length > 0) {
    map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2));
  }
}

function updateLegend() {
  const sl = lineFilter.value;
  legend.querySelectorAll('.legend-item').forEach((item, i) => {
    item.classList.toggle('faded', sl !== 'all' && currentGare.lines[i].id !== sl);
  });
}

function showGare(gare) {
  currentGare = gare;
  gareNameEl.textContent = gare.name;
  garePicker.style.display = 'none';
  controls.classList.remove('hidden');

  document.querySelectorAll('.gare-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.gare-btn[data-id="${gare.id}"]`)?.classList.add('active');

  lineFilter.innerHTML = '<option value="all">Toutes les lignes</option>';
  gare.lines.forEach(l => {
    const o = document.createElement('option');
    o.value = l.id;
    o.textContent = l.name;
    lineFilter.appendChild(o);
  });

  legend.innerHTML = '';
  gare.lines.forEach((l, i) => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<span class="legend-dot" style="background:${l.color}"></span><span>${l.name} <span style="color:var(--text-muted)">(${l.stations.length})</span></span>`;
    item.addEventListener('click', () => {
      lineFilter.value = lineFilter.value === l.id ? 'all' : l.id;
      renderMarkers();
      updateLegend();
    });
    legend.appendChild(item);
  });

  initMap();
  renderMarkers();
}

backBtn.addEventListener('click', () => {
  currentGare = null;
  clearMarkers();
  controls.classList.add('hidden');
  garePicker.style.display = '';
  if (map) map.setView([48.85, 2.35], 9);
  document.querySelectorAll('.gare-btn').forEach(b => b.classList.remove('active'));
});

lineFilter.addEventListener('change', () => { renderMarkers(); updateLegend(); });

// Populate gare buttons immediately — no dependency on Leaflet
DATA.gares.forEach(gare => {
  const btn = document.createElement('button');
  btn.className = 'gare-btn';
  btn.dataset.id = gare.id;
  const badges = gare.lines.map(l => {
    const textColor = needsDarkText(l.color) ? '#222' : '#fff';
    return `<span class="badge" style="background:${l.color};color:${textColor}">${l.id}</span>`;
  }).join('');
  btn.innerHTML = `<div class="name">${gare.name}</div><div class="line-badges">${badges}</div>`;
  btn.addEventListener('click', () => showGare(gare));
  gareList.appendChild(btn);
});

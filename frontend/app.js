const API = '';

const WINDOWS = [
  { id: 'resumen', icon: '🏠', title: 'Resumen del barrio', endpoint: '/api/resumen' },
  { id: 'localidad', icon: '🏙️', title: 'Datos sobre la localidad', endpoint: '/api/localidad' },
  { id: 'librerias', icon: '📚', title: 'Librerías y bibliotecas', endpoint: '/api/librerias' },
  { id: 'areas-verdes', icon: '🌳', title: 'Áreas verdes', endpoint: '/api/areas-verdes' },
  { id: 'escenarios-deportivos', icon: '⚽', title: 'Escenarios deportivos', endpoint: '/api/escenarios-deportivos' },
  { id: 'educacion', icon: '🎓', title: 'Sistemas educativos', endpoint: '/api/educacion' },
  { id: 'policia', icon: '🚓', title: 'Centros de atención de policía', endpoint: '/api/policia' },
  { id: 'estado-calles', icon: '🛣️', title: 'Estado de calles', endpoint: '/api/estado-calles' },
  { id: 'veterinarias', icon: '🐾', title: 'Veterinarias', endpoint: '/api/veterinarias' },
  { id: 'transporte', icon: '🚌', title: 'Estaciones de transporte', endpoint: '/api/transporte' },
  { id: 'robo', icon: '🚨', title: 'Datos sobre robo', endpoint: '/api/robo' },
  { id: 'catastral', icon: '🏷️', title: 'Datos catastrales', endpoint: '/api/catastral' },
  { id: 'camaras', icon: '📹', title: 'Cámaras de seguridad', endpoint: '/api/camaras' },
  { id: 'comida', icon: '🍽️', title: 'Sitios de comida', endpoint: '/api/comida' },
  { id: 'poligono', icon: '🗺️', title: 'Polígono del barrio', endpoint: '/api/polygon' },
];

const map = L.map('map').setView([4.7436, -74.0999], 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
}).addTo(map);

let polygonLayer = null;
let nucleoLayer = null;
let markerLayer = L.layerGroup().addTo(map);

const detailTitle = document.getElementById('detail-title');
const detailSub = document.getElementById('detail-sub');
const detailBody = document.getElementById('detail-body');
const windowsEl = document.getElementById('windows');

async function loadPolygon() {
  const [zoneRes, nucleoRes] = await Promise.all([
    fetch(API + '/api/polygon'),
    fetch(API + '/api/polygon/nucleo').catch(() => null),
  ]);
  const zone = (await zoneRes.json()).data;
  polygonLayer = L.geoJSON(zone, {
    style: { color: '#4fd1a5', weight: 3, fillColor: '#4fd1a5', fillOpacity: 0.12, dashArray: '6 4' },
  }).addTo(map);

  if (nucleoRes && nucleoRes.ok) {
    const nucleo = (await nucleoRes.json()).data;
    if (nucleo && nucleo.features && nucleo.features.length) {
      nucleoLayer = L.geoJSON(nucleo, {
        style: { color: '#f5b942', weight: 3, fillColor: '#f5b942', fillOpacity: 0.18 },
      }).addTo(map);
      nucleoLayer.bindPopup('<b>Núcleo oficial del barrio Las Flores</b>');
    }
  }
  map.fitBounds(polygonLayer.getBounds(), { padding: [40, 40] });
}

WINDOWS.forEach((w, i) => {
  const btn = document.createElement('button');
  btn.className = 'win-btn';
  btn.dataset.id = w.id;
  btn.innerHTML = `<span class="ico">${w.icon}</span><span class="txt">${w.title}</span><span class="num">${String(i + 1).padStart(2, '0')}</span>`;
  btn.addEventListener('click', () => openWindow(w, btn));
  windowsEl.appendChild(btn);
});

function setActive(btn) {
  document.querySelectorAll('.win-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function clearMarkers() {
  markerLayer.clearLayers();
}

document.getElementById('clear-markers').addEventListener('click', clearMarkers);

async function openWindow(w, btn) {
  setActive(btn);
  clearMarkers();
  detailTitle.textContent = w.title;
  detailSub.textContent = 'Consultando fuentes oficiales…';
  detailBody.innerHTML = '<div class="loading">Cargando datos…</div>';
  try {
    const res = await fetch(API + w.endpoint);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Error en la consulta');
    const data = json.data;
    detailSub.textContent = sourceSubtitle(w.id);
    render(w.id, data);
  } catch (err) {
    detailBody.innerHTML = `<div class="empty">No fue posible consultar la fuente: ${err.message}</div>`;
  }
}

function sourceSubtitle(id) {
  const map = {
    resumen: 'Resumen construido con datos oficiales consultados en tiempo real.',
    localidad: 'IDECA – Capa Localidad (Localidad 11, Suba).',
    librerias: 'IDECA – Bibliotecas en el barrio y su entorno cercano (hasta 2,5 km).',
    'areas-verdes': 'IDECA – Parques en el barrio y su entorno cercano (hasta 2,5 km).',
    'escenarios-deportivos': 'IDECA – Escenarios deportivos en el barrio y entorno cercano.',
    educacion: 'IDECA – Colegios en el barrio y su entorno cercano (hasta 2,5 km).',
    policia: 'SDS – CAI y estaciones en el barrio y entorno cercano (hasta 4 km).',
    'estado-calles': 'Dataset oficial disponible solo en archivo comprimido; sin registros puntuales.',
    veterinarias: 'OpenStreetMap – Veterinarias en Suba y entorno (hasta 5 km).',
    transporte: 'IDECA – TransMilenio, portales y paraderos SITP (hasta 3 km).',
    robo: 'Secretaría Distrital de Seguridad – Delito de Alto Impacto, Suba.',
    catastral: 'IDECA – Sectores catastrales del barrio y entorno (hasta 2,5 km).',
    camaras: 'SDSCJ (videovigilancia) + SIMUR (fotodetección) · barrio y entorno.',
    comida: 'IDT – Gastronomía de Suba en el barrio y entorno (hasta 4 km).',
    poligono: 'Delimitación oficial – Unidad de Planeamiento Zonal (UPZ 28 El Rincón).',
  };
  return map[id] || '';
}

function render(id, data) {
  if (id === 'resumen') return renderResumen(data);
  if (id === 'localidad') return renderLocalidad(data);
  if (id === 'robo') return renderRobo(data);
  if (id === 'poligono') return renderPoligono(data);
  if (Array.isArray(data)) return renderPlaceList(data);
  detailBody.innerHTML = '<div class="empty">Sin datos para mostrar.</div>';
}

function renderResumen(data) {
  const c = data.conteos;
  const stats = Object.entries(c).map(([k, v]) => `<div class="stat"><b>${v}</b><span>${pretty(k)}</span></div>`).join('');
  detailBody.innerHTML = `
    <p style="font-size:13px;color:var(--muted)">Localidad ${data.localidad.codigo} · ${data.localidad.nombre} · Barrio ${data.localidad.barrio} · UPZ ${data.localidad.upz}</p>
    <div class="stat-row">${stats}</div>
    ${data.delito ? `<h3 style="font-size:14px;margin-top:18px">Delito de alto impacto (${data.delito.periodo})</h3><table class="kv">${Object.entries(data.delito.totales).map(([k,v])=>`<tr><td>${pretty(k)}</td><td>${v}</td></tr>`).join('')}</table>` : ''}
  `;
}

function renderLocalidad(data) {
  detailBody.innerHTML = `
    <div class="cards">
      <div class="card"><h3>${data.nombre}</h3><p><span class="label">Código DANE</span><br>${data.codigo}</p><p><span class="label">Barrio</span><br>${data.barrio}</p><p><span class="label">UPZ</span><br>${data.upz}</p></div>
      <div class="card"><h3>Extensión</h3><p><span class="label">Área</span><br>${(data.area_m2 / 1e6).toFixed(2)} km²</p><p><span class="label">Acto administrativo</span><br>${data.acto_administrativo}</p></div>
    </div>`;
}

function renderRobo(data) {
  if (!data.totales) { detailBody.innerHTML = '<div class="empty">Sin registros disponibles.</div>'; return; }
  detailBody.innerHTML = `<p style="font-size:12px;color:var(--muted)">${data.periodo} · Fuente: ${data.fuente}</p>
    <table class="kv">${Object.entries(data.totales).map(([k,v])=>`<tr><td>${pretty(k)}</td><td><b>${v}</b></td></tr>`).join('')}</table>`;
}

function renderPoligono(data) {
  if (polygonLayer) {
    map.fitBounds(polygonLayer.getBounds(), { padding: [50, 50] });
  }
  const f = data.features[0];
  const p = f.properties;
  detailBody.innerHTML = `
    <div class="cards">
      <div class="card"><h3>Zona de estudio oficial</h3>
        <p><span class="label">Delimitación</span><br>${escapeHtml(p.NOMBRE)}</p>
        <p><span class="label">Localidad</span><br>11 · Suba</p>
        <p><span class="label">UPZ</span><br>${escapeHtml(String(p.CODIGO_UPZ))} · El Rincón</p>
        <p><span class="label">Núcleo del barrio</span><br>${escapeHtml(p.BARRIO_NUCLEO || 'Las Flores')}</p>
        <p><span class="label">Fuente</span><br>${escapeHtml(p.FUENTE || 'IDECA – Unidad de Planeamiento Zonal')}</p>
      </div>
      <div class="card"><h3>Qué incluye</h3>
        <p>El polígono oficial de la <b>UPZ 28 El Rincón</b> abarca el barrio <b>Las Flores</b>, el sector <b>El Poa</b> y el área de <b>Centro Suba</b>.</p>
        <p>La línea verde punteada es la zona de estudio; la línea dorada marca el núcleo oficial del barrio Las Flores.</p>
        <p class="source">Datos filtrados dentro de esta delimitación y su entorno inmediato.</p>
      </div>
    </div>`;
}

function geoBadge(it) {
  if (it.dentro_barrio === true) return '<span class="badge in">Dentro del barrio</span>';
  if (it.distancia_m != null) return `<span class="badge near">A ${it.distancia_m} m del límite</span>`;
  return '<span class="badge area">Dato zonal (UPZ / localidad)</span>';
}

function renderValue(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'object' && !Array.isArray(v)) {
    return `<div class="subtable">${Object.entries(v).map(([k, n]) =>
      `<div><span>${escapeHtml(k)}</span><b>${escapeHtml(String(n))}</b></div>`).join('')}</div>`;
  }
  return escapeHtml(String(v));
}

function renderPlaceList(items) {
  if (!items.length) {
    detailBody.innerHTML = '<div class="empty">No se encontraron registros dentro del polígono oficial (UPZ 28 El Rincón) en las fuentes consultadas. No se mostraron datos inventados.</div>';
    return;
  }
  const cards = items.map((it, idx) => {
    if (it.lat != null && it.lng != null) {
      L.marker([it.lat, it.lng])
        .bindPopup(`<b>${escapeHtml(it.nombre || it.tipo || 'Ubicación')}</b><br>${geoBadge(it)}`)
        .addTo(markerLayer);
    }

    const fields = Object.entries(it).filter(([k]) =>
      !['lat', 'lng', 'fuente', 'dentro_barrio', 'distancia_m'].includes(k));
    return `<div class="card"><h3>${idx + 1}. ${escapeHtml(it.nombre || 'Registro')}</h3>
      <div class="badges">${geoBadge(it)}</div>
      ${fields.map(([k,v]) => v ? `<p><span class="label">${pretty(k)}</span><br>${renderValue(v)}</p>` : '').join('')}
      ${it.fuente ? `<p class="source">${escapeHtml(it.fuente)}</p>` : ''}
      ${it.lat != null ? `<p class="source">📍 ${it.lat.toFixed(6)}, ${it.lng.toFixed(6)}</p>` : ''}
    </div>`;
  }).join('');
  detailBody.innerHTML = `<div class="cards">${cards}</div>`;
  if (markerLayer.getLayers().length) {
    const group = L.featureGroup(markerLayer.getLayers());
    map.fitBounds(group.getBounds().pad(0.2));
  }
}

function pretty(k) {
  return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

loadPolygon().catch(err => console.error('No se pudo cargar el polígono:', err));

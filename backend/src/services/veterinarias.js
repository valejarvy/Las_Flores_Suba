const fs = require('fs');
const path = require('path');
const { withinBuffer } = require('../utils/geo');

const data = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', '..', 'data', 'veterinarias.json'), 'utf8'
));

function localidadDe(displayName) {
  const m = displayName.match(/Localidad\s+([^,]+)/i);
  return m ? m[1].trim() : null;
}

async function getVeterinarias() {
  return data.features
    .map(v => ({ ...v, g: withinBuffer(v.lng, v.lat, 0) }))
    .filter(v => v.g.near)
    .map(v => ({
      nombre: v.nombre || 'Veterinaria (sin nombre en OSM)',
      tipo: v.tipo || 'Veterinaria',
      direccion: v.display_name.split(',').slice(0, 2).join(',').trim(),
      localidad: localidadDe(v.display_name),
      lat: v.lat,
      lng: v.lng,
      dentro_barrio: v.g.inside,
      distancia_m: v.g.distance,
      fuente: 'OpenStreetMap / Nominatim (consulta realizada para esta aplicación)',
    }));
}

module.exports = { getVeterinarias };

const fs = require('fs');
const path = require('path');
const { withinBuffer } = require('../utils/geo');

const data = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', '..', 'data', 'gastronomia.geojson'), 'utf8'
));

async function getComida() {
  return data.features
    .filter(f => Number(f.properties.Nombre_Loc) === 11)
    .map(f => ({
      lng: Number(f.properties.Longitud),
      lat: Number(f.properties.Latitud),
      nombre: f.properties.Nombre_Est,
      subcategoria: f.properties.Subcategor,
      sector: f.properties.Sector_Cat,
    }))
    .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng) &&
      withinBuffer(p.lng, p.lat, 0).near)
    .map(p => {
      const g = withinBuffer(p.lng, p.lat, 0);
      return {
        ...p,
        dentro_barrio: g.inside,
        distancia_m: g.distance,
        fuente: 'Bogotá D.C. – Instituto Distrital de Turismo (Establecimientos de Gastronomía y Bar)',
      };
    });
}

module.exports = { getComida };

const { fetchAllFeatures } = require('../utils/arcgis');
const { pointInPolygon, outerRing, withinBuffer } = require('../utils/geo');

function ringIntersects(ring) {
  if (ring.some(p => Array.isArray(p) && pointInPolygon(p[0], p[1]))) return true;
  if (outerRing.some(p => pointInPolygon(p[0], p[1], ring))) return true;
  return false;
}

function centroid(ring) {
  const pts = ring.filter(Array.isArray);
  return [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
  ];
}

function coords(f) {
  const g = f.geometry;
  if (!g) return null;
  if (g.type === 'Point') return g.coordinates;
  if (g.type === 'Polygon') return centroid(g.coordinates[0]);
  if (g.type === 'MultiPolygon') return centroid(g.coordinates[0][0]);
  return null;
}

async function getCatastral() {
  const features = await fetchAllFeatures('catastro/sectorcatastral', 0, {
    outFields: 'SCACODIGO,SCATIPO,SCANOMBRE,SHAPE.AREA',
  });

  return features
    .filter(f => {
      if (!f.geometry) return false;
      const c = coords(f);
      if (!c) return false;
      if (f.geometry.type !== 'Point' && ringIntersects(
        f.geometry.type === 'Polygon' ? f.geometry.coordinates[0]
          : f.geometry.coordinates[0][0]
      )) return true;
      return withinBuffer(c[0], c[1], 0).near;
    })
    .map(f => {
      const [lng, lat] = coords(f);
      const g = withinBuffer(lng, lat, 0);
      return {
        codigo: f.properties.SCACODIGO,
        nombre: f.properties.SCANOMBRE,
        tipo: f.properties.SCATIPO,
        area_m2: f.properties['SHAPE.AREA'],
        lat, lng,
        dentro_barrio: g.inside,
        distancia_m: g.distance,
        fuente: 'IDECA – Catastro Distrital (Sector Catastral)',
      };
    });
}

module.exports = { getCatastral };

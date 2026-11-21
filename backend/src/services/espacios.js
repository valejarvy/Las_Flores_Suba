const { fetchAllFeatures } = require('../utils/arcgis');
const { pointInPolygon, outerRing, withinBuffer } = require('../utils/geo');

function ringIntersects(ring) {
  // any park vertex inside barrio
  if (ring.some(p => Array.isArray(p) && pointInPolygon(p[0], p[1]))) return true;
  // any barrio vertex inside park polygon
  if (outerRing.some(p => pointInPolygon(p[0], p[1], ring))) return true;
  return false;
}

async function getEspacios() {
  const [features, canchas] = await Promise.all([
    fetchAllFeatures('recreaciondeporte/parquesyescenarios', 1, {
      outFields: 'NOMBREPAR,TIPOPARQUE,TIPOLOGIA,ESTRATO,LOCNOMBRE,ADMINISTRA,ESTADOCER',
    }),
    fetchAllFeatures('recreaciondeporte/canchasintetica', 0, {
      outFields: '*',
    }).catch(() => []),
  ]);
  const inside = features.filter(f => {
    const g = f.geometry;
    if (!g) return false;
    if (g.type === 'Point') return withinBuffer(g.coordinates[0], g.coordinates[1], 0).near;
    const ring = g.type === 'Polygon' ? g.coordinates[0]
      : (g.type === 'MultiPolygon' ? g.coordinates[0][0] : null);
    if (!ring) return false;
    if (ringIntersects(ring)) return true;
    const c = centroid(ring);
    return withinBuffer(c[0], c[1], 0).near;
  });

  const areasVerdes = inside
    .filter(f => !/deport|escenario|cancha|coliseo|estadio/i.test(
      `${f.properties.TIPOLOGIA || ''} ${f.properties.TIPOPARQUE || ''} ${f.properties.NOMBREPAR || ''}`))
    .map(mapFeature);

  const escenarios = inside
    .filter(f => /deport|escenario|cancha|coliseo|estadio|parque.*deport/i.test(
      `${f.properties.TIPOLOGIA || ''} ${f.properties.TIPOPARQUE || ''} ${f.properties.NOMBREPAR || ''}`))
    .map(mapFeature);

  const canchasEscenarios = canchas
    .filter(f => {
      const g = f.geometry;
      if (!g) return false;
      const ring = g.type === 'Polygon' ? g.coordinates[0]
        : (g.type === 'MultiPolygon' ? g.coordinates[0][0] : null);
      if (!ring) return false;
      if (ringIntersects(ring)) return true;
      const c = centroid(ring);
      return withinBuffer(c[0], c[1], 0).near;
    })
    .map(f => {
      const ring = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0]
        : f.geometry.coordinates[0][0];
      const [lng, lat] = centroid(ring);
      const g = withinBuffer(lng, lat, 0);
      return {
        nombre: f.properties.PARQUE || 'Cancha sintética',
        tipo: 'Cancha sintética',
        direccion: f.properties['DIRECCIÓN'] || f.properties.DIRECCION || null,
        localidad: f.properties.LOCALIDAD,
        tipologia: f.properties.TIPO_PARQU,
        lat, lng,
        dentro_barrio: g.inside,
        distancia_m: g.distance,
        fuente: 'IDECA – IDRD (Canchas Sintéticas)',
      };
    });

  return { areasVerdes, escenarios: [...escenarios, ...canchasEscenarios] };
}

function centroid(ring) {
  const pts = ring.filter(Array.isArray);
  const lng = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const lat = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return [lng, lat];
}

function mapFeature(f) {
  let lng, lat;
  if (f.geometry.type === 'Point') {
    [lng, lat] = f.geometry.coordinates;
  } else {
    const ring = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0]
      : f.geometry.coordinates[0][0];
    [lng, lat] = centroid(ring);
  }
  const g = withinBuffer(lng, lat, 0);
  return {
    nombre: f.properties.NOMBREPAR,
    tipo: f.properties.TIPOPARQUE,
    tipologia: f.properties.TIPOLOGIA,
    estrato: f.properties.ESTRATO,
    administrador: f.properties.ADMINISTRA,
    estado: f.properties.ESTADOCER,
    lat,
    lng,
    dentro_barrio: g.inside,
    distancia_m: g.distance,
    fuente: 'IDECA – Sistema Distrital de Parques y Escenarios Públicos Deportivos',
  };
}

module.exports = { getEspacios };

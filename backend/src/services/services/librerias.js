const { fetchAllFeatures } = require('../utils/arcgis');
const { withinBuffer } = require('../utils/geo');

async function getLibrerias() {
  const features = await fetchAllFeatures('educacion/infraestructuraeducativa', 2, {
    outFields: 'BIBNOMBRE,BIBDIRECC,BIBHORARIO,BIBTELEF,BIBPAGWEB,BIBEMAIL',
  });
  return features
    .filter(f => {
      if (!f.geometry || f.geometry.type !== 'Point') return false;
      return withinBuffer(f.geometry.coordinates[0], f.geometry.coordinates[1], 2000).near;
    })
    .map(f => {
      const [lng, lat] = f.geometry.coordinates;
      const g = withinBuffer(lng, lat, 2000);
      return {
        nombre: f.properties.BIBNOMBRE,
        direccion: f.properties.BIBDIRECC,
        horario: f.properties.BIBHORARIO,
        telefono: f.properties.BIBTELEF,
        web: f.properties.BIBPAGWEB,
        email: f.properties.BIBEMAIL,
        lat, lng,
        dentro_barrio: g.inside,
        distancia_m: g.distance,
        fuente: 'IDECA – Bibliotecas Públicas (Infraestructura Educativa)',
      };
    });
}

module.exports = { getLibrerias };

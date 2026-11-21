const { fetchAllFeatures } = require('../utils/arcgis');
const { withinBuffer } = require('../utils/geo');

async function getEducacion() {
  const features = await fetchAllFeatures('educacion/infraestructuraeducativa', 0, {
    outFields: 'NOMBRE_EST,DIRECCION,BARRIO__GE,TELEFONO,EMAIL,WEB,SECTOR,NATU_JUR,ESTADO,ESTRATO',
  });
  return features
    .filter(f => {
      if (!f.geometry || f.geometry.type !== 'Point') return false;
      return withinBuffer(f.geometry.coordinates[0], f.geometry.coordinates[1], 0).near;
    })
    .map(f => {
      const [lng, lat] = f.geometry.coordinates;
      const g = withinBuffer(lng, lat, 0);
      return {
        nombre: f.properties.NOMBRE_EST,
        direccion: f.properties.DIRECCION,
        barrio: f.properties.BARRIO__GE,
        telefono: f.properties.TELEFONO,
        email: f.properties.EMAIL,
        web: f.properties.WEB,
        sector: f.properties.SECTOR,
        estado: f.properties.ESTADO,
        estrato: f.properties.ESTRATO,
        lat, lng,
        dentro_barrio: g.inside,
        distancia_m: g.distance,
        fuente: 'IDECA – Infraestructura Educativa (Colegios)',
      };
    });
}

module.exports = { getEducacion };

const { fetchAllFeatureServer } = require('../utils/arcgis');
const { withinBuffer } = require('../utils/geo');

async function fetchScj(layerId, fields) {
  const base = 'https://oaiee.scj.gov.co/agc/rest/services/Tematicos_NR/EquipamientoPMSDSCJ/MapServer';
  // Reuse the FeatureServer helper by pointing at the MapServer endpoint (same query API).
  return fetchAllFeatureServer(base, layerId, { outFields: fields });
}

async function getPolicia() {
  const [cais, estaciones] = await Promise.all([
    fetchScj(22, 'CAINOMBRE,CAIDIR_SIT,CAIHORARIO,CAITELEFON,CAILATITUD,CAILONGITU,CAIIULOCAL'),
    fetchScj(23, 'EPONOMBRE,EPODIR_SITIO,EPOHORARIO,EPOTELEFON,EPOLATITUD,EPOLONGITU,EPOIULOCAL'),
  ]);

  const near = f => {
    if (!f.geometry || f.geometry.type !== 'Point') return null;
    return withinBuffer(f.geometry.coordinates[0], f.geometry.coordinates[1], 0);
  };

  const map = (f, tipo, prefix, fields, fuente) => {
    const g = near(f);
    const [lng, lat] = f.geometry.coordinates;
    return {
      tipo,
      nombre: f.properties[`${prefix}NOMBRE`],
      direccion: f.properties[fields.dir],
      horario: f.properties[fields.horario],
      telefono: f.properties[fields.tel],
      lat, lng,
      dentro_barrio: g.inside,
      distancia_m: g.distance,
      fuente,
    };
  };

  return [
    ...cais.filter(f => near(f) && near(f).near).map(f => map(
      f, 'CAI – Comando de Atención Inmediata', 'CAI',
      { dir: 'CAIDIR_SIT', horario: 'CAIHORARIO', tel: 'CAITELEFON' },
      'Alcaldía de Bogotá – Secretaría Distrital de Seguridad (CAI)'
    )),
    ...estaciones.filter(f => near(f) && near(f).near).map(f => map(
      f, 'Estación de Policía', 'EPO',
      { dir: 'EPODIR_SITIO', horario: 'EPOHORARIO', tel: 'EPOTELEFON' },
      'Alcaldía de Bogotá – Secretaría Distrital de Seguridad (Estaciones)'
    )),
  ];
}

module.exports = { getPolicia };

const { fetchAllFeatures } = require('../utils/arcgis');
const { withinBuffer } = require('../utils/geo');

async function getTransporte() {
  const [estaciones, portales, paraderos] = await Promise.all([
    fetchAllFeatures('movilidad/transportepublico', 1, { outFields: 'ETRNOMBRE,ETRTESTAC' }),
    fetchAllFeatures('movilidad/transportepublico', 2, { outFields: '*' }),
    fetchAllFeatures('movilidad/transportepublico', 5, { outFields: '*' }),
  ]);

  const near = f => {
    if (!f.geometry || f.geometry.type !== 'Point') return null;
    return withinBuffer(f.geometry.coordinates[0], f.geometry.coordinates[1], 0);
  };

  const nombreDe = (props, campo) => {
    if (campo && props[campo]) return props[campo];
    const k = Object.keys(props).find(x => /NOMBRE|NOMB|PARADA|ESTAC/i.test(x));
    return k ? props[k] : `Registro ${props.OBJECTID || ''}`.trim();
  };

  const map = (f, tipo, campo) => {
    const g = near(f);
    const [lng, lat] = f.geometry.coordinates;
    return {
      tipo,
      nombre: nombreDe(f.properties, campo),
      direccion: f.properties.PSIDIRECCI || f.properties.DIRECCION || null,
      lat, lng,
      dentro_barrio: g.inside,
      distancia_m: g.distance,
      fuente: 'IDECA – Sistema de Transporte Público',
    };
  };

  return [
    ...estaciones.filter(f => near(f) && near(f).near).map(f => map(f, 'Estación TransMilenio', 'ETRNOMBRE')),
    ...portales.filter(f => near(f) && near(f).near).map(f => map(f, 'Portal TransMilenio', null)),
    ...paraderos.filter(f => near(f) && near(f).near).map(f => map(f, 'Paradero SITP', null)),
  ];
}

module.exports = { getTransporte };

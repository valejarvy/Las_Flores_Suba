const { queryWhere } = require('../utils/arcgis');

async function getLocalidad() {
  const features = await queryWhere('ordenamientoterritorial/localidad', 0, "LOCNOMBRE='SUBA'", '*', false);
  const f = features[0];
  const a = f ? f.attributes : {};
  return {
    nombre: 'Suba',
    codigo: a.LOCCODIGO || '11',
    area_m2: a.LOCAREA || null,
    acto_administrativo: a.LOCAADMINI || null,
    barrio: 'Las Flores',
    upz: 28,
  };
}

module.exports = { getLocalidad };

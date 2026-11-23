const { fetchAllFeatureServer, queryWhere } = require('../utils/arcgis');
const { withinBuffer } = require('../utils/geo');

const SCJ_VIDEOVIGILANCIA =
  'https://oaiee.scj.gov.co/agc/rest/services/SistemaVideoVigilancia/CamarasTerritorio/MapServer';
const SIMUR =
  'https://sig.simur.gov.co/arcgis/rest/services/DatosAbiertos/CamarasSalvavidas/FeatureServer';

const ALIASES = {
  CVISCEPOLC: 'Estaciones de Policía',
  CVISCCAIPO: 'CAIs de Policía',
  CVISCCOLEG: 'Colegios',
  CVISCCTP: 'Centros de Traslado por Protección (CTP)',
  CVISCCAMPI: 'Campán',
  CVISCSCIUD: 'Seguridad Ciudadana',
  CVISCTRANS: 'TransMilenio',
  CVISCPRIVA: 'Privados',
  CVISCMOVID: 'Movilidad',
  CVISCTMREC: 'TransMilenio Recaudo',
  CVISCINVIA: 'INVIAS',
  CVISCCCAR: 'CAR',
  CVISCTINST: 'Total cámaras',
  CVISCTADMSCJ: 'Administradas por SDSCJ',
};

const UPZ_ALIASES = {
  CVIUPEPOLC: 'Estaciones de Policía',
  CVIUPCAIPO: 'CAIs de Policía',
  CVIUPCOLEG: 'Colegios',
  CVIUPCTP: 'Centros de Traslado por Protección (CTP)',
  CVIUPCAMPI: 'Campán',
  CVIUPSCIUD: 'Seguridad Ciudadana',
  CVIUPTRANS: 'TransMilenio',
  CVIUPPRIVA: 'Privados',
  CVIUPMOVID: 'Movilidad',
  CVIUPTMREC: 'TransMilenio Recaudo',
  CVIUPINVIA: 'INVIAS',
  CVIUPCCAR: 'CAR',
  CVIUPTINST: 'Total cámaras',
  CVIUPTADMSCJ: 'Administradas por SDSCJ',
};

function conteos(attrs, aliases) {
  const out = {};
  for (const [code, label] of Object.entries(aliases)) {
    const value = attrs[code];
    if (value != null) out[label] = value;
  }
  return out;
}

async function getConteosSeguridad() {
  const fields = Object.keys(ALIASES).join(',') + ',CVISCNOMBR,CVISCCODIG';
  const fieldsUpz = Object.keys(UPZ_ALIASES).join(',') + ',CVIUPNOMBR,CVIUPCODIG';

  const [sector, upz] = await Promise.all([
    queryWhere(SCJ_VIDEOVIGILANCIA, 2, "CVISCCODIG='009203'", fields, false),
    queryWhere(SCJ_VIDEOVIGILANCIA, 1, "CVIUPCODIG='UPZ28'", fieldsUpz, false),
  ]);

  const items = [];
  if (sector.length) {
    const a = sector[0].attributes;
    items.push({
      tipo: 'Cámaras de seguridad ciudadana · Sector catastral',
      nombre: a.CVISCNOMBR,
      codigo: a.CVISCCODIG,
      dentro_barrio: true,
      distancia_m: 0,
      conteos: conteos(a, ALIASES),
      fuente: 'SDSCJ – Sistema de Videovigilancia, cámaras por sector catastral',
    });
  }
  if (upz.length) {
    const a = upz[0].attributes;
    items.push({
      tipo: 'Cámaras de seguridad ciudadana · UPZ',
      nombre: a.CVIUPNOMBR,
      codigo: a.CVIUPCODIG,
      dentro_barrio: false,
      distancia_m: null,
      conteos: conteos(a, UPZ_ALIASES),
      fuente: 'SDSCJ – Sistema de Videovigilancia, cámaras por UPZ',
    });
  }
  return items;
}

async function getCamarasFotodeteccion() {
  const features = await fetchAllFeatureServer(SIMUR, 0, {
    outFields: 'ID,DIRECCION_FOTODETECCION,CORREDOR,LOCALIDAD,TIPO_CAMARA,ESTADO_PUNTO,ULTIMO_MANTENIMIENTO',
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
        id: f.properties.ID,
        tipo: 'Cámara Salvavidas (fotodetección en vía)',
        nombre: f.properties.DIRECCION_FOTODETECCION || `Cámara ${f.properties.ID}`,
        direccion: f.properties.DIRECCION_FOTODETECCION,
        corredor: f.properties.CORREDOR,
        clase: f.properties.TIPO_CAMARA,
        estado: f.properties.ESTADO_PUNTO,
        mantenimiento: f.properties.ULTIMO_MANTENIMIENTO,
        localidad: f.properties.LOCALIDAD,
        lat, lng,
        dentro_barrio: g.inside,
        distancia_m: g.distance,
        fuente: 'Bogotá D.C. – SIMUR / Secretaría Distrital de Movilidad (Cámaras Salvavidas)',
      };
    });
}

async function getCamaras() {
  const [seguridad, fotodeteccion] = await Promise.all([
    getConteosSeguridad().catch(err => {
      console.error('Error consultando videovigilancia SDSCJ:', err.message);
      return [];
    }),
    getCamarasFotodeteccion().catch(err => {
      console.error('Error consultando cámaras SIMUR:', err.message);
      return [];
    }),
  ]);
  return [...seguridad, ...fotodeteccion];
}

module.exports = { getCamaras };

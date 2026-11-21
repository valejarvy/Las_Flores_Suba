const { queryWhere } = require('../utils/arcgis');

async function getRobo() {
  const features = await queryWhere(
    'https://oaiee.scj.gov.co/agc/rest/services/Tematicos_Pub/CifrasSCJ/MapServer', 0,
    "CMNOMLOCAL='Suba'",
    'CMNOMLOCAL,CMIULOCAL,CMMES,CMHTOTAL,CMLPTOTAL,CMHPTOTAL,CMHRTOTAL,CMHATOTAL,CMHCTOTAL,CMHMTOTAL,CMDSTOTAL,CMVITOTAL,CMETOTAL,CMSTOTAL,CMHFTOTAL',
    false
  );
  if (!features.length) return { localidad: 'Suba', registros: [] };
  const a = features[0].attributes;
  return {
    localidad: 'Suba',
    periodo: a.CMMES,
    // Se conservan los códigos oficiales del conjunto de datos para no asignar
    // etiquetas que el productor del dato no define explícitamente.
    totales: {
      CMHTOTAL: a.CMHTOTAL,
      CMLPTOTAL: a.CMLPTOTAL,
      CMHPTOTAL: a.CMHPTOTAL,
      CMHRTOTAL: a.CMHRTOTAL,
      CMHATOTAL: a.CMHATOTAL,
      CMHCTOTAL: a.CMHCTOTAL,
      CMHMTOTAL: a.CMHMTOTAL,
      CMDSTOTAL: a.CMDSTOTAL,
      CMVITOTAL: a.CMVITOTAL,
      CMETOTAL: a.CMETOTAL,
      CMSTOTAL: a.CMSTOTAL,
      CMHFTOTAL: a.CMHFTOTAL,
    },
    fuente: 'Bogotá D.C. – Secretaría Distrital de Seguridad, Convivencia y Justicia (Delito de Alto Impacto)',
  };
}

module.exports = { getRobo };

const path = require('path');
const express = require('express');
const cors = require('cors');

const { getLocalidad } = require('../backend/src/services/localidad');
const { getLibrerias } = require('../backend/src/services/librerias');
const { getEspacios } = require('../backend/src/services/espacios');
const { getEducacion } = require('../backend/src/services/educacion');
const { getPolicia } = require('../backend/src/services/policia');
const { getVeterinarias } = require('../backend/src/services/veterinarias');
const { getTransporte } = require('../backend/src/services/transporte');
const { getRobo } = require('../backend/src/services/robo');
const { getCatastral } = require('../backend/src/services/catastral');
const { getCamaras } = require('../backend/src/services/camaras');
const { getComida } = require('../backend/src/services/comida');
const { getEstadoCalles } = require('../backend/src/services/estadoCalles');
const { polygonGeoJSON, nucleoGeoJSON } = require('../backend/src/utils/geo');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function route(fn) {
  return async (req, res) => {
    try {
      const data = await fn();
      res.json({ ok: true, data });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, error: err.message });
    }
  };
}

app.get('/api/polygon', route(() => polygonGeoJSON()));
app.get('/api/polygon/nucleo', route(() => nucleoGeoJSON()));

app.get('/api/localidad', route(getLocalidad));
app.get('/api/librerias', route(getLibrerias));

app.get('/api/areas-verdes', route(async () => (await getEspacios()).areasVerdes));
app.get('/api/escenarios-deportivos', route(async () => (await getEspacios()).escenarios));

app.get('/api/educacion', route(getEducacion));
app.get('/api/policia', route(getPolicia));
app.get('/api/veterinarias', route(getVeterinarias));
app.get('/api/transporte', route(getTransporte));
app.get('/api/robo', route(getRobo));
app.get('/api/catastral', route(getCatastral));
app.get('/api/camaras', route(getCamaras));
app.get('/api/comida', route(getComida));
app.get('/api/estado-calles', route(getEstadoCalles));

app.get('/api/resumen', route(async () => {
  const [localidad, librerias, espacios, educacion, policia, transporte, robo, catastral, camaras, comida] =
    await Promise.all([
      getLocalidad(), getLibrerias(), getEspacios(), getEducacion(), getPolicia(),
      getTransporte(), getRobo(), getCatastral(), getCamaras(), getComida(),
    ]);
  return {
    localidad,
    conteos: {
      librerias: librerias.length,
      areasVerdes: espacios.areasVerdes.length,
      escenariosDeportivos: espacios.escenarios.length,
      colegios: educacion.length,
      centrosPolicia: policia.length,
      estacionesTransporte: transporte.length,
      sectoresCatastrales: catastral.length,
      camaras: camaras.length,
      sitiosComida: comida.length,
    },
    delito: robo.totales ? { periodo: robo.periodo, totales: robo.totales } : null,
  };
}));

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`API y frontend disponibles en http://localhost:${PORT}`);
});

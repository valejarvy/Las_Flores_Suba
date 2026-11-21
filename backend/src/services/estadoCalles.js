// El dataset "Estado Superficial. Bogotá D.C." se publica en archivos CSV/DBF
// comprimidos en 7z y no expone un servicio REST consultable por barrio.
// Para no inventar datos, se reporta la ausencia de registros georreferenciados
// disponibles y se indica la fuente oficial.
async function getEstadoCalles() {
  return [];
}

module.exports = { getEstadoCalles };

const BASE = 'https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services';

async function fetchAllFeatures(servicePath, layerId, options = {}) {
  const {
    where = '1=1',
    outFields = '*',
    returnGeometry = true,
    pageSize = 2000,
    maxPages = 100,
  } = options;
  const all = [];
  let offset = 0;
  for (let page = 0; page < maxPages; page++) {
    const url = `${BASE}/${servicePath}/MapServer/${layerId}/query` +
      `?where=${encodeURIComponent(where)}` +
      `&outFields=${encodeURIComponent(outFields)}` +
      `&returnGeometry=${returnGeometry}` +
      `&outSR=4326` +
      `&resultRecordCount=${pageSize}` +
      `&resultOffset=${offset}` +
      `&f=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const json = await res.json();
    if (json.error) throw new Error(JSON.stringify(json.error));
    const feats = json.features || [];
    all.push(...feats);
    if (feats.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

async function fetchAllFeatureServer(baseUrl, layerId, options = {}) {
  const {
    where = '1=1',
    outFields = '*',
    returnGeometry = true,
    pageSize = 2000,
    maxPages = 100,
  } = options;
  const all = [];
  let offset = 0;
  for (let page = 0; page < maxPages; page++) {
    const url = `${baseUrl}/${layerId}/query` +
      `?where=${encodeURIComponent(where)}` +
      `&outFields=${encodeURIComponent(outFields)}` +
      `&returnGeometry=${returnGeometry}` +
      `&outSR=4326` +
      `&resultRecordCount=${pageSize}` +
      `&resultOffset=${offset}` +
      `&f=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const json = await res.json();
    if (json.error) throw new Error(JSON.stringify(json.error));
    const feats = json.features || [];
    all.push(...feats);
    if (feats.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

async function queryWhere(servicePath, layerId, where, outFields = '*', returnGeometry = false) {
  const base = servicePath.startsWith('http')
    ? `${servicePath}/${layerId}/query`
    : `${BASE}/${servicePath}/MapServer/${layerId}/query`;
  const url = base +
    `?where=${encodeURIComponent(where)}` +
    `&outFields=${encodeURIComponent(outFields)}` +
    `&returnGeometry=${returnGeometry}` +
    `&f=json`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.error) throw new Error(JSON.stringify(json.error));
  return json.features || [];
}

module.exports = { fetchAllFeatures, fetchAllFeatureServer, queryWhere, BASE };

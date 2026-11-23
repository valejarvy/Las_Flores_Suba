const fs = require('fs');
const path = require('path');

const polygonPath = path.join(__dirname, '..', '..', 'data', 'lasflores.geojson');
const geojson = JSON.parse(fs.readFileSync(polygonPath, 'utf8'));
const nucleoPath = path.join(__dirname, '..', '..', 'data', 'lasflores_nucleo.geojson');
let nucleoGeojson = null;
try {
  nucleoGeojson = JSON.parse(fs.readFileSync(nucleoPath, 'utf8'));
} catch (_) {
  nucleoGeojson = null;
}

// Collect all rings from the first feature
const feature = geojson.features[0];
const geometry = feature.geometry;
let rings = [];
if (geometry.type === 'Polygon') rings = geometry.coordinates;
else if (geometry.type === 'MultiPolygon') geometry.coordinates.forEach(p => rings.push(...p));

// outer ring (first ring of first polygon)
const outerRing = rings[0];

function bbox() {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  outerRing.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng); minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng); maxLat = Math.max(maxLat, lat);
  });
  return { minLng, minLat, maxLng, maxLat };
}

function pointInPolygon(lng, lat, ring = outerRing) {
  // ray casting
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function polygonGeoJSON() {
  return geojson;
}

function nucleoGeoJSON() {
  return nucleoGeojson;
}

const LAT0 = 4.7436;
const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LNG = 111320 * Math.cos(LAT0 * Math.PI / 180);

function toXY(lng, lat) {
  return [lng * M_PER_DEG_LNG, lat * M_PER_DEG_LAT];
}

function distPointSegment(p, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const wx = p[0] - a[0], wy = p[1] - a[1];
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2));
  const cx = a[0] + t * vx, cy = a[1] + t * vy;
  return Math.hypot(p[0] - cx, p[1] - cy);
}

function distanceToPolygon(lng, lat) {
  const p = toXY(lng, lat);
  let min = Infinity;
  for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
    const a = toXY(outerRing[j][0], outerRing[j][1]);
    const b = toXY(outerRing[i][0], outerRing[i][1]);
    min = Math.min(min, distPointSegment(p, a, b));
  }
  return min;
}

function withinBuffer(lng, lat, meters = 2500) {
  const inside = pointInPolygon(lng, lat);
  const d = inside ? 0 : distanceToPolygon(lng, lat);
  return { inside, distance: Math.round(d), near: inside || d <= meters };
}

module.exports = {
  bbox, pointInPolygon, polygonGeoJSON, nucleoGeoJSON, outerRing,
  distanceToPolygon, withinBuffer, LAT0,
};

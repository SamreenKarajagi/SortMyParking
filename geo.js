const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;

export function distanceM(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Walking at ~4.5 km/h with a 1.25 detour factor for Pune's lanes.
export function walkMinutes(a, b) {
  return Math.max(1, Math.round((distanceM(a, b) * 1.25) / 75));
}

// Schematic projection for the city map (equirectangular, scaled by cos(lat)).
export const BOUNDS = { lat0: 18.63, lat1: 18.46, lng0: 73.69, lng1: 73.97 };
const K = 3600;
const COS = Math.cos(rad(18.53));
export function project(lat, lng) {
  return { x: (lng - BOUNDS.lng0) * K * COS, y: (BOUNDS.lat0 - lat) * K };
}
export const MAP_W = (BOUNDS.lng1 - BOUNDS.lng0) * K * COS;
export const MAP_H = (BOUNDS.lat0 - BOUNDS.lat1) * K;

export function directionsUrl(p) {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`;
}

export function towZoneAt(p, zones) {
  return zones.find((z) => distanceM(p, z) <= z.r) || null;
}

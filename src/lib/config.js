export const SERVER_BASE = (typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_API_BASE) ||
  "http://192.168.100.13/Fyp_Backend";

// Leaflet fallback center — Rawalpindi, identical to FALLBACK_CENTER in Map.js.
export const FALLBACK_CENTER = {
  latitude: parseFloat(
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_MAP_FALLBACK_LAT) || "33.6844"
  ),
  longitude: parseFloat(
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_MAP_FALLBACK_LNG) || "73.0479"
  ),
};

// Kept as a placeholder for parity with the original (GCP key was never used —
// the map is Leaflet/OSM).
export const GOOGLE_MAPS_API_KEY =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_GCP_API_KEY) || "[GCP_API_KEY]";

export const API_DASHBOARD = `${SERVER_BASE}/api/Dashboard`;
export const API_AUTH = `${SERVER_BASE}/api/Auth`;
export const API_ACCOUNT = `${SERVER_BASE}/api/AccountCreation`;
export const API_DIRECTORY = `${SERVER_BASE}/api/CompanyDirectory`;
export const API_POLICE = `${SERVER_BASE}/api/Police`;

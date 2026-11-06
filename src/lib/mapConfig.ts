export const HOME: [number, number] = [-35.5, -71.5];
export const HOME_ZOOM = 4;
export const SCHOOL_ZOOM = 11;

const CARTO_KEY = import.meta.env.VITE_CARTO_KEY;
export const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
export const GOOGLE_MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || "DEMO_MAP_ID";

/**
 * Tiles para Leaflet. Con clave CARTO usa sus estilos claro/oscuro; sin clave
 * usa OpenStreetMap (que no tiene modo oscuro: se simula con un filtro CSS).
 */
export function leafletTiles(dark: boolean) {
  if (CARTO_KEY) {
    return {
      url: `https://basemaps.cartocdn.com/rastertiles/${dark ? "dark_all" : "light_all"}/{z}/{x}/{y}.png?key=${CARTO_KEY}`,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      cssDark: false,
    };
  }
  return {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    cssDark: dark,
  };
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

import { useEffect, useState } from "react";
import { MapPin, ArrowUpRight, X } from "lucide-react";
import { colegios } from "@/content/colegios";
import SectionHeader from "./SectionHeader";
import SchoolList from "./SchoolList";
import { SchoolCover } from "./SchoolAlbum";
import DriveSchoolAlbum from './DriveSchoolAlbum';
import LeafletMap from "./LeafletMap";
import GoogleMapView from "./GoogleMapView";

type Provider = "leaflet" | "google";
const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "leaflet", label: "Leaflet" },
  { id: "google", label: "Google Maps" },
];

export default function SchoolsSection({ dark }: { dark: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const [provider, setProvider] = useState<Provider>(() => {
    try { return localStorage.getItem("cpt-map") === "google" ? "google" : "leaflet"; } catch { return "leaflet"; }
  });
  const choose = (p: Provider) => {
    setProvider(p);
    try { localStorage.setItem("cpt-map", p); } catch { /* sin almacenamiento */ }
  };
  const school = active === null ? null : colegios[active];

  // Escape cierra el detalle
  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <section id="colegios" aria-labelledby="colegios-titulo" className="mx-auto max-w-[1200px] px-6 pt-20">
      <SectionHeader
        id="colegios-titulo"
        title="Colegios visitados"
        text="Selecciona un colegio en la lista para ubicarlo en el mapa, o toca un marcador para encontrarlo en la lista."
      />

      {/* Anuncia la selección a lectores de pantalla */}
      <p role="status" className="sr-only">
        {school ? `Colegio seleccionado: ${school.name}, ${school.place}.` : ""}
      </p>

      <div className="mt-12 grid items-end gap-10 lg:grid-cols-[21.25rem_1fr]">
        <SchoolList activeIndex={active} onSelect={setActive} />

        {/* Device Mockup Frame: esquinas superiores 40px, base pegada al borde de la sección */}
        <div className="relative overflow-hidden rounded-t-large border border-b-0 border-line/20 bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/15 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line/25 px-3 py-1.5 text-caption">
                <MapPin size={13} strokeWidth={1.5} aria-hidden="true" /> {colegios.length} colegios
              </span>
              {school && (
                <button onClick={() => setActive(null)} className="rounded-full border border-line/25 px-3 py-1.5 text-caption text-fg2 transition hover:bg-glass/10">
                  Ver todo
                </button>
              )}
            </div>
            <div role="group" aria-label="Proveedor de mapa" className="flex rounded-full border border-line/25 p-0.5 text-caption">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  aria-pressed={provider === p.id}
                  onClick={() => choose(p.id)}
                  className={`rounded-full px-3 py-1.5 transition ${provider === p.id ? "bg-cta text-cta-fg" : "text-fg2 hover:text-fg"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div role="region" aria-label="Mapa de colegios visitados">
            {provider === "leaflet" ? (
              <LeafletMap key="leaflet" dark={dark} activeIndex={active} onMarkerClick={setActive} />
            ) : (
              <GoogleMapView key="google" dark={dark} activeIndex={active} onMarkerClick={setActive} />
            )}
          </div>

          {school && (
            <div key={active} className="absolute bottom-4 left-4 right-4 z-[1100] max-h-[calc(100%-5rem)] animate-fade-up overflow-y-auto rounded-card border border-line/20 bg-surface/85 p-5 backdrop-blur-sm md:right-auto md:w-[21.25rem]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-caption uppercase text-fg2">Colegio visitado</div>
                  <h3 className="mt-1 font-geist text-heading-sm font-medium">{school.name}</h3>
                </div>
                <button onClick={() => setActive(null)} aria-label="Cerrar detalle" title="Cerrar (Esc)" className="rounded-full border border-line/25 p-2 text-fg2 transition hover:bg-glass/10">
                  <X size={14} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-fg2">
                <MapPin size={14} strokeWidth={1.5} aria-hidden="true" /> {school.place}
              </div>
              {school.coverPhoto && <SchoolCover photo={school.coverPhoto} />}
              <div className="mt-1 text-caption tabular-nums text-fg2">
                {school.lat.toFixed(4)}, {school.lng.toFixed(4)}
              </div>
              <DriveSchoolAlbum school={school} />
              <a
                href={`https://www.openstreetmap.org/?mlat=${school.lat}&mlon=${school.lng}#map=14/${school.lat}/${school.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-cta px-4 py-2 text-sm text-cta-fg transition hover:opacity-90"
              >
                Abrir en OpenStreetMap
                <span className="sr-only"> (se abre en una pestaña nueva)</span>
                <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

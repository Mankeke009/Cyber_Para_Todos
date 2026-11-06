import { useEffect, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, ColorScheme, useMap } from "@vis.gl/react-google-maps";
import { colegios } from "@/content/colegios";
import { GOOGLE_KEY, GOOGLE_MAP_ID, HOME, HOME_ZOOM, SCHOOL_ZOOM, prefersReducedMotion } from "@/lib/mapConfig";

type Props = { dark: boolean; activeIndex: number | null; onMarkerClick: (i: number) => void };

function PanToActive({ activeIndex }: { activeIndex: number | null }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (!map) return;
    if (first.current) { first.current = false; return; }
    const target = activeIndex === null
      ? { lat: HOME[0], lng: HOME[1] }
      : { lat: colegios[activeIndex].lat, lng: colegios[activeIndex].lng };
    if (prefersReducedMotion()) map.setCenter(target);
    else map.panTo(target);
    map.setZoom(activeIndex === null ? HOME_ZOOM : SCHOOL_ZOOM);
  }, [activeIndex, map]);
  return null;
}

export default function GoogleMapView({ dark, activeIndex, onMarkerClick }: Props) {
  // Sin clave no se carga nada de Google (ni se genera cobro): se muestran instrucciones.
  if (!GOOGLE_KEY) {
    return (
      <div className="flex h-[420px] items-center justify-center p-8 md:h-[540px]">
        <div className="max-w-[46ch] text-center text-fg2">
          <div className="font-geist text-heading-sm font-medium text-fg">Falta la clave de Google Maps</div>
          <p className="mt-3 text-[0.9375rem]">
            Crea un archivo <code className="text-fg">.env</code> con{" "}
            <code className="text-fg">VITE_GOOGLE_MAPS_API_KEY=tu_clave</code> y reinicia{" "}
            <code className="text-fg">npm run dev</code>. Mira <code className="text-fg">.env.example</code>.
          </p>
        </div>
      </div>
    );
  }

  const start = activeIndex === null ? { lat: HOME[0], lng: HOME[1] } : { lat: colegios[activeIndex].lat, lng: colegios[activeIndex].lng };

  return (
    <APIProvider apiKey={GOOGLE_KEY} language="es">
      <Map
        className="h-[420px] w-full md:h-[540px]"
        mapId={GOOGLE_MAP_ID}
        defaultCenter={start}
        defaultZoom={activeIndex === null ? HOME_ZOOM : SCHOOL_ZOOM}
        colorScheme={dark ? ColorScheme.DARK : ColorScheme.LIGHT}
        gestureHandling="cooperative"
        disableDefaultUI
        zoomControl
      >
        <PanToActive activeIndex={activeIndex} />
        {colegios.map((s, i) => (
          <AdvancedMarker
            key={s.name}
            position={{ lat: s.lat, lng: s.lng }}
            title={s.name}
            anchorLeft="-50%"
            anchorTop="-50%"
            zIndex={activeIndex === i ? 1000 : undefined}
            onClick={() => onMarkerClick(i)}
          >
            <div className={`cpt-marker${activeIndex === i ? " is-active" : ""}`} style={{ position: "relative", width: 48, height: 48 }}>
              <span className="halo" />
              <span className="dot" />
            </div>
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}

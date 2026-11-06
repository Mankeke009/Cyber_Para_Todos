import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Colegio } from "@/content/colegios";

/**
 * Álbum de fotos de la visita. Hoy no se usa (ningún colegio tiene `photos`
 * cargadas), pero queda listo: en cuanto se agregue el arreglo `photos` a un
 * colegio en `colegios.ts`, este carrusel aparece solo dentro de su tarjeta.
 */
export default function SchoolPhotoBook({ photos }: { photos: NonNullable<Colegio["photos"]> }) {
  const [i, setI] = useState(0);
  if (photos.length === 0) return null;

  const prev = () => setI((n) => (n - 1 + photos.length) % photos.length);
  const next = () => setI((n) => (n + 1) % photos.length);

  return (
    <div className="mt-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-ui border border-line/20 bg-glass/[0.08]">
        <img key={photos[i].src} src={photos[i].src} alt={photos[i].alt} className="h-full w-full object-cover" />
        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Foto anterior"
              className="absolute left-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
            >
              <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              onClick={next}
              aria-label="Foto siguiente"
              className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
            >
              <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
            </button>
            <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
              {photos.map((_, p) => (
                <span key={p} className={`h-1.5 w-1.5 rounded-full ${p === i ? "bg-white" : "bg-white/40"}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

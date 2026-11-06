import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { temas } from "@/content/temas";

/**
 * Vistazo rápido de temas en el hero. Hoy muestra el ícono de línea de cada
 * tema; cuando haya imágenes reales (`tema.image`), reemplaza el bloque del
 * ícono por un <img> — la idea a futuro es que el cambio de tema anime la
 * imagen (un cross-fade o un pequeño "recargo"), por ahora es un fundido simple.
 */
export default function HeroTopicPreview() {
  const [index, setIndex] = useState(0);
  const current = temas[index];
  const Icon = current.icon;

  return (
    <div
      role="region"
      aria-label="Vistazo rápido de los temas"
      className="overflow-hidden rounded-panel border border-white/25 bg-white/10 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-6 pt-5">
        <span className="text-caption uppercase text-white/70">Vistazo rápido</span>
        <a href="#temas" className="inline-flex items-center gap-1 text-sm text-white/90 transition hover:text-white">
          Ver todos <ArrowRight size={13} strokeWidth={1.5} aria-hidden="true" />
        </a>
      </div>

      <div key={current.title} className="flex h-52 items-center justify-center px-6 pb-2 pt-6 animate-fade-up">
        {current.image ? (
          <img
            src={current.image}
            alt={current.imageAlt ?? `Ilustración: ${current.title}`}
            className="h-full w-full rounded-card object-cover"
          />
        ) : (
          <Icon size={72} strokeWidth={1.1} aria-hidden="true" />
        )}
      </div>
      <p className="animate-fade-up px-6 pb-5 text-center font-geist text-lg font-medium">{current.title}</p>

      <div
        role="group"
        aria-label="Elegir tema para previsualizar"
        className="flex gap-2 overflow-x-auto border-t border-white/15 px-4 py-3"
      >
        {temas.map((t, i) => (
          <button
            key={t.title}
            onClick={() => setIndex(i)}
            aria-pressed={i === index}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition ${
              i === index ? "bg-white text-[#161616]" : "border border-white/35 text-white/85 hover:bg-white/10"
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>
    </div>
  );
}

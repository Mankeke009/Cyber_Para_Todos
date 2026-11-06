import { useState } from "react";
import { Sparkles } from "lucide-react";
import { colegios } from "@/content/colegios";
import { temas } from "@/content/temas";

/** Gradient Hero Panel: único lugar con degradado de sección completa. */
export default function Hero() {
  const [index, setIndex] = useState(0);
  const current = temas[index];
  const Icon = current.icon;

  return (
    <section
      id="top"
      className="relative overflow-hidden px-6 pb-24 pt-36 text-center text-white"
      style={{ background: "linear-gradient(105deg,#B45A17 0%,#A8483A 32%,#5B3A9E 62%,#2A3FBF 100%)" }}
    >
      {/* Transición hacia el canvas */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-canvas" />

      <div className="relative mx-auto max-w-[820px]">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/15 px-3.5 py-1.5 text-sm font-medium">
          <Sparkles aria-hidden="true" size={14} strokeWidth={1.5} /> Programa de alfabetización digital
        </div>

        <h1 className="mx-auto mt-6 max-w-[22ch] font-medium text-display">
          Navegar seguro empieza en la sala de clases
        </h1>

        <div className="mt-8 flex justify-center gap-10">
          <div>
            <div className="font-geist text-[2.5rem] font-medium leading-none">{temas.length}</div>
            <div className="mt-2 text-sm text-white/85">temas para conversar</div>
          </div>
          <div>
            <div className="font-geist text-[2.5rem] font-medium leading-none">{colegios.length}</div>
            <div className="mt-2 text-sm text-white/85">colegios visitados</div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#temas" className="rounded-full bg-white px-5 py-2.5 text-[0.9375rem] text-[#161616] transition hover:bg-white/90">
            Ver los temas
          </a>
          <a href="#colegios" className="rounded-full border border-white/50 px-5 py-2.5 text-[0.9375rem] text-white transition hover:bg-white/10">
            Ver los colegios
          </a>
        </div>
      </div>

      {/* Imagen ancha: a futuro puede ser un gif por tema, por eso el recuadro grande */}
      <div className="relative mx-auto mt-14 max-w-[1200px]">
        <div
          key={current.title}
          role="region"
          aria-label="Vistazo rápido del tema seleccionado"
          className="relative flex h-64 items-center justify-center overflow-hidden rounded-panel border border-white/25 bg-white/10 backdrop-blur-sm animate-fade-up sm:h-80 md:h-[26rem]"
        >
          {current.image ? (
            <img
              src={current.image}
              alt={current.imageAlt ?? `Ilustración: ${current.title}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Icon size={96} strokeWidth={1} aria-hidden="true" />
          )}
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/30 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            {current.title}
          </span>
        </div>

        {/* Burbujas: los 10 temas, seleccionables */}
        <div role="group" aria-label="Elegir tema para previsualizar" className="mt-5 flex flex-wrap justify-center gap-2">
          {temas.map((t, i) => (
            <button
              key={t.title}
              onClick={() => setIndex(i)}
              aria-pressed={i === index}
              className={`rounded-full px-4 py-2 text-sm transition ${
                i === index ? "bg-white text-[#161616]" : "border border-white/35 text-white/85 hover:bg-white/10"
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

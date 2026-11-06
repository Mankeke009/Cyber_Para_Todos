import { ArrowUpRight } from "lucide-react";
import type { Tema } from "@/content/temas";

const pill =
  "inline-flex items-center gap-1.5 rounded-full border border-line/30 px-4 py-2 text-sm text-fg transition hover:bg-glass/10";

/** Link "Más información": el contexto y el aviso de pestaña nueva van ocultos para lectores de pantalla. */
export function MoreLink({ tema, className = "" }: { tema: Tema; className?: string }) {
  return (
    <a href={tema.link} target="_blank" rel="noopener noreferrer" className={`${pill} ${className}`}>
      Más información
      <span className="sr-only"> sobre {tema.title} (se abre en una pestaña nueva)</span>
      <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
    </a>
  );
}

/** Recuadro 16:10 listo para imagen; sin imagen muestra el ícono (decorativo). */
function Media({ tema, iconSize, rounded }: { tema: Tema; iconSize: number; rounded: string }) {
  const Icon = tema.icon;
  return (
    <div className={`aspect-[16/10] w-full overflow-hidden border border-line/20 bg-glass/[0.08] ${rounded}`}>
      {tema.image ? (
        <img
          src={tema.image}
          alt={tema.imageAlt ?? `Ilustración: ${tema.title}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Icon size={iconSize} strokeWidth={1.25} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

/** Imagen con el ejemplo como pie (<figure>/<figcaption>). Se muestra cuando un tema está abierto. */
export function TemaFigure({ tema, variant }: { tema: Tema; variant: "aside" | "inline" }) {
  const inline = variant === "inline";
  const caption = tema.example?.replace(/^Ejemplo:\s*/i, "");
  return (
    <figure
      className={
        inline
          ? "grid gap-4 rounded-card border border-line/15 bg-glass/[0.07] p-4 sm:grid-cols-[200px_1fr] sm:items-center sm:gap-5"
          : "rounded-panel border border-line/15 bg-glass/[0.07] p-6 backdrop-blur-sm"
      }
    >
      <Media tema={tema} iconSize={inline ? 40 : 52} rounded={inline ? "rounded-ui" : "rounded-card"} />
      {caption && (
        <figcaption className={`text-[0.9375rem] text-fg2 ${inline ? "" : "mt-4"}`}>
          <span className="mb-1 block text-caption uppercase text-fg">Ejemplo</span>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/** Tarjeta resumen: solo cuando no hay ningún tema abierto (escritorio). */
export function TemaCard({ tema }: { tema: Tema }) {
  return (
    <div className="rounded-panel border border-line/15 bg-glass/[0.07] p-8 backdrop-blur-sm">
      <Media tema={tema} iconSize={52} rounded="rounded-card" />
      <div className="mt-6 text-caption uppercase text-fg2">{tema.group}</div>
      <h3 className="mt-2 font-geist text-heading-sm font-medium">{tema.title}</h3>
      <div className="mt-5 rounded-card border border-line/15 p-5">
        <div className="mb-1.5 text-caption uppercase text-fg">Recuerda</div>
        <p className="text-[0.9375rem] text-fg2">{tema.tips[0]}</p>
      </div>
      <MoreLink tema={tema} className="mt-6" />
    </div>
  );
}

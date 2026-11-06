import { useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { colegios } from "@/content/colegios";
import { prefersReducedMotion } from "@/lib/mapConfig";

type Props = { activeIndex: number | null; onSelect: (index: number) => void };

export default function SchoolList({ activeIndex, onSelect }: Props) {
  const ref = useRef<HTMLUListElement>(null);

  // Sincronización mapa → lista: lleva la fila activa a la vista
  useEffect(() => {
    if (activeIndex === null) return;
    ref.current?.children[activeIndex]?.scrollIntoView({
      block: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [activeIndex]);

  return (
    <div className="pb-10">
      <div className="font-geist text-[3rem] font-medium leading-none">{colegios.length}</div>
      <div className="mb-6 mt-2 text-fg2">colegios visitados este año</div>

      <ul ref={ref} aria-label="Colegios visitados" className="max-h-[26.25rem] space-y-1 overflow-y-auto pr-1">
        {colegios.map((s, i) => (
          <li key={s.name}>
            <button
              onClick={() => onSelect(i)}
              aria-pressed={activeIndex === i}
              className={`flex w-full items-center justify-between gap-4 rounded-card border px-4 py-3.5 text-left transition ${
                activeIndex === i ? "border-line/25 bg-glass/[0.1]" : "border-transparent hover:bg-glass/[0.06]"
              }`}
            >
              <span>
                <span className={`block text-base ${activeIndex === i ? "text-fg" : "text-fg/90"}`}>{s.name}</span>
                <span className="block text-sm text-fg2">{s.place}</span>
              </span>
              <ChevronRight
                aria-hidden="true"
                size={18}
                strokeWidth={1.5}
                className={`shrink-0 transition ${activeIndex === i ? "translate-x-0.5 text-fg" : "text-fg2"}`}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Settings2, Minus, Plus, RotateCcw } from "lucide-react";

const MIN = 0.5;
const MAX = 2;
const STEP = 0.25;
const DEFAULT_SCALE = 1;

const clamp = (n: number) => Math.min(MAX, Math.max(MIN, n));

/**
 * Escala el tamaño de letra de toda la página cambiando el font-size de <html>.
 * Como los tamaños del sitio están en rem, todo escala junto (títulos, texto,
 * badges, botones). A futuro: acá se agregaría el selector de tipografía.
 */
export default function AccessibilityMenu() {
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = Number(localStorage.getItem("cpt-font-scale"));
    if (saved && saved >= MIN && saved <= MAX) setScale(saved);
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * scale}px`;
    try {
      localStorage.setItem("cpt-font-scale", String(scale));
    } catch {
      /* sin almacenamiento disponible */
    }
  }, [scale]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Opciones de accesibilidad"
        title="Accesibilidad"
        className="flex h-9 min-h-[36px] w-9 min-w-[36px] items-center justify-center rounded-full border border-line/30 text-fg/85 transition hover:bg-glass/10"
      >
        <Settings2 size={17} strokeWidth={1.5} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Opciones de accesibilidad"
          className="absolute left-0 top-full z-10 mt-2 w-max max-w-[calc(100vw-3rem)] rounded-card border border-line/20 bg-surface p-3.5 text-fg"
        >
          <div className="mb-2 text-caption uppercase text-fg2">Tamaño de letra</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale((s) => clamp(Number((s - STEP).toFixed(3))))}
              disabled={scale <= MIN}
              aria-label="Disminuir tamaño de letra"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line/25 transition hover:bg-glass/10 disabled:opacity-40"
            >
              <Minus size={14} strokeWidth={1.5} aria-hidden="true" />
            </button>
            <span className="w-12 text-center text-sm tabular-nums">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale((s) => clamp(Number((s + STEP).toFixed(3))))}
              disabled={scale >= MAX}
              aria-label="Aumentar tamaño de letra"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line/25 transition hover:bg-glass/10 disabled:opacity-40"
            >
              <Plus size={14} strokeWidth={1.5} aria-hidden="true" />
            </button>
            <button
              onClick={() => setScale(DEFAULT_SCALE)}
              aria-label="Restablecer tamaño de letra"
              title="Restablecer"
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border border-line/25 text-fg2 transition hover:bg-glass/10 hover:text-fg"
            >
              <RotateCcw size={13} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
          <p className="mt-3 max-w-[16rem] text-[0.8125rem] text-fg2">De 50% a 125%.</p>
        </div>
      )}
    </div>
  );
}

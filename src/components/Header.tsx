import { useEffect, useState } from "react";
import { Shield, PanelLeftOpen, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import AccessibilityMenu from "./AccessibilityMenu";
import { useActiveSection } from "@/lib/useActiveSection";

type Props = { dark: boolean; onToggleTheme: () => void };

const ghost =
  "hidden rounded-full border border-line/30 px-3.5 py-1.5 text-sm text-fg/85 transition hover:bg-glass/10 sm:block";

function Brand({ big }: { big: boolean }) {
  return (
    <a href="#top" className="flex shrink-0 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cta text-cta-fg">
        <Shield aria-hidden="true" size={16} strokeWidth={1.75} />
      </span>
      <span
        className={`font-medium tracking-tight transition-[font-size] ${big ? "text-xl sm:text-2xl md:text-[1.75rem]" : "text-lg sm:text-xl"
          }`}
      >
        CiberParaTodos
      </span>
    </a>
  );
}

/** El banner completo: igual en el hero y cuando se "expande" desde la barra lateral. */
function TopNav({ dark, onToggleTheme, big, onCollapse }: Props & { big: boolean; onCollapse?: () => void }) {
  return (
    <nav
      aria-label="Principal"
      className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-nav border border-line/20 bg-surface/80 px-3.5 py-2.5 backdrop-blur-sm"
    >
      <div className="flex flex-1 basis-[10rem] flex-wrap items-center gap-2">
        <ThemeToggle dark={dark} onToggle={onToggleTheme} />
        <AccessibilityMenu />
        <a href="#temas" className={ghost}>Temas</a>
        <a href="#colegios" className={ghost}>Colegios</a>
      </div>

      <Brand big={big} />

      <div className="flex flex-1 basis-[6rem] items-center justify-end gap-2">
        {onCollapse && (
          <button
            onClick={onCollapse}
            aria-label="Ocultar el menú y volver a la barra lateral"
            title="Ocultar menú"
            className="flex h-9 min-h-[36px] w-9 min-w-[36px] items-center justify-center rounded-full border border-line/30 text-fg/85 transition hover:bg-glass/10"
          >
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        )}
        {/* Escudo de la universidad. Si más adelante usan el lockup ancho, va mejor en el footer (ver Footer.tsx). */}
        <img
          src="/public/escudoU.png"
          alt="Escudo de la Pontificia Universidad Católica de Valparaíso"
          className="h-11 w-11 shrink-0 rounded-full bg-white object-contain p-0.5"
        />
      </div>
    </nav>
  );
}

/**
 * Header con dos formas:
 * - En el hero (o si el usuario la "expande"): el banner flotante de siempre.
 * - Al bajar a Temas o Colegios (solo en escritorio): se reduce a una barra
 *   lateral con el toggle de tema como acceso rápido y un botón para volver
 *   a mostrar el banner.
 * En móvil el banner queda siempre arriba, para no restarle ancho a la pantalla.
 */
export default function Header({ dark, onToggleTheme }: Props) {
  const section = useActiveSection();
  const [expanded, setExpanded] = useState(false);

  // Al volver al hero, la barra lateral no tiene sentido: se resetea.
  useEffect(() => {
    if (section === "top") setExpanded(false);
  }, [section]);

  const showTop = section === "top" || expanded;

  return (
    <>
      {/* Móvil: el banner siempre está arriba */}
      <div className="fixed inset-x-4 top-4 z-[2000] sm:hidden">
        <TopNav dark={dark} onToggleTheme={onToggleTheme} big={section === "top"} />
      </div>

      {/* Escritorio */}
      {showTop ? (
        <div className="fixed inset-x-4 top-4 z-[2000] hidden animate-fade-up sm:block">
          <TopNav
            dark={dark}
            onToggleTheme={onToggleTheme}
            big={section === "top"}
            onCollapse={section !== "top" ? () => setExpanded(false) : undefined}
          />
        </div>
      ) : (
        <div className="fixed left-4 top-1/2 z-[2000] hidden -translate-y-1/2 animate-fade-up flex-col gap-2 rounded-full border border-line/20 bg-surface/80 p-2 backdrop-blur-sm sm:flex">
          <ThemeToggle dark={dark} onToggle={onToggleTheme} />
          <AccessibilityMenu />
          <button
            onClick={() => setExpanded(true)}
            aria-label="Mostrar el menú principal"
            title="Mostrar menú"
            className="flex h-9 min-h-[36px] w-9 min-w-[36px] items-center justify-center rounded-full border border-line/30 text-fg/85 transition hover:bg-glass/10"
          >
            <PanelLeftOpen size={17} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
}

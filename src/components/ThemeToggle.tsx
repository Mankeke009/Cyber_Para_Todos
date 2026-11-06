import { Sun, Moon } from "lucide-react";

type Props = { dark: boolean; onToggle: () => void };

export default function ThemeToggle({ dark, onToggle }: Props) {
  const label = dark ? "Cambiar a tema claro" : "Cambiar a tema oscuro";
  return (
    <button
      onClick={onToggle}
      aria-label={label}
      title={label}
      className="flex h-9 min-h-[36px] w-9 min-w-[36px] items-center justify-center rounded-full border border-line/30 text-fg/85 transition hover:bg-glass/10"
    >
      {dark ? <Moon size={17} strokeWidth={1.5} aria-hidden="true" /> : <Sun size={17} strokeWidth={1.5} aria-hidden="true" />}
    </button>
  );
}

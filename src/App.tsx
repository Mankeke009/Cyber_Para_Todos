import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TemasSection from "@/components/TemasSection";
import SchoolsSection from "@/components/SchoolsSection";
import Footer from "@/components/Footer";
import DriveAccount from "@/components/DriveAccount";
import { DriveProvider } from "@/lib/drive";

export default function App() {
  // Oscuro por defecto (DESIGN.md); la variante clara se activa con la clase `light`.
  const [dark, setDark] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("cpt-theme") === "light") setDark(false);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", !dark);
  }, [dark]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("cpt-theme", next ? "dark" : "light");
  };

  return (
    <DriveProvider><div>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[3000] focus:rounded-full focus:bg-cta focus:px-4 focus:py-2 focus:text-cta-fg"
      >
        Saltar al contenido
      </a>
      <Header dark={dark} onToggleTheme={toggleTheme} />
      <main id="contenido" tabIndex={-1} className="focus:outline-none">
        <Hero />
        <DriveAccount />
        <TemasSection />
        <SchoolsSection dark={dark} />
      </main>
      <Footer />
    </div></DriveProvider>
  );
}

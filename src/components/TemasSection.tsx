import { useState } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { temas } from "@/content/temas";
import SectionHeader from "./SectionHeader";
import { MoreLink, TemaCard, TemaFigure } from "./TemaPreview";
import { MaterialBrowser } from './DriveMaterials';
import { driveButton } from '@/lib/drive';

export default function TemasSection() {
  const [open, setOpen] = useState("");
  const [materialTitle, setMaterialTitle] = useState<string | null>(null);
  const [selected, setSelected] = useState(temas[0].title);
  const groups = Array.from(new Set(temas.map((t) => t.group)));
  const current = temas.find((t) => t.title === selected)!;
  const openTema = temas.find((t) => t.title === open); // undefined si no hay ninguno abierto

  return (
    <section id="temas" aria-labelledby="temas-titulo" className="mx-auto max-w-[1200px] px-6 py-20">
      <SectionHeader
        id="temas-titulo"
        title="Temas para conversar con los estudiantes"
        text="Haz clic en un tema para ver sus materiales como una presentación. Usa la flecha para desplegar su explicación y consejos."
      />

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px]">
        <Accordion.Root
          type="single"
          collapsible
          value={open}
          onValueChange={(v) => { setOpen(v); if (v) setSelected(v); }}
        >
          {groups.map((group, gi) => (
            <div key={group} role="group" aria-labelledby={`grupo-${gi}`} className="mb-10 last:mb-0">
              <h3 id={`grupo-${gi}`} className="mb-3 font-geist text-xl font-medium text-fg sm:text-2xl">{group}</h3>
              {temas.map((tema) =>
                tema.group !== group ? null : (
                  <Accordion.Item key={tema.title} value={tema.title}>
                    <Accordion.Header className="flex items-center justify-between gap-4">
                      <button onClick={() => { setSelected(tema.title); setMaterialTitle(tema.title); }} aria-haspopup="dialog" className="flex-1 py-3.5 text-left text-[1.125rem] text-fg2 transition hover:text-fg">
                          {tema.title}
                      </button>
                      <Accordion.Trigger aria-label={`Mostrar explicación y consejos de ${tema.title}`} className="group rounded-full p-3">
                        <ChevronDown aria-hidden="true" size={20} strokeWidth={1.5} className="shrink-0 text-fg2 transition-transform duration-200 group-hover:text-fg group-data-[state=open]:rotate-180 group-data-[state=open]:text-fg" />
                      </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content className="overflow-hidden data-[state=closed]:animate-acc-up data-[state=open]:animate-acc-down">
                      <div className="max-w-[62ch] pb-6 text-fg2 lg:pr-10">
                        <p>{tema.body}</p>
                        <ul className="mt-4 list-disc space-y-1.5 pl-5">
                          {tema.tips.map((tip) => <li key={tip}>{tip}</li>)}
                        </ul>

                        {/* Móvil y tablet: imagen con el ejemplo como pie, debajo de la info */}
                        <div className="mt-5 lg:hidden">
                          <TemaFigure tema={tema} variant="inline" />
                        </div>

                        {/* Donde antes estaba el ejemplo */}
                        <MoreLink tema={tema} className="mt-5" />
                        <div><button className={`${driveButton} mt-4`} onClick={() => setMaterialTitle(tema.title)}>Consultar materiales de {tema.title}</button></div>
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>
                )
              )}
            </div>
          ))}
        </Accordion.Root>

        {/* Escritorio: con un tema abierto → imagen + ejemplo como pie; sin ninguno abierto → tarjeta resumen */}
        <aside className="hidden lg:block" aria-label="Resumen del tema">
          <div key={openTema ? `fig-${openTema.title}` : `card-${current.title}`} className="sticky top-28 animate-fade-up">
            {openTema ? <TemaFigure tema={openTema} variant="aside" /> : <TemaCard tema={current} />}
          </div>
        </aside>
      </div>
      {materialTitle && <MaterialBrowser title={materialTitle} onClose={() => setMaterialTitle(null)} />}
    </section>
  );
}

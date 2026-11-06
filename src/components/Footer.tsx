import { Mail, MessageCircle, Phone, Instagram } from "lucide-react";

// TODO: reemplaza estos datos por los reales de CiberEduca / la oficina a cargo.
const contacts = [
  { icon: Mail, label: "Correo", value: "contacto@ciberparatodos.cl", href: "mailto:contacto@ciberparatodos.cl" },
  { icon: MessageCircle, label: "WhatsApp", value: "+56 9 0000 0000", href: "https://wa.me/56900000000" },
  { icon: Phone, label: "Oficina (profesor a cargo)", value: "+56 9 0000 0000", href: "tel:+56900000000" },
  { icon: Instagram, label: "Instagram", value: "@ciberparatodos", href: "https://instagram.com/ciberparatodos" },
];

export default function Footer() {
  return (
    <footer className="border-t border-line/15 bg-canvas px-6 pb-8 pt-16">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="font-geist text-heading font-medium">¿Necesitas ayuda o quieres coordinar una visita?</h2>
        <p className="mt-3 max-w-[52ch] text-fg2">Escríbenos por cualquiera de estos canales y te respondemos a la brevedad.</p>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {contacts.map(({ icon: Icon, label, value, href }) => {
            const external = href.startsWith("http");
            return (
              <li key={label}>
                <a
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex items-center gap-3.5 rounded-card border border-line/15 bg-glass/[0.07] p-4 transition hover:bg-glass/[0.12]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ui border border-line/20">
                    <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-caption uppercase text-fg2">{label}</span>
                    <span className="block truncate text-[0.9375rem]">{value}</span>
                    {external && <span className="sr-only">(se abre en una pestaña nueva)</span>}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>

        {/* TODO: reemplazar por el texto real de presentación de CiberEduca */}
        <div className="mt-10 rounded-card border border-dashed border-line/25 p-5 text-[0.9375rem] text-fg2">
          <div className="mb-1 text-caption uppercase text-fg">Sobre CiberEduca</div>
          Escribe aquí una o dos oraciones sobre el programa CiberEduca: qué es, quién lo impulsa
          y cómo se relaciona con CiberParaTodos. (Este bloque es un marcador de posición.)
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-6 border-t border-line/10 pt-8 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 text-caption uppercase text-fg2">Un proyecto de</div>
            <img
              src="/logoU.png"
              alt="Escuela de Ingeniería Informática — Pontificia Universidad Católica de Valparaíso"
              className="brand-logo-invert h-9 w-auto"
            />
          </div>
          <div className="text-caption text-fg2">Prototipo — CiberParaTodos. Datos de ejemplo, no oficiales.</div>
        </div>
      </div>
    </footer>
  );
}

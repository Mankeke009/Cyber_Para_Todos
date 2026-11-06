# CiberParaTodos

La integración actual de Google Drive, roles y ejecución del backend está documentada en [DRIVE_SETUP.md](DRIVE_SETUP.md). Usa dos terminales: `npm.cmd run server` y `npm.cmd run dev`. Las subcarpetas ya están asociadas en la configuración local; la conexión de la aplicación con Google requiere completar credenciales. Los permisos se guardan en SQLite.

Sitio de divulgación sobre ciberseguridad, con diez tematicas  y un registro visual de colegios visitados en los cuales se fue a presentar.

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Build / dev server | Vite + `@vitejs/plugin-react` | 8.x |
| UI | React (StrictMode) + TypeScript| 18.3 / 5.5 |
| Estilos | Tailwind CSS v4 | 4.3 |
| Utilidades de clases | `clsx` + `tailwind-merge` (`cn()` en `src/lib/utils.ts`) | 2.x |
| Mapa principal | `react-leaflet` + `leaflet` (tiles CARTO con clave gratuita, o respaldo OpenStreetMap) | 4.2 / 1.9 |
| Mapa alternativo | `@vis.gl/react-google-maps` (se carga solo si se elige esa pestaña) | 1.10 |
| Íconos | `lucide-react` (`strokeWidth={1.5}`) | 0.383 |
| Tipografías | DM Sans + Geist (Google Fonts) | – |

- Sin backend ni router: es un sitio estático de una sola página. Los datos están en `src/content/`.
- Diseño basado en `DESIGN.md`. Sin tests automáticos ni ESLint configurado todavía (ver *Por revisar*).
- Hosting previsto: servidor propio (IP anual), no Vercel/Netlify (ver *Plan de datos y deploy*).


## Cómo ejecutar

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

Para compilar la versión de producción:

```bash
npm run build
npm run preview
```

## Estructura

```
src/
  content/
    temas.ts            ← las 10 temáticas (texto, ícono, imagen, link "más información")
    colegios.ts         ← colegios visitados (nombre, lugar, lat/lng, portada y fotos opcionales)
  components/
    Header.tsx          ← nav flotante en el hero; barra lateral al bajar (solo escritorio)
    Hero.tsx            ← hero con degradado, cifras y vistazo rápido por tema
    TemasSection.tsx    ← acordeón por grupos + panel derecho fijo
    TemaPreview.tsx     ← imagen/ejemplo (TemaFigure), tarjeta resumen (TemaCard), MoreLink
    SchoolsSection.tsx  ← lista + mapa en marco tipo mockup + tarjeta de detalle
    SchoolList.tsx / LeafletMap.tsx / GoogleMapView.tsx
    SchoolAlbum.tsx     ← portada, tira de miniaturas y lightbox del álbum
    AccessibilityMenu.tsx / ThemeToggle.tsx / SectionHeader.tsx / Footer.tsx
    HeroTopicPreview.tsx, SchoolPhotoBook.tsx  ← sin uso (código muerto, ver *Por revisar*)
  lib/                  ← mapConfig, useActiveSection, utils
  App.tsx               ← arma todo y maneja el tema claro/oscuro
.claude/skills/         ← skills del proyecto para Claude Code
```
## Mapas: proveedores y claves

El marco del mapa tiene un selector **Leaflet | Google Maps**. Ambos comparten lista, marcadores y tarjeta de detalle.
Copia `.env.example` a `.env`y completa con las claves que vayas a utilizar:

| Variable | Para qué | Sin ella |
|---|---|---|
| `VITE_CARTO_KEY` | Clave gratuita de tiles CARTO | Leaflet usa tiles públicos de OpenStreetMap (modo oscuro simulado con filtro CSS) |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API | La pestaña Google muestra instrucciones y no carga nada de Google |
| `VITE_GOOGLE_MAP_ID` | Map ID propio (opcional) | Usa `DEMO_MAP_ID` |

## Accesibilidad

Hecho: foco visible en todo control, enlace "Saltar al contenido", landmarks (`header`, `nav`, `main`, `footer`),
acordeón con Radix (teclado + `aria-expanded`), lista de colegios con `aria-pressed`, marcadores del mapa con nombre
accesible (Tab + Enter), anuncio de la selección para lectores de pantalla, `Esc` cierra el detalle,
`prefers-reduced-motion` respetado (CSS y desplazamientos del mapa), tamaños de texto en `rem`, íconos decorativos
con `aria-hidden`.

Pendiente: probar con un lector de pantalla real (NVDA o VoiceOver), zoom al 200 o 150 %, navegación solo con teclado,
y escribir `imageAlt` en `temas.ts` cuando se agreguen imágenes. El mapa es visual: la lista de colegios es su
equivalente en texto.

## Diseño

`DESIGN.md` es la referencia visual. Tokens en `src/index.css` (variables CSS, oscuro por defecto,
clase `light` en `<html>` para la variante clara) y `tailwind.config.js`.

## Cosas para personalizar

- **Logo de la universidad**: el escudo está en el `Header` (`public/escudoU.png`) y el logo ancho en el `Footer` (`public/logoU.png`).
- **Imágenes de cada temática**: la tarjeta (`TemaPreview.tsx`) ya tiene un recuadro 16:10 que muestra
  `tema.image` si existe (ej. `image: "/temas/ciberacoso.jpg"`, con el archivo en `public/temas/`) y, si no,
  el ícono. En escritorio es el panel fijo de la derecha; en móvil y tablet aparece dentro del desplegable.
- **Links "Más información"**: apuntan a `"#"`. Actualiza el campo `link`
  de cada tema en `temas.ts`.

Evaluar usar imagenes .webp

## Por revisar (posibles bugs, datos faltantes)

**Rompen algo**
- [ ] El escudo de la universidad da 404 en producción: `Header.tsx` usa `src="/public/escudoU.png"`; debe ser `/escudoU.png`.
- [ ] `npm run lint` falla: no hay ESLint instalado ni configurado (instalarlo o quitar el script).
- [ ] Los 10 temas tienen `imageAlt: "Descripción real de lo que muestra la imagen"` (texto de relleno de momento hasta definir las imagenes definitas para cada tema).
- [ ] Los enlaces "Más información" apuntan a `#` con `target="_blank"` (abren el mismo sitio en otra pestaña).

**Contenido y datos**
- [ ] Footer con datos inventados (`+56 9 0000 0000`, correo, Instagram) y bloque "Sobre CiberEduca" vacío.
- [ ] Colegios y cifras del hero son datos de ejemplo (5 colegios, ninguno con fotos). "colegios visitados este año" está fijo en `SchoolList`.
- [ ] Los temas sensibles no indican dónde pedir ayuda en Chile (p. ej. Línea Libre 1515, PDI Cibercrimen, Superintendencia de Educación). Verificar vigencia antes de publicar.
- [ ] La imagen de "Sexting" muestra una espalda con sostén: reemplazar por algo neutro para un sitio escolar.
- [ ] Las imágenes de `public/temas/` parecen de terceros: confirmar licencia y atribución.
- [ ] Imágenes con proporciones y resoluciones dispares (544×244 a 1000×700) y márgenes blancos (grooming, oversharing); el hero (`object-cover`, ~1200×416) recorta mucho las 4:3. Unificar proporción.
- [ ] **Privacidad de las fotos de colegios** (menores de edad): definir consentimiento, rostros difuminados o fotos sin estudiantes antes de publicarlas.

**Código**
- [ ] `AccessibilityMenu` se monta dos veces (móvil y escritorio) con estado propio y un efecto que escribe `1` en localStorage antes de leer el valor guardado. De momento funciona por el orden de efecto,  subir el estado a `App` o a un hook compartido.
- [ ] El texto dice "De 50% a 125%", pero `MAX = 2` (200%). Además usa `role="menu"` sin `menuitem`.
- [ ] Código muerto: `HeroTopicPreview.tsx` y `SchoolPhotoBook.tsx` no se importan en ningún lado; `postcss` quedó sin uso.
- [ ] `tsconfig.tsbuildinfo` está versionado (agregar al `.gitignore` y quitarlo del repo). `CLAUDE.md` tiene cambios de fin de línea (CRLF) sin commitear y dice "Tailwind v4b".
- [ ] Contraste del `text-white/85` sobre el tramo ámbar del degradado del hero: medir.
- [ ] Leaflet tiene `scrollWheelZoom={false}`: es intencional, pero no hay aviso al usuario.
- [ ] Pendiente manual de accesibilidad: lector de pantalla real (NVDA/VoiceOver), zoom 200 %, solo teclado.

## Por implementar

La integraci?n de Drive y los roles ya est?n implementados: consulta `DRIVE_SETUP.md` para activarlos. El plan de Sheets/CSV que sigue es una propuesta anterior y no forma parte de esta integraci?n.

- [ ] **Colegios desde Google Sheets (CSV)** y **fotos desde Google Drive**, una carpeta por colegio (ver *Plan de datos y deploy*).
- [ ] Definir el esquema de la hoja y la convención de carpetas/nombres de archivo de las fotos.
- [ ] Script o capa de carga que reemplace `colegios.ts` por los datos de la hoja, con validación (lat/lng numéricos, nombres duplicados, fotos faltantes) y estado de carga/error en la UI.
- [ ] Textos `alt` por foto (columna en la hoja o archivo de descripciones por carpeta).
- [ ] Links reales de "Más información" por tema, y datos reales del footer y de CiberEduca.
- [ ] Recursos de ayuda en Chile en los temas sensibles.
- [ ] Deploy en el servidor de la universidad: build, servidor web, HTTPS, dominio y actualización de datos.
- [ ] Tests mínimos (humo del build y de la carga de datos) y ESLint.
- [ ] Pruebas con usuarios reales (estudiantes/profesores) y con lector de pantalla.

## Plan de datos y deploy

**Decisión:** Evaluar que los datos de los colegios vengan  de **Google Sheets** (CSV) y las fotos de **Google Drive**.

**Flujo de trabajo del equipo**
1. Una hoja de Google Sheets con una fila por colegio. Columnas propuestas: `name`, `place`, `lat`, `lng`, `date`, `cover` (nombre de archivo de portada) y opcional `notes`.
2. Una carpeta de Drive por colegio (nombre igual a un `slug` de la hoja), con la portada y las fotos de la visita.
3. El equipo agrega filas y sube fotos sin tocar el código.

**Cómo conectarlo (opciones, por decidir)**

| Opción | Cómo funciona | Ventajas | Riesgos |
|---|---|---|---|
| **A. Sincronización en el servidor (recomendada)** | Un script Node (cron o al desplegar) lee la hoja y las carpetas con una *service account* de Google, descarga el CSV y las fotos a `public/colegios/<slug>/` y regenera `colegios.json`. | No expone claves en el navegador; sin límites ni bloqueos de Drive para los visitantes; fotos optimizables (redimensionar, WebP); el sitio sigue siendo estático y rápido. | Hay que escribir y mantener el script; los cambios aparecen en el próximo ciclo de sincronización. |
| **B. Directo desde el navegador** | La hoja se publica en la web como CSV (Archivo → Compartir → Publicar en la web) y el sitio la lee con `fetch`; las fotos se enlazan desde Drive. | Sin backend ni script; los cambios se ven al instante. | Los enlaces de Drive para `<img>` son poco confiables (cuotas, cambios de formato, bloqueos), las carpetas deben ser públicas y no hay optimización de imágenes. |

Con cualquiera de las dos, el sitio debe mostrar un estado de carga/error y conservar `colegios.ts` como respaldo mientras no haya datos reales.

**Seguridad y privacidad**
- Si se usa la opción A, la clave de la service account vive solo en el servidor (fuera del repo y de `public/`); nunca en el navegador.
- Las carpetas de Drive no deberían quedar públicas a toda internet si no es necesario; compartirlas solo con la service account.
- Las fotos son de menores de edad: acordar con los colegios qué se puede publicar (ver *Por revisar*).

**Deploy en el servidor propio**
- `npm run build` genera `dist/`, que se sirve con Nginx o Caddy (con `try_files` hacia `index.html` si se agregan rutas).
- HTTPS con certificado (p. ej. Let's Encrypt), dominio propio de la universidad y headers básicos de seguridad.
- Un cron (opción A) para sincronizar datos y fotos, y un procedimiento simple para redesplegar los cambios de código.
- Variables `VITE_*` se incrustan en el build: restringir la clave de Google Maps por *referrer* al dominio final.

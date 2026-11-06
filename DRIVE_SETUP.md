# Google Drive y roles en CiberParaTodos

## Estado de esta entrega

La aplicación conserva las secciones, los mapas, los estilos, el tema claro/oscuro y el diseño adaptable. El backend y la interfaz están implementados; **todavía no hay conexión autenticada de la aplicación con Drive real**. Mediante la conexión de Drive del chat se verificaron las tres carpetas y que ambas áreas estaban vacías; se crearon diez subcarpetas de temas y cinco de los colegios existentes y se verificaron sus IDs. No se cambiaron permisos de Drive ni se subieron archivos educativos o fotografías.

Las tres carpetas facilitadas ya están en `server/config.local.json` y en la plantilla `server/config.example.json`:

| Área | ID |
| --- | --- |
| Principal | `1tlQ_5zBrbWbrN8t2tSG23FykwDISdiJu` |
| Materiales | `1Un1qJSVxwSD4N3GrRhUyd2mhr-geWvaC` |
| Colegios | `1ZGJH_FYI2wDlC5dAuUctx4SOJYaDfHIB` |

Los dos correos que indicaste se guardaron como administradores iniciales en `.env`, que está ignorado. La plantilla no contiene correos ni secretos. El primer usuario que entra **no** obtiene privilegios especiales.

## 1. Ejecutar en Windows

Usa Node.js 24 o posterior (el equipo tiene Node 26). Abre dos terminales PowerShell en la carpeta del proyecto. Si acabas de instalar Node y VS Code no lo reconoce, cierra y vuelve a abrir VS Code.

```powershell
cd "C:\Users\Mankeke\Desktop\Ciber-para-todos-main"
npm.cmd install
```

Terminal 1, backend:

```powershell
npm.cmd run server
```

Terminal 2, frontend:

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

Abre la URL que indique Vite, normalmente <http://127.0.0.1:5173>. El frontend envía `/api` al backend de `127.0.0.1:3001`. `npm.cmd` evita depender de la política de scripts de PowerShell. No hace falta ejecutar las terminales como administrador. `Ctrl+C` detiene cada proceso.

Si `.env` no existe en otro equipo, copia `.env.example` a `.env`, completa `ADMIN_EMAILS` con los administradores y copia `server/config.example.json` a `server/config.local.json`. No sobrescribas un `.env` que ya tenga credenciales.

Los cambios en la correspondencia de carpetas requieren reiniciar el backend. La recarga de `.env` depende del comando utilizado, como se explica a continuación. Los cambios de archivos en Drive y de autorizaciones **no requieren recompilar ni reiniciar**.

Actualización del diagnóstico local: el backend y el asistente OAuth cargan siempre el `.env` situado en la raíz del proyecto, aunque se ejecuten desde otra carpeta. `npm.cmd run server` vigila `.env` y los módulos del servidor, sin vigilar SQLite, y reinicia al guardar nuevas credenciales. Con `npm.cmd start` reinicia manualmente. Vite usa `127.0.0.1:5173` con puerto estricto: si está ocupado informa un error, en lugar de abrir 5174. Cierra la instancia anterior antes de arrancar otra.

`GET /api/session` indica con `driveConfigured` únicamente si hay credenciales completas cargadas; **no prueba su validez ni el acceso**. `GET /api/drive/status` realiza una comprobación real de las tres carpetas principales y distingue `pending`, `connected`, `authentication_error`, `permission_denied`, `configuration_error` y `unavailable`. La página muestra el resultado de esa comprobación. Una carpeta de destino accesible pero vacía responde HTTP 200 con `files: []`; un fallo de acceso no se trata como una carpeta vacía. Los errores públicos nunca incluyen respuestas privadas ni credenciales de Google.

## 2. Configurar inicio de sesión con Google

1. En [Google Cloud Console](https://console.cloud.google.com/), crea o selecciona un proyecto para CiberParaTodos.
2. Habilita **Google Drive API** en APIs y servicios. Google Maps es independiente y sus variables actuales se conservan.
3. En **Google Auth Platform**, configura Branding, Audience y Data Access. Si usas modo de prueba externo, agrega las cuentas que deban probarlo. La universidad puede limitar qué aplicaciones pueden usar sus cuentas; en ese caso se necesita su administrador de Workspace.
4. Crea un cliente **OAuth 2.0 de aplicación web**.
5. En **Authorized JavaScript origins**, agrega `http://127.0.0.1:5173` y `http://localhost:5173`. Si usas otro puerto, agrega ese origen exacto.
6. Copia el ID a `GOOGLE_CLIENT_ID` en `.env`. El ID del cliente es público; el secreto y los tokens nunca deben llevar prefijo `VITE_`.
7. Conserva los dos administradores en `ADMIN_EMAILS`, separados por coma. Esta es la única forma de designar administradores; el panel administra alumnos.
8. Reinicia el backend y pulsa **Actualizar sesión** en la página. Ya debe aparecer el botón oficial de Google.

El navegador entrega al backend un ID token de Google; la librería oficial verifica firma, audiencia y caducidad. Además se comprueban nonce, correo verificado y autoridad de Google sobre Gmail/Workspace. Se usa `sub` para vincular la identidad; las cuentas de correo externo sin Workspace se rechazan. La universidad utiliza Workspace, pero debe confirmarse con un inicio de sesión real.

La sesión del sitio usa cookie HttpOnly/SameSite y CSRF ligado a sesión y origen. Caduca en ocho horas y se pierde al reiniciar el backend; las autorizaciones en SQLite permanecen.

## 3. Elegir el acceso del servidor a Drive

El inicio de sesión de alumnos **no** concede acceso a Drive ni solicita permisos para sus archivos personales. El acceso a las carpetas lo mantiene una identidad del servidor, independiente de quienes suben desde la página.

### Opción A: cuenta de servicio y unidad compartida de Workspace

Esta opción limita el alcance efectivo a lo compartido expresamente con la cuenta de servicio.

1. Comprueba que las carpetas existentes estén en una **unidad compartida** de Workspace. Una carpeta de “Mi unidad” compartida con alguien no equivale a una unidad compartida.
2. Crea una cuenta de servicio en el proyecto de Cloud. No habilites delegación de todo el dominio.
3. Comparte solo la carpeta del proyecto con esa cuenta y los permisos necesarios para leer y agregar archivos (la política de la unidad puede necesitar un rol superior o intervención de su administrador). No compartas el resto del Drive.
4. Si tu organización permite claves JSON, guárdala fuera de `public/` y `dist/`, preferiblemente fuera de la carpeta del proyecto. Configura su ruta absoluta en `GOOGLE_APPLICATION_CREDENTIALS`.
5. Deja `GOOGLE_REFRESH_TOKEN` y `GOOGLE_CLIENT_SECRET` vacíos. `GOOGLE_CLIENT_ID` sigue siendo necesario para el inicio de sesión.

Las cuentas de servicio no tienen cuota de almacenamiento ni pueden ser propietarias de archivos. Por ello, **no sirve usar esta opción para subir a “Mi unidad”** sin delegación. No se ha movido ninguna de tus carpetas: si actualmente están en “Mi unidad”, usa la opción B.

### Opción B: OAuth de una cuenta dedicada, compatible con Mi unidad

Recomendado usar una cuenta que solo tenga datos del proyecto; comparte con ella las carpetas existentes con permiso para agregar archivos. No se crean duplicados. Las subidas se realizan bajo esa cuenta, con su cuota.

1. En el cliente OAuth web del paso 2 agrega **Authorized redirect URI**: `http://127.0.0.1:3002/oauth/callback`.
2. Completa `GOOGLE_CLIENT_SECRET` en `.env`, y deja `GOOGLE_APPLICATION_CREDENTIALS` vacío.
3. Ejecuta desde la carpeta del proyecto:

```powershell
npm.cmd run google:authorize
```

4. Abre el enlace que imprime el asistente e inicia sesión con la cuenta dedicada que tenga acceso a las carpetas. Revisa y acepta personalmente el consentimiento si corresponde.
5. El asistente usa state y PKCE, recibe el código en un servidor local temporal y guarda el refresh token directamente en `.env`; no imprime tokens. Cierra al finalizar o después de diez minutos.
6. Reinicia el backend. No envíes claves, secretos ni tokens por el chat.

Se solicita `https://www.googleapis.com/auth/drive` porque deben leerse archivos que otras personas agreguen directamente desde Drive y también crear archivos. **Google no ofrece un scope OAuth de carpeta.** `drive.file` se limita a los archivos abiertos/seleccionados con la app y no garantiza descubrir todos los archivos de una carpeta agregados fuera de ella. Con la opción B, el scope es amplio para la identidad que autoriza; por eso conviene una cuenta dedicada. El servidor impone su propia restricción adicional de carpetas y no tiene rutas para explorar el resto de Drive.

En aplicaciones externas en modo Testing, los refresh tokens con permisos de Drive suelen caducar a los siete días. Para operación continua revisa el estado de publicación, la verificación de scopes restringidos y las políticas de tu organización. Eliminar el permiso de la aplicación en Google revoca su conexión.

## 4. Asociar subcarpetas existentes

Las 15 subcarpetas ya están creadas y asociadas por ID en `server/config.local.json`. Se conservaron Principal, Materiales y Colegios, sin duplicarlas. No se añadieron colegios al catálogo ni se alteraron sus coordenadas. La plantilla `server/config.example.json` mantiene los IDs de destino vacíos para facilitar otras instalaciones; usa la configuración local de este equipo para estas carpetas.

Si después sustituyes una subcarpeta, actualiza únicamente su `folderId`, conservando `key`, `kind` y las coordenadas existentes. No asocies carpetas con datos ajenos al proyecto.

Ejemplo de estructura (no usar el texto de ejemplo como ID):

```json
{
  "key": "material-phishing-y-mensajes-enganosos",
  "label": "Phishing y mensajes engañosos",
  "kind": "material",
  "folderId": "ID_REAL_DE_LA_SUBCARPETA"
}
```

Cada carpeta de tema debe ser hija directa de Materiales; cada carpeta de colegio, hija directa de Colegios; ambas áreas deben ser hijas directas de Principal. Se comprueba esta cadena en Drive en cada lectura y escritura. Se rechazan accesos a archivos ajenos, carpetas movidas fuera del proyecto, archivos eliminados y accesos directos. No se recorren subcarpetas anidadas; coloca los archivos publicados directamente en el destino correspondiente.

La aplicación no crea carpetas automáticamente ni deduce colegios o coordenadas. Enlazar una carpeta a un colegio **no** crea marcadores.

**Publicación:** todos los archivos válidos colocados directamente en los destinos configurados se ofrecen a los visitantes desde la página. Esto incluye las subidas de alumnos: no hay una cola adicional de aprobación editorial. No es necesario cambiar Drive a “cualquier persona con el enlace”; el backend sirve solo estos archivos. Para retirar uno, elimínalo o muévelo fuera de la carpeta configurada. La siguiente consulta ya no lo servirá.

## 5. Administrar alumnos

1. Inicia sesión con uno de los administradores configurados.
2. Abre **Administrar autorizaciones**.
3. Escribe el correo de Google del alumno. Elige todos los destinos del proyecto o destinos concretos y pulsa **Autorizar alumno**. Puede hacerse antes de su primera visita.
4. El listado muestra autorizado/revocado y si la identidad ya fue vinculada.
5. Usa **Revocar permiso**, **Reactivar permiso** y **Guardar destinos** según corresponda.

El permiso está en `server/data/access.sqlite`, no en localStorage. Se consulta en cada operación protegida y otra vez al terminar de recibir una subida. Revocar impide nuevas subidas con sesiones abiertas; una subida ya enviada a Google antes de revocar puede terminar. Una cuenta no autorizada conserva la consulta de contenido pero recibe 403 si intenta subir por API. Solo el administrador puede leer o modificar las autorizaciones. La autorización no cambia ningún permiso de Drive.

Los cambios funcionan desde cualquier dispositivo que acceda al **mismo backend**. Guarda la base de datos en un volumen persistente. Para respaldarla, detén el backend y copia `server/data/` completo. No despliegues cada instancia con una copia independiente de SQLite; esta entrega está preparada para una instancia de servidor. Reiniciar requiere volver a iniciar sesión, sin perder los permisos.

## 6. Materiales, fotos y actualización

### Visor de temas por páginas

Al pulsar el nombre de un tema se abre una única ventana amplia con sus materiales. La flecha a su derecha conserva el desplegable de explicación; la misma explicación y sus consejos también están disponibles dentro del visor. Se reutilizan los endpoints existentes del tema y los controles de subida conservan sus permisos.

Las imágenes se muestran completas y los PDF se dibujan con PDF.js, una página a la vez. Las presentaciones de Google utilizan la exportación a PDF existente. El visor ordena por nombre con orden numérico (por ejemplo 01, 02, 10) y desempata por ID; no altera el orden interno del documento. Al terminar sus páginas pasa al siguiente archivo compatible, y al terminar la secuencia vuelve al principio. Un selector permite abrir cualquier archivo manualmente. Anterior puede regresar a la última página del archivo previo.

El avance espera a que el contenido esté listo y cambia cada diez segundos. Anterior, siguiente o la selección de un archivo reinician el tiempo. Pausar/reanudar conserva la posición; el tiempo se suspende al ocultar la pestaña y no funciona si el usuario prefiere movimiento reducido. Las flechas del teclado y Espacio funcionan al enfocar el área del contenido; los campos, botones y videos conservan sus teclas propias. Los videos no avanzan con temporizador: usa sus controles y Siguiente para continuar.

Las consultas a Drive continúan cada minuto mientras la ventana permanece abierta. Se conserva el archivo y la página si siguen existiendo; si el documento se acorta se limita a su última página, y si se elimina el archivo se elige otro disponible. Al cerrar se cancelan las consultas, el temporizador, la carga y el renderizado del PDF, y se devuelve el foco al control que abrió la ventana. El contenido se ajusta completo al espacio disponible, sin recortar; el texto extraíble del PDF también se proporciona a lectores de pantalla.

No se encontró LibreOffice ni existe conversión de PowerPoint en el servidor. Los PPTX se identifican como descarga y quedan fuera del avance automático. Para verlos como diapositivas publica una copia PDF o Google Slides dentro de la misma carpeta de tema; no se simula su reproducción ni se envía el archivo a servicios de conversión externos.

PDF.js y su worker se sirven desde el propio sitio. `predev` y `prebuild` preparan automáticamente las fuentes, CMaps y WASM desde la dependencia instalada; no se necesitan claves nuevas ni CDN. Fuentes: [ejemplos oficiales](https://mozilla.github.io/pdf.js/examples/) y [API de PDF.js](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html).

Pruebas específicas: `npm.cmd run test:viewer`. Generan un PDF real de tres páginas, comprueban su dibujo y texto por página, y prueban navegación, pausa, temporizador, cambio de archivo, videos, movimiento reducido, actualización, cierre y limpieza. Los archivos de prueba se generan en memoria; no se suben a Drive ni aparecen como contenido público.

- Cada tema tiene **Consultar materiales**. El diálogo muestra nombre, tipo y miniatura cuando Google la ofrece. Las miniaturas privadas se consultan mediante el backend, sin exponer tokens ni sus enlaces temporales. Se puede navegar con teclado, cierra con el botón o Escape, mantiene el foco dentro y lo devuelve al botón que lo abrió.
- PDF, JPG, PNG, WEBP, GIF, MP4 y WEBM se muestran dentro del diálogo. PDF utiliza PDF.js; los códecs de video dependen del navegador. Siempre hay descarga alternativa para estos formatos.
- Google Slides, Docs, Sheets y Drawings se exportan como PDF de solo lectura en el servidor. No hay controles de edición; las animaciones de diapositivas no se conservan. Google limita el tamaño de las exportaciones a 10 MB; un archivo que exceda su límite debe publicarse como PDF desde Drive.
- PPTX/DOCX/XLSX y otros archivos binarios sin visor integrado ofrecen descarga. Para previsualizar una presentación PPTX dentro del sitio, agrega una versión PDF o conviértela en Google Slides desde Drive. No se envían documentos a visores de terceros ni se convierten en públicos.
- Las fotos de cada colegio reutilizan `SchoolAlbum`, con avance cada seis segundos, anterior/siguiente, pausa, pausa al enfocar o pasar el mouse y ampliación. Con `prefers-reduced-motion` el avance automático se desactiva.
- Al abrir la ventana de materiales o mostrar el álbum se consulta Drive; se repite cada 60 segundos mientras está visible. También al volver a la pestaña, recuperar el foco o terminar una subida. Se suspende al ocultar la pestaña. Las altas, modificaciones y bajas no necesitan recompilar.
- Hay estados de carga, carpeta vacía, conexión pendiente y error con reintento. Las respuestas de contenido no se almacenan en caché; cada descarga comprueba que el archivo siga perteneciendo al destino.

## 7. Límites de subida

| Uso | Formatos | Máximo por archivo |
| --- | --- | --- |
| Fotografías (materiales y colegios) | JPG, PNG, WEBP, GIF | 15 MB |
| Documentos (solo materiales) | PDF, PPTX, DOCX, XLSX | 30 MB |
| Videos (solo materiales) | MP4, WEBM | 100 MB |

Se envía un archivo por solicitud y se informa el resultado de cada archivo seleccionado. El progreso muestra el envío al backend; después espera la confirmación de Drive. Cerrar el diálogo cancela el envío en curso, pero un archivo que Google ya recibió puede permanecer en Drive. Ante un corte o timeout comprueba el destino antes de reintentar. El servidor inspecciona la firma/contenido y su coincidencia con la extensión, no confía en el MIME del navegador y elimina los archivos temporales. La validación de formato no sustituye un análisis antimalware.

## 8. Verificación y despliegue

```powershell
npm.cmd test
npm.cmd run build
```

Las pruebas usan dobles de Google/Drive y una base SQLite temporal: visitante, alumno, administrador, preautorización, destinos, revocación con sesión abierta, reactivación, CSRF, identidad rechazada, contenido/tamaño, persistencia y aislamiento de carpetas. No equivalen a una prueba con las cuentas y los archivos reales.

En producción, compila y ejecuta `npm.cmd start` con `NODE_ENV=production`, un origen HTTPS en `APP_ORIGINS` y los orígenes HTTPS autorizados en Google. Express sirve `dist/` y `/api` desde `127.0.0.1:3001`; coloca delante un proxy HTTPS (por ejemplo Caddy/Nginx). No uses Vite como servidor público. Ajusta el proxy para subidas de 100 MB y duración suficiente para enviarlas a Drive. La cookie usa Secure en producción. Protege `.env`, el JSON de la cuenta de servicio y SQLite con permisos del sistema para la cuenta del servidor. El servidor de desarrollo bloquea `/server`, `/secrets`, SQLite y archivos de entorno.

### Fuentes oficiales consultadas

- [Verificación de ID tokens e identidad Google](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- [Botón y nonce de Google Identity Services](https://developers.google.com/identity/gsi/web/reference/js-reference)
- [Scopes de Drive y alcance de drive.file](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)
- [Subida y creación de archivos](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/create)
- [Descarga, exportación y límites](https://developers.google.com/workspace/drive/api/guides/manage-downloads)
- [Unidades compartidas y cuentas de servicio sin cuota](https://developers.google.com/workspace/drive/api/guides/about-shareddrives)
- [OAuth web, acceso offline y refresh tokens](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Caducidad de tokens en Testing](https://developers.google.com/identity/protocols/oauth2)
- [SQLite integrado en Node](https://nodejs.org/api/sqlite.html)

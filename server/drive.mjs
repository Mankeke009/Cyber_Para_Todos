import { google } from 'googleapis';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';

export const folderMime = 'application/vnd.google-apps.folder';
export const exportable = new Set(['application/vnd.google-apps.presentation', 'application/vnd.google-apps.document', 'application/vnd.google-apps.spreadsheet', 'application/vnd.google-apps.drawing']);
export const imageMimes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
export function fail(status, message) { return Object.assign(new Error(message), { status, publicError: true }); }
export function driveError(error) {
  if (error.publicError) return { status: error.status, state: 'configuration_error', error: error.message };
  const status = Number(error.response?.status || error.code);
  if (status === 401 || error.response?.data?.error === 'invalid_grant') return { status: 401, state: 'authentication_error', error: 'La autorización de Google venció o fue revocada. Vuelve a autorizar la cuenta del servidor.' };
  if (status === 403 || status === 404) return { status: 403, state: 'permission_denied', error: 'La cuenta del servidor no puede acceder a esta carpeta. Revisa el ID, los permisos compartidos y que Drive API esté habilitada.' };
  if (status === 429) return { status: 429, state: 'unavailable', error: 'Google Drive alcanzó su límite de consultas. Espera y vuelve a intentarlo.' };
  return { status: 502, state: 'unavailable', error: 'No se pudo consultar Google Drive. Revisa la conexión y vuelve a intentarlo.' };
}
const validId = (id) => typeof id === 'string' && /^[\w-]+$/.test(id);

export function createDrive(config, env) {
  let auth;
  if (env.GOOGLE_APPLICATION_CREDENTIALS) {
    auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/drive'] });
  } else if (env.GOOGLE_REFRESH_TOKEN && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CLIENT_ID) {
    auth = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
    auth.setCredentials({ refresh_token: env.GOOGLE_REFRESH_TOKEN });
  }
  if (!auth) return null;
  return driveAdapter(google.drive({ version: 'v3', auth }), config, async url => {
    const access = await auth.getAccessToken();
    const bearer = typeof access === 'string' ? access : access?.token;
    if (!bearer) throw fail(503, 'No se pudo autenticar la miniatura.');
    const response = await fetch(url, { headers: { Authorization: `Bearer ${bearer}` }, redirect: 'error', signal: AbortSignal.timeout(20000) });
    const mime = response.headers.get('content-type')?.split(';')[0];
    if (!response.ok || !imageMimes.has(mime)) throw fail(404, 'Miniatura no disponible.');
    return { data: Readable.fromWeb(response.body), mime };
  });
}

export function driveAdapter(api, config, fetchThumbnail) {
  const metadata = async (id) => {
    if (!validId(id)) throw fail(404, 'Archivo o carpeta no disponible.');
    const { data } = await api.files.get({ fileId: id, supportsAllDrives: true,
      fields: 'id,name,mimeType,parents,trashed,size,modifiedTime,description,thumbnailLink,capabilities(canDownload)' });
    if (data.trashed) throw fail(404, 'El archivo o carpeta fue eliminado.');
    return data;
  };
  const childFolder = async (id, parent) => {
    const item = await metadata(id);
    if (item.mimeType !== folderMime || !item.parents?.includes(parent)) throw fail(403, 'La carpeta no pertenece al área configurada.');
    return item;
  };
  async function destination(key) {
    const d = config.destinations.find(d => d.key === key);
    if (!d?.folderId) throw fail(503, 'Todavía no se ha configurado la carpeta de este destino.');
    const root = await metadata(config.rootId);
    if (root.mimeType !== folderMime) throw fail(403, 'La carpeta principal no es válida.');
    const area = d.kind === 'material' ? config.materialsId : config.schoolsId;
    await childFolder(area, config.rootId);
    await childFolder(d.folderId, area);
    return d;
  }
  async function file(key, id) {
    const d = await destination(key);
    const f = await metadata(id);
    if (!f.parents?.includes(d.folderId) || f.mimeType === folderMime || f.mimeType === 'application/vnd.google-apps.shortcut') throw fail(404, 'Archivo fuera de la carpeta publicada.');
    if (d.kind === 'school' && !imageMimes.has(f.mimeType)) throw fail(404, 'Este archivo no es una fotografía publicada.');
    return f;
  }
  return {
    async check() {
      const root = await metadata(config.rootId);
      if (root.mimeType !== folderMime) throw fail(403, 'La carpeta principal no es válida.');
      await childFolder(config.materialsId, config.rootId);
      await childFolder(config.schoolsId, config.rootId);
    },
    destination, file,
    async list(key) {
      const d = await destination(key);
      const files = [];
      let pageToken;
      do {
        const { data } = await api.files.list({
          q: `'${d.folderId}' in parents and trashed = false`, supportsAllDrives: true,
          includeItemsFromAllDrives: true, pageSize: 100, pageToken, orderBy: 'name',
          fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,description,thumbnailLink)',
        });
        files.push(...(data.files || []).filter(f => f.mimeType !== folderMime && f.mimeType !== 'application/vnd.google-apps.shortcut' && (d.kind !== 'school' || imageMimes.has(f.mimeType))));
        pageToken = data.nextPageToken;
      } while (pageToken);
      return files;
    },
    async thumbnail(key, id) {
      const f = await file(key, id);
      if (!f.thumbnailLink) throw fail(404, 'Miniatura no disponible.');
      const url = new URL(f.thumbnailLink);
      if (url.protocol !== 'https:' || url.port || url.username || url.password || !/^(?:[a-z0-9-]+\.)*(?:googleusercontent\.com|google\.com)$/.test(url.hostname)) throw fail(404, 'Miniatura no válida.');
      return fetchThumbnail(url.href);
    },
    async content(key, id, range, download) {
      const f = await file(key, id);
      if (f.capabilities?.canDownload === false) throw fail(403, 'El propietario no permite descargar ni exportar este archivo.');
      const pdf = exportable.has(f.mimeType);
      const inline = pdf || f.mimeType === 'application/pdf' || imageMimes.has(f.mimeType) || ['video/mp4', 'video/webm'].includes(f.mimeType);
      if (!inline && !download) throw fail(415, 'Este formato requiere descargar el archivo.');
      const response = pdf
        ? await api.files.export({ fileId: id, mimeType: 'application/pdf' }, { responseType: 'stream' })
        : await api.files.get({ fileId: id, alt: 'media', supportsAllDrives: true }, { responseType: 'stream', headers: range ? { Range: range } : {} });
      return { response, mime: pdf ? 'application/pdf' : f.mimeType, name: f.name + (pdf ? '.pdf' : '') };
    },
    async upload(key, path, name, mime) {
      const d = await destination(key);
      const { data } = await api.files.create({ supportsAllDrives: true,
        requestBody: { name, parents: [d.folderId] }, media: { mimeType: mime, body: createReadStream(path) }, fields: 'id,name' });
      return data;
    },
  };
}

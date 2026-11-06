import express from 'express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { unlink } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { fileTypeFromFile } from 'file-type';
import { fail, imageMimes, exportable, driveError } from './drive.mjs';

const token = () => randomBytes(32).toString('hex');
const formats = new Map([
  ['pdf', 'application/pdf'], ['jpg', 'image/jpeg'], ['jpeg', 'image/jpeg'],
  ['png', 'image/png'], ['webp', 'image/webp'], ['gif', 'image/gif'],
  ['mp4', 'video/mp4'], ['webm', 'video/webm'],
  ['pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
]);
export const normalizeEmail = e => typeof e === 'string' ? e.trim().toLowerCase() : '';
export function roleFor(user, admins, store) {
  if (!user) return { role: 'visitor', destinations: [] };
  if (admins.includes(user.email)) return { role: 'admin', destinations: ['*'] };
  const grant = store.get(user.email);
  if (grant?.active && (!grant.subject || grant.subject === user.sub)) {
    if (!grant.subject) store.bind(user.email, user.sub);
    return { role: 'student', destinations: grant.destinations };
  }
  return { role: 'visitor', destinations: [] };
}

export function createApp({ config, drive, store, verifyIdentity, env = process.env }) {
  const app = express();
  app.disable('x-powered-by');
  const origins = (env.APP_ORIGINS || 'http://127.0.0.1:5173,http://localhost:5173').split(',').map(x => x.trim());
  const admins = (env.ADMIN_EMAILS || '').split(',').map(normalizeEmail).filter(Boolean);
  const sessions = new Map();
  const ttl = 8 * 60 * 60 * 1000;
  const cookie = { httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production', path: '/', maxAge: ttl };
  const upload = multer({ dest: tmpdir(), limits: { fileSize: 100 * 1024 * 1024, files: 1, fields: 0, parts: 1 } });
  const limit = (max) => rateLimit({ windowMs: 60000, limit: max, standardHeaders: true, legacyHeaders: false, message: { error: 'Demasiadas solicitudes. Espera un minuto.' } });
  app.use('/api', limit(240), cookieParser(), express.json({ limit: '16kb' }));
  app.use('/api', (req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'SAMEORIGIN' });
    const sid = req.cookies.cpt_session;
    let s = sessions.get(sid);
    if (s && s.expires < Date.now()) { sessions.delete(sid); s = null; }
    req.session = s;
    req.sid = sid;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      if (!origins.includes(req.get('origin')) || !s || req.get('x-csrf-token') !== s.csrf) return next(fail(403, 'La sesión de seguridad venció. Recarga la página.'));
    }
    next();
  });
  const newSession = (res, user = null) => {
    // Prune expired sessions and bound anonymous memory usage.
    for (const [key, s] of sessions) if (s.expires < Date.now()) sessions.delete(key);
    if (sessions.size >= 5000) sessions.delete(sessions.keys().next().value);
    const s = { csrf: token(), nonce: token(), user, expires: Date.now() + ttl };
    sessions.set(s.id = token(), s);
    res.cookie('cpt_session', s.id, cookie);
    return s;
  };
  const currentRole = req => roleFor(req.session?.user, admins, store);
  const adminOnly = (req, _res, next) => {
    if (!req.session?.user) return next(fail(401, 'Inicia sesión con Google.'));
    return currentRole(req).role === 'admin' ? next() : next(fail(403, 'Solo el administrador puede gestionar autorizaciones.'));
  };
  const writable = (req, _res, next) => {
    if (!req.session?.user) return next(fail(401, 'Inicia sesión con Google.'));
    const r = currentRole(req);
    if (!['admin', 'student'].includes(r.role) || !(r.destinations.includes('*') || r.destinations.includes(req.params.key))) return next(fail(403, 'No tienes autorización vigente para subir a este destino.'));
    next();
  };
  const requireDrive = (_req, _res, next) => drive ? next() : next(fail(503, 'Google Drive aún no está conectado.'));
  const destination = (req, _res, next) => {
    req.destination = config.destinations.find(d => d.key === req.params.key);
    return req.destination ? next() : next(fail(404, 'Destino no configurado.'));
  };
  app.get('/api/session', (req, res) => {
    const s = req.session || newSession(res);
    res.json({ user: s.user ? { email: s.user.email } : null, ...roleFor(s.user, admins, store), csrf: s.csrf, nonce: s.nonce,
      clientId: env.GOOGLE_CLIENT_ID || '', driveConfigured: Boolean(drive),
      catalog: config.destinations.map(({ key, label, kind, folderId }) => ({ key, label, kind, configured: Boolean(folderId) })) });
  });
  app.get('/api/drive/status', async (_req, res) => {
    if (!drive) return res.json({ state: 'pending', error: 'Google Drive aún no está conectado. Configura las credenciales y reinicia el backend.' });
    try { await drive.check(); res.json({ state: 'connected' }); }
    catch (error) { const result = driveError(error); res.status(result.status).json({ state: result.state, error: result.error }); }
  });
  app.post('/api/login', limit(10), async (req, res) => {
    if (!env.GOOGLE_CLIENT_ID) throw fail(503, 'Inicio de sesión con Google pendiente de configurar.');
    let p;
    try { p = await verifyIdentity(req.body.credential); } catch { throw fail(401, 'Google no pudo validar la identidad.'); }
    // Google must remain authoritative for the email used for preauthorization.
    const email = normalizeEmail(p?.email);
    if (!p?.sub || p.email_verified !== true || p.nonce !== req.session.nonce || !(email.endsWith('@gmail.com') || p.hd)) throw fail(401, 'Se requiere una cuenta verificada de Gmail o Google Workspace.');
    const user = { email, sub: p.sub };
    store.bind(email, p.sub);
    sessions.delete(req.sid);
    newSession(res, user); // Rotate the session ID and CSRF token after login.
    res.json({ ok: true });
  });
  app.post('/api/logout', (req, res) => {
    sessions.delete(req.sid);
    res.clearCookie('cpt_session', cookie);
    res.json({ ok: true });
  });
  app.get('/api/admin/grants', adminOnly, (_req, res) => res.json({ grants: store.list(), administrators: admins }));
  app.put('/api/admin/grants', adminOnly, (req, res) => {
    const email = normalizeEmail(req.body.email);
    const { active, destinations } = req.body;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof active !== 'boolean' || !Array.isArray(destinations) || destinations.length > 100 || !destinations.every(k => k === '*' || config.destinations.some(d => d.key === k))) throw fail(400, 'Correo, estado o destinos no válidos.');
    if (admins.includes(email)) throw fail(400, 'Los administradores se configuran únicamente en el servidor.');
    store.save(email, active, [...new Set(destinations)], req.session.user.email);
    res.json({ ok: true });
  });
  app.get('/api/destinations/:key/files', destination, requireDrive, async (req, res) => {
    const files = await drive.list(req.params.key);
    res.json({ files: files.map(f => {
      const base = `/api/destinations/${encodeURIComponent(req.params.key)}/files/${encodeURIComponent(f.id)}/content`;
      const preview = imageMimes.has(f.mimeType) ? 'image' : ['video/mp4', 'video/webm'].includes(f.mimeType) ? 'video' : f.mimeType === 'application/pdf' || exportable.has(f.mimeType) ? 'pdf' : null;
      return { id: f.id, name: f.name, mimeType: f.mimeType, size: f.size, modifiedTime: f.modifiedTime,
        description: f.description, preview, url: base + '?v=' + encodeURIComponent(f.modifiedTime || ''), downloadUrl: f.mimeType.startsWith('application/vnd.google-apps.') && !exportable.has(f.mimeType) ? null : base + '?download=1', thumbnail: f.thumbnailLink ? base.replace(/\/content$/, '/thumbnail') + '?v=' + encodeURIComponent(f.modifiedTime || '') : preview === 'image' ? base : null };
    }) });
  });
  app.get('/api/destinations/:key/files/:id/thumbnail', destination, requireDrive, async (req, res) => {
    const { data, mime } = await drive.thumbnail(req.params.key, req.params.id);
    res.set('Content-Type', mime);
    res.on('close', () => data.destroy());
    data.on('error', () => res.destroy());
    data.pipe(res);
  });
  app.get('/api/destinations/:key/files/:id/content', destination, requireDrive, async (req, res) => {
    if (req.get('range') && !/^bytes=\d*-\d*$/.test(req.get('range'))) throw fail(416, 'Rango de descarga no válido.');
    const { response, mime, name } = await drive.content(req.params.key, req.params.id, req.get('range'), req.query.download === '1');
    res.status(response.status === 206 ? 206 : 200);
    res.set('Content-Type', mime);
    res.set('Content-Disposition', `${req.query.download === '1' ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(name).replace(/'/g, '%27')}`);
    res.set('Content-Security-Policy', "frame-ancestors 'self'");
    for (const h of ['content-length', 'content-range', 'accept-ranges']) {
      const value = response.headers.get?.(h) ?? response.headers[h];
      if (value) res.set(h, String(value));
    }
    res.on('close', () => response.data.destroy());
    response.data.on('error', () => res.destroy());
    response.data.pipe(res);
  });
  app.post('/api/destinations/:key/files', destination, writable, limit(12), requireDrive, (req, res, next) => {
    upload.single('file')(req, res, async (err) => {
      try {
        if (err) throw fail(400, 'Sube un archivo por solicitud, de hasta 100 MB.');
        if (!req.file) throw fail(400, 'Selecciona un archivo.');
        const name = basename(req.file.originalname.replaceAll('\\', '/')).replace(/[\x00-\x1f\x7f]/g, '').slice(0, 180);
        const ext = extname(name).slice(1).toLowerCase();
        const detected = await fileTypeFromFile(req.file.path);
        if (!formats.has(ext) || detected?.mime !== formats.get(ext)) throw fail(415, 'Formato no permitido o contenido distinto a su extensión. Usa PDF, PPTX, DOCX, XLSX, JPG, PNG, WEBP, GIF, MP4 o WEBM.');
        const isImage = imageMimes.has(detected.mime);
        const max = isImage ? 15 : detected.mime.startsWith('video/') ? 100 : 30;
        if (req.destination.kind === 'school' && !isImage) throw fail(415, 'Los colegios solo admiten fotografías JPG, PNG, WEBP o GIF.');
        if (req.file.size > max * 1024 * 1024) throw fail(413, `Este tipo de archivo admite hasta ${max} MB.`);
        // Check again after receiving the body: revocations apply to existing sessions.
        const r = currentRole(req);
        if (!['admin', 'student'].includes(r.role) || !(r.destinations.includes('*') || r.destinations.includes(req.params.key))) throw fail(403, 'Tu autorización fue revocada durante la subida.');
        const result = await drive.upload(req.params.key, req.file.path, name, detected.mime);
        res.status(201).json(result);
      } catch (error) { next(error); }
      finally { if (req.file) await unlink(req.file.path).catch(() => {}); }
    });
  });
  app.use('/api', (_req, _res, next) => next(fail(404, 'Ruta no disponible.')));
  app.use((err, _req, res, _next) => {
    if (res.headersSent) return res.destroy();
    const result = driveError(err);
    res.status(result.status).json({ error: result.error, state: result.state });
  });
  return app;
}

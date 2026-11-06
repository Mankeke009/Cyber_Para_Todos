import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { createApp } from './app.mjs';
import { openStore } from './store.mjs';
import { driveAdapter, folderMime } from './drive.mjs';
import { validateConfig } from './config.mjs';

const config = { rootId: 'root', materialsId: 'materials', schoolsId: 'schools', destinations: [
  { key: 'material-phishing', label: 'Phishing', kind: 'material', folderId: 'phishing' },
  { key: 'school-one', label: 'Colegio', kind: 'school', folderId: 'school' },
] };
const origin = 'http://localhost:5173';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRZsAAAAASUVORK5CYII=', 'base64');

async function fixture(t, options = {}) {
  const store = openStore(':memory:');
  let uploads = 0;
  const drive = { list: async () => [{ id: 'photo', name: 'foto.png', mimeType: 'image/png' }], upload: async () => { uploads++; return { id: 'new' }; } };
  const app = createApp({ config, store, drive,
    env: { GOOGLE_CLIENT_ID: 'test-client', ADMIN_EMAILS: 'admin@example.edu', APP_ORIGINS: origin },
    // This double is confined to tests; production always uses Google's signature/audience/expiry verification.
    verifyIdentity: async credential => { if (credential === 'invalid') throw new Error('bad signature'); return JSON.parse(credential); }, ...options });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); store.close(); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function browser() {
    let cookie = '', session;
    const request = async (path, method = 'GET', body, headers = {}) => {
      const multipart = body instanceof FormData;
      const response = await fetch(base + path, { method, headers: { Cookie: cookie, ...(method !== 'GET' ? { Origin: origin, 'X-CSRF-Token': session?.csrf, ...(!multipart ? { 'Content-Type': 'application/json' } : {}) } : {}), ...headers }, body: body === undefined ? undefined : multipart ? body : JSON.stringify(body) });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';')[0];
      return response;
    };
    const refresh = async () => { session = await (await request('/session')).json(); return session; };
    await refresh();
    return { request, refresh, get session() { return session; }, async login(email, overrides = {}) {
      const response = await request('/login', 'POST', { credential: JSON.stringify({ sub: `sub-${email}`, email, email_verified: true, hd: 'example.edu', nonce: session.nonce, ...overrides }) });
      if (response.ok) await refresh();
      return response;
    }, async upload(key = 'material-phishing', content = png, name = 'foto.png') {
      const form = new FormData(); form.append('file', new Blob([content]), name);
      return request(`/destinations/${key}/files`, 'POST', form);
    } };
  }
  return { browser, store, uploads: () => uploads };
}

test('visitante: lectura pública, sin subida ni administración; primer usuario no es administrador', async t => {
  const f = await fixture(t); const user = await f.browser();
  assert.equal((await user.request('/destinations/material-phishing/files')).status, 200);
  const denied = await user.upload(); assert.equal(denied.status, 401, await denied.text());
  assert.equal((await user.request('/admin/grants')).status, 401);
  assert.equal((await user.login('first@example.edu')).status, 200);
  assert.equal(user.session.role, 'visitor');
  assert.equal((await user.upload()).status, 403);
  assert.equal((await user.request('/admin/grants', 'PUT', { email: 'evil@example.edu', active: true, destinations: ['*'] })).status, 403);
  assert.equal(f.uploads(), 0);
});

test('administrador: preautorizar, limitar destinos, revocar sesión abierta y reactivar', async t => {
  const f = await fixture(t); const admin = await f.browser();
  await admin.login('admin@example.edu'); assert.equal(admin.session.role, 'admin');
  const grant = { email: 'student@example.edu', active: true, destinations: ['material-phishing'] };
  assert.equal((await admin.request('/admin/grants', 'PUT', grant)).status, 200);
  const student = await f.browser(); await student.login(grant.email);
  assert.equal(student.session.role, 'student');
  assert.equal((await student.upload()).status, 201);
  assert.equal((await student.upload('school-one')).status, 403);
  assert.equal((await student.request('/admin/grants')).status, 403);
  await admin.request('/admin/grants', 'PUT', { ...grant, active: false });
  assert.equal((await student.upload()).status, 403); // No refresh or new login.
  assert.equal((await student.refresh()).role, 'visitor');
  await admin.request('/admin/grants', 'PUT', grant);
  assert.equal((await student.upload()).status, 201);
  assert.equal((await admin.upload('school-one')).status, 201);
  assert.equal((await admin.request('/admin/grants', 'PUT', { ...grant, email: 'admin@example.edu' })).status, 400);
  assert.equal((await admin.request('/admin/grants', 'PUT', { ...grant, destinations: ['outside'] })).status, 400);
});

test('identidad y CSRF: rechazar token inválido, nonce ajeno, correo no verificado y origen externo', async t => {
  const f = await fixture(t); const user = await f.browser();
  assert.equal((await user.request('/login', 'POST', { credential: 'invalid' })).status, 401);
  assert.equal((await user.login('admin@example.edu', { nonce: 'other' })).status, 401);
  assert.equal((await user.login('admin@example.edu', { email_verified: false })).status, 401);
  assert.equal((await user.login('admin@example.edu', { hd: undefined })).status, 401);
  assert.equal((await user.request('/login', 'POST', {}, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await user.request('/login', 'POST', {}, { 'X-CSRF-Token': 'wrong' })).status, 403);
});

test('permisos vinculados a sub; contenido y tamaño validados en el servidor', async t => {
  const f = await fixture(t); const admin = await f.browser(); await admin.login('admin@example.edu');
  f.store.save('student@example.edu', true, ['*'], 'admin');
  const user = await f.browser(); await user.login('student@example.edu');
  assert.equal((await user.upload('material-phishing', Buffer.from('<script>alert(1)</script>'), 'falso.pdf')).status, 415);
  assert.equal((await user.upload('material-phishing', png, 'falso.exe')).status, 415);
  assert.equal((await user.upload('school-one', Buffer.from('%PDF-1.4\n test'), 'test.pdf')).status, 415);
  const large = Buffer.alloc(16 * 1024 * 1024); png.copy(large);
  assert.equal((await user.upload('school-one', large)).status, 413);
  const other = await f.browser(); await other.login('student@example.edu', { sub: 'different-sub' });
  assert.equal(other.session.role, 'visitor');
  assert.equal((await other.upload()).status, 403);
});

test('SQLite persiste autorizaciones y estados tras reiniciar y abrir otra conexión', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cpt-test-')); const path = join(dir, 'access.sqlite');
  try {
    let s = openStore(path); s.save('student@example.edu', true, ['material-phishing'], 'admin'); s.bind('student@example.edu', 'subject'); s.close();
    s = openStore(path); const other = openStore(path);
    assert.equal(s.get('student@example.edu').subject, 'subject');
    s.save('student@example.edu', false, ['*'], 'admin');
    assert.equal(other.get('student@example.edu').active, false);
    other.close(); s.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('Drive sin configurar: estado explícito y cierre de escritura', async t => {
  const f = await fixture(t, { drive: null }); const user = await f.browser();
  assert.equal(user.session.driveConfigured, false);
  assert.equal((await (await user.request('/drive/status')).json()).state, 'pending');
  assert.equal((await user.request('/destinations/material-phishing/files')).status, 503);
  assert.equal((await user.request('/destinations/unknown/files')).status, 404);
});

test('estado real de Drive distingue acceso válido de permisos y no expone errores privados', async t => {
  const connected = await fixture(t, { drive: { check: async () => {} } });
  const user = await connected.browser();
  assert.equal((await (await user.request('/drive/status')).json()).state, 'connected');
  const denied = await fixture(t, { drive: { check: async () => { throw Object.assign(new Error('private upstream details'), { response: { status: 403 } }); } } });
  const visitor = await denied.browser();
  const response = await visitor.request('/drive/status');
  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.state, 'permission_denied');
  assert.ok(!JSON.stringify(body).includes('private upstream details'));
});

test('Drive: paginación, archivos movidos/eliminados, accesos fuera del proyecto y exportación PDF', async () => {
  const records = {
    root: { id: 'root', mimeType: folderMime }, materials: { mimeType: folderMime, parents: ['root'] }, schools: { mimeType: folderMime, parents: ['root'] },
    phishing: { mimeType: folderMime, parents: ['materials'] }, school: { mimeType: folderMime, parents: ['schools'] },
    presentation: { id: 'presentation', name: 'Diapositivas', mimeType: 'application/vnd.google-apps.presentation', parents: ['phishing'] },
    outside: { mimeType: 'image/png', parents: ['private'] }, deleted: { mimeType: 'image/png', parents: ['phishing'], trashed: true },
    shortcut: { mimeType: 'application/vnd.google-apps.shortcut', parents: ['phishing'] },
  };
  let pages = 0, exported = false;
  const adapter = driveAdapter({ files: {
    get: async ({ fileId }) => ({ data: records[fileId] }),
    list: async ({ q, pageToken }) => { assert.match(q, /'phishing' in parents/); pages++; return { data: pageToken ? { files: [{ id: 'second', mimeType: 'application/pdf' }] } : { files: [records.presentation, records.shortcut], nextPageToken: 'next' } }; },
    export: async ({ mimeType }) => { assert.equal(mimeType, 'application/pdf'); exported = true; return { data: Readable.from(['pdf']), headers: {}, status: 200 }; },
  } }, config);
  assert.equal((await adapter.list('material-phishing')).length, 2); assert.equal(pages, 2);
  await assert.rejects(adapter.file('material-phishing', 'outside'), { status: 404 });
  await assert.rejects(adapter.file('material-phishing', 'deleted'), { status: 404 });
  await assert.rejects(adapter.file('material-phishing', 'shortcut'), { status: 404 });
  const result = await adapter.content('material-phishing', 'presentation'); assert.equal(result.mime, 'application/pdf'); assert.ok(exported);
  records.phishing.parents = ['private'];
  await assert.rejects(adapter.list('material-phishing'), { status: 403 });
  await assert.rejects(adapter.destination('arbitrary-id'), { status: 503 });
});

test('miniaturas: proxy con validación de pertenencia y dominio; URLs privadas no llegan al navegador', async t => {
  const f = await fixture(t, { drive: { list: async () => [{ id: 'doc', name: 'Documento', mimeType: 'application/pdf', thumbnailLink: 'https://lh3.googleusercontent.com/private-token' }] } });
  const user = await f.browser();
  const response = await (await user.request('/destinations/material-phishing/files')).json();
  assert.equal(response.files[0].thumbnail, '/api/destinations/material-phishing/files/doc/thumbnail?v=');
  assert.ok(!JSON.stringify(response).includes('private-token'));
  const records = { root: { mimeType: folderMime }, materials: { mimeType: folderMime, parents: ['root'] }, phishing: { mimeType: folderMime, parents: ['materials'] }, doc: { mimeType: 'application/pdf', parents: ['phishing'], thumbnailLink: 'https://lh3.googleusercontent.com/private-token' } };
  let calls = 0;
  const adapter = driveAdapter({ files: { get: async ({ fileId }) => ({ data: records[fileId] }) } }, config, async () => { calls++; return { mime: 'image/png' }; });
  assert.equal((await adapter.thumbnail('material-phishing', 'doc')).mime, 'image/png');
  records.doc.thumbnailLink = 'http://127.0.0.1:3001/private';
  await assert.rejects(adapter.thumbnail('material-phishing', 'doc'), { status: 404 });
  records.doc.parents = ['outside'];
  await assert.rejects(adapter.thumbnail('material-phishing', 'doc'), { status: 404 });
  assert.equal(calls, 1);
});

test('configuración: rechazar destinos duplicados y reutilizar carpetas raíz', () => {
  assert.equal(validateConfig(config), config);
  assert.throws(() => validateConfig({ ...config, destinations: [...config.destinations, config.destinations[0]] }));
  assert.throws(() => validateConfig({ ...config, destinations: [{ ...config.destinations[0], folderId: 'root' }] }));
});

test('videos: Range se entrega a Google; un archivo sin permiso de descarga se rechaza', async () => {
  const records = { root: { mimeType: folderMime }, materials: { mimeType: folderMime, parents: ['root'] }, phishing: { mimeType: folderMime, parents: ['materials'] }, video: { mimeType: 'video/mp4', name: 'Video.mp4', parents: ['phishing'], capabilities: { canDownload: true } } };
  let range;
  const adapter = driveAdapter({ files: { get: async (args, options) => {
    if (args.alt === 'media') { range = options.headers.Range; return { status: 206, headers: {}, data: Readable.from(['video']) }; }
    return { data: records[args.fileId] };
  } } }, config);
  const result = await adapter.content('material-phishing', 'video', 'bytes=0-100');
  assert.equal(range, 'bytes=0-100'); assert.equal(result.response.status, 206);
  records.video.capabilities.canDownload = false;
  await assert.rejects(adapter.content('material-phishing', 'video'), { status: 403 });
});

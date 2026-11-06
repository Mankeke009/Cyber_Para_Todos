// Run explicitly by the owner after choosing the OAuth (My Drive) option.
import { envPath } from './environment.mjs';
import { google } from 'googleapis';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('Completa GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env antes de autorizar la cuenta dedicada.');
  process.exit(1);
}
const redirect = 'http://127.0.0.1:3002/oauth/callback';
const oauth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, redirect);
const state = randomBytes(32).toString('hex');
const { codeVerifier, codeChallenge } = await oauth.generateCodeVerifierAsync();
let consumed = false;
const server = createServer(async (req, res) => {
  const url = new URL(req.url, redirect);
  if (url.pathname !== '/oauth/callback' || url.searchParams.get('state') !== state || consumed) { res.writeHead(400).end('Solicitud no válida.'); return; }
  consumed = true;
  try {
    if (!url.searchParams.get('code') || url.searchParams.has('error')) throw new Error('denied');
    const { tokens } = await oauth.getToken({ code: url.searchParams.get('code'), codeVerifier, redirect_uri: redirect });
    if (!tokens.refresh_token) throw new Error('no refresh token');
    let text = readFileSync(envPath, 'utf8');
    const line = `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`;
    text = /^GOOGLE_REFRESH_TOKEN=.*$/m.test(text) ? text.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, line) : text + '\n' + line + '\n';
    writeFileSync(envPath, text, { mode: 0o600 });
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Autorización guardada en el servidor. Puedes cerrar esta ventana y reiniciar el backend.');
    console.log('Autorización completada. Token guardado en .env; no lo compartas ni lo copies al frontend.');
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No se completó la autorización. Revisa la cuenta y vuelve a ejecutar el asistente.');
    console.error('Autorización no completada. No se imprimieron credenciales.');
  } finally { clearTimeout(timeout); server.close(); }
});
const timeout = setTimeout(() => { console.error('Autorización vencida después de 10 minutos.'); server.close(); }, 600000);
server.listen(3002, '127.0.0.1', () => {
  console.log('Abre este enlace e inicia sesión con la cuenta dedicada al proyecto:');
  console.log(oauth.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: ['https://www.googleapis.com/auth/drive'], state, code_challenge: codeChallenge, code_challenge_method: 'S256' }));
});

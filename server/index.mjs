import { projectRoot } from './environment.mjs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import express from 'express';
import { google } from 'googleapis';
import { createDrive } from './drive.mjs';
import { openStore } from './store.mjs';
import { createApp } from './app.mjs';
import { validateConfig } from './config.mjs';

const config = validateConfig(JSON.parse(readFileSync(resolve(projectRoot, process.env.DRIVE_CONFIG_PATH || 'server/config.example.json'), 'utf8')));
const store = openStore(resolve(projectRoot, process.env.DATABASE_PATH || 'server/data/access.sqlite'));
const identity = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID);
const app = createApp({ config, store, drive: createDrive(config, process.env),
  verifyIdentity: async credential => (await identity.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID })).getPayload() });
if (process.env.NODE_ENV === 'production') app.use(express.static(resolve(projectRoot, 'dist')));
const port = Number(process.env.PORT || 3001);
const server = app.listen(port, '127.0.0.1', () => console.log(`Backend CiberParaTodos: http://127.0.0.1:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => { store.close(); process.exit(0); }));

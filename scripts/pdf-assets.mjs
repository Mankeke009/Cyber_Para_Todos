import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const source = new URL('node_modules/pdfjs-dist/', root);
const target = new URL('public/pdfjs-assets/', root);
const version = JSON.parse(readFileSync(new URL('package.json', source), 'utf8')).version;
const marker = new URL('version.txt', target);
if (!existsSync(marker) || readFileSync(marker, 'utf8') !== version) {
  mkdirSync(target, { recursive: true });
  for (const directory of ['cmaps', 'standard_fonts', 'wasm']) cpSync(fileURLToPath(new URL(directory, source)), fileURLToPath(new URL(directory, target)), { recursive: true });
  writeFileSync(marker, version);
}

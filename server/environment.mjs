import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const envPath = fileURLToPath(new URL('../.env', import.meta.url));
dotenv.config({ path: envPath, quiet: true });

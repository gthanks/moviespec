import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function loadBackend(backendId) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const modPath = path.resolve(here, '..', 'backends', `${backendId}.js`);
  const modUrl = pathToFileURL(modPath).href;
  return import(modUrl);
}

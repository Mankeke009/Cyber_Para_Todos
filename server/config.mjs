export function validateConfig(config) {
  const id = x => typeof x === 'string' && /^[\w-]+$/.test(x);
  const roots = [config.rootId, config.materialsId, config.schoolsId];
  if (!roots.every(id) || new Set(roots).size !== 3 || !Array.isArray(config.destinations)) throw new Error('Configuración de carpetas principales no válida.');
  const keys = new Set(), folders = new Set(roots);
  for (const d of config.destinations) {
    if (!/^[a-z0-9-]+$/.test(d.key) || keys.has(d.key) || !['material', 'school'].includes(d.kind) || typeof d.label !== 'string' || !d.label || (d.folderId && (!id(d.folderId) || folders.has(d.folderId)))) throw new Error('Destino duplicado o no válido en la configuración de Drive.');
    keys.add(d.key);
    if (d.folderId) folders.add(d.folderId);
  }
  return config;
}

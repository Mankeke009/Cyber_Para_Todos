import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { driveButton, useDrive } from '@/lib/drive';

export default function UploadFiles({ destination }: { destination?: string }) {
  const { account } = useDrive();
  const [open, setOpen] = useState(false);
  if (!account || !['student', 'admin'].includes(account.role)) return null;
  if (destination && !account.destinations.includes('*') && !account.destinations.includes(destination)) return null;
  return <><button className={driveButton} onClick={() => setOpen(true)}>Subir archivos</button>{open && <UploadDialog destination={destination} onClose={() => setOpen(false)} />}</>;
}
function UploadDialog({ destination, onClose }: { destination?: string; onClose: () => void }) {
  const { account, refresh } = useDrive();
  const allowed = account!.catalog.filter(d => d.configured && (account!.destinations.includes('*') || account!.destinations.includes(d.key)));
  const [target, setTarget] = useState(destination || allowed[0]?.key || '');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<string[]>([]);
  const xhr = useRef<XMLHttpRequest | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; xhr.current?.abort(); }; }, []);
  const school = allowed.find(d => d.key === target)?.kind === 'school';
  const send = async () => {
    setBusy(true); setResults([]);
    for (const file of files) {
      if (!alive.current) break;
      setProgress(0);
      try {
        const image = /\.(jpe?g|png|webp|gif)$/i.test(file.name);
        const video = /\.(mp4|webm)$/i.test(file.name);
        if (!(school ? /\.(jpe?g|png|webp|gif)$/i : /\.(pdf|pptx|docx|xlsx|jpe?g|png|webp|gif|mp4|webm)$/i).test(file.name)) throw new Error('Formato no permitido para este destino.');
        if (file.size > (image ? 15 : video ? 100 : 30) * 1024 * 1024) throw new Error('Supera el tamaño máximo permitido.');
        await new Promise<void>((resolve, reject) => {
          const request = new XMLHttpRequest(); xhr.current = request;
          request.open('POST', `/api/destinations/${encodeURIComponent(target)}/files`);
          request.setRequestHeader('X-CSRF-Token', account!.csrf);
          request.timeout = 10 * 60 * 1000;
          request.upload.onprogress = e => { if (e.lengthComputable && alive.current) setProgress(Math.round(e.loaded / e.total * 100)); };
          request.onload = () => {
            let body; try { body = JSON.parse(request.responseText); } catch { body = { error: 'Respuesta del servidor no válida.' }; }
            request.status === 201 ? resolve() : reject(new Error(body.error || 'No se pudo subir.'));
          };
          request.onerror = () => reject(new Error('Error de conexión.'));
          request.ontimeout = () => reject(new Error('Tiempo agotado. Comprueba el destino antes de reintentar para evitar duplicados.'));
          request.onabort = () => reject(new Error('Subida cancelada.'));
          const body = new FormData(); body.append('file', file); request.send(body);
        });
        if (alive.current) setResults(r => [...r, `${file.name}: subido correctamente.`]);
        window.dispatchEvent(new Event('cpt-files-changed'));
      } catch (e) { if (alive.current) setResults(r => [...r, `${file.name}: ${(e as Error).message}`]); }
    }
    if (alive.current) { setBusy(false); await refresh(); }
  };
  return <Modal title="Subir archivos" onClose={onClose}>
    <p className="mb-4 text-sm text-fg2">Fotos: hasta 15 MB. Documentos PDF, PPTX, DOCX y XLSX: hasta 30 MB. Videos MP4 y WEBM: hasta 100 MB. El servidor valida también el contenido del archivo.</p>
    {!allowed.length ? <p>No hay destinos configurados disponibles para tu cuenta.</p> : <form className="space-y-4" onSubmit={e => { e.preventDefault(); void send(); }}>
      <label className="block">Destino<select required disabled={busy} className="cpt-input mt-2" value={target} onChange={e => setTarget(e.target.value)}><option value="" disabled>Selecciona un destino</option>{allowed.map(d => <option key={d.key} value={d.key}>{d.kind === 'school' ? 'Colegio' : 'Tema'}: {d.label}</option>)}</select></label>
      <label className="block">Archivos<input type="file" multiple required disabled={busy} accept={school ? '.jpg,.jpeg,.png,.webp,.gif' : '.pdf,.pptx,.docx,.xlsx,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm'} className="cpt-input mt-2" onChange={e => { setFiles(Array.from(e.target.files || [])); setResults([]); }} /></label>
      <button type="submit" disabled={busy || !target || !files.length} className={driveButton}>{busy ? 'Subiendo…' : 'Subir archivos'}</button>
      {busy && <div role="status"><label>Envío al servidor: {progress}%<progress value={progress} max={100} className="block w-full" /></label><p className="text-sm text-fg2">Al llegar a 100%, espera la confirmación de Google Drive. Cerrar esta ventana cancela el envío pendiente.</p></div>}
    </form>}
    <ul aria-live="polite" className="mt-4 space-y-2 break-words">{results.map((r, i) => <li key={i}>{r}</li>)}</ul>
  </Modal>;
}

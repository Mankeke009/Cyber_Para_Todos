import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { driveButton, type DriveFile } from '@/lib/drive';
import PdfPage, { usePdf } from './PdfPage';

export const SLIDE_INTERVAL = 10000;
export function stableFiles(files: DriveFile[]) {
  return [...files].sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true, sensitivity: 'base' }) || a.id.localeCompare(b.id));
}
export default function MaterialPlayer({ files }: { files: DriveFile[] }) {
  const ordered = useMemo(() => stableFiles(files), [files]);
  const [position, setPosition] = useState({ id: '', page: 1 });
  const selected = ordered.find(f => f.id === position.id) || ordered.find(f => f.preview) || ordered[0];
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [hidden, setHidden] = useState(document.hidden);
  const [revision, setRevision] = useState(0);
  const [readyKey, setReadyKey] = useState('');
  const [failedKey, setFailedKey] = useState('');
  const pdf = usePdf(selected?.preview === 'pdf' ? selected.url : null);
  const count = selected?.preview === 'pdf' ? pdf.document?.numPages || 0 : 1;
  const requestedPage = position.id === selected?.id ? position.page : 1;
  const page = requestedPage === 0 ? count || 1 : Math.min(requestedPage, count || requestedPage);
  const key = selected ? `${selected.url}:${page}` : '';
  const failed = failedKey === key || Boolean(pdf.error);
  const ready = readyKey === key;
  const move = (delta: number) => {
    if (!selected) return;
    setReadyKey('');
    setRevision(n => n + 1);
    if (selected.preview === 'pdf' && count && page + delta > 0 && page + delta <= count) {
      setPosition({ id: selected.id, page: page + delta }); return;
    }
    const start = ordered.findIndex(f => f.id === selected.id);
    for (let step = 1; step <= ordered.length; step++) {
      const next = ordered[(start + delta * step + ordered.length * 2) % ordered.length];
      if (next.preview) { setPosition({ id: next.id, page: delta < 0 && next.preview === 'pdf' ? 0 : 1 }); return; }
    }
  };
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReduced(query.matches);
    const visibility = () => setHidden(document.hidden);
    query.addEventListener('change', motion); document.addEventListener('visibilitychange', visibility);
    return () => { query.removeEventListener('change', motion); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (!selected || !ready || failed || paused || reduced || hidden || !['image', 'pdf'].includes(selected.preview || '')) return;
    const timer = window.setTimeout(() => move(1), SLIDE_INTERVAL);
    return () => clearTimeout(timer);
  }, [selected?.url, page, count, ready, failed, paused, reduced, hidden, revision, ordered]);
  if (!selected) return null;
  return <section aria-label="Presentación de materiales" onKeyDown={event => {
    const target = event.target as HTMLElement;
    if (target.closest('select,input,textarea,video,button,a')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.code === 'Space') { event.preventDefault(); setPaused(p => !p); }
  }}>
    <label className="block text-sm">Archivo<select className="cpt-input mt-2" value={selected.id} onChange={e => { setPosition({ id: e.target.value, page: 1 }); setRevision(n => n + 1); setFailedKey(''); setReadyKey(''); }}>
      {ordered.map(f => <option key={f.id} value={f.id}>{f.name}{!f.preview ? ' (descarga)' : ''}</option>)}
    </select></label>
    <div className="my-3 flex flex-wrap items-center justify-between gap-2">
      <h3 className="min-w-0 break-words font-medium">{selected.name}</h3>
      <p aria-live={paused || reduced ? 'polite' : 'off'}>{selected.preview === 'pdf' && !count ? 'Cargando páginas…' : `Página ${page} de ${count || 1}`}</p>
    </div>
    <div tabIndex={0} aria-label="Contenido del material. Flechas para navegar y espacio para pausar." className="rounded-card border border-line/20 bg-glass/[0.04] p-2" aria-busy={!ready && !failed && Boolean(selected.preview) && selected.preview !== 'video'}>
      {failed ? <div className="cpt-presentation-stage flex-col gap-4 p-6" role="alert"><p>{pdf.error || 'No se pudo mostrar este archivo. Puedes reintentar, descargarlo o avanzar al siguiente.'}</p><button className={driveButton} onClick={() => { setFailedKey(''); setReadyKey(''); pdf.retry(); setRevision(n => n + 1); }}>Reintentar vista previa</button></div>
        : selected.preview === 'pdf' ? pdf.document ? <PdfPage key={selected.url} document={pdf.document} page={page} onReady={() => setReadyKey(key)} onError={() => setFailedKey(key)} /> : <div className="cpt-presentation-stage" role="status">Cargando documento…</div>
          : selected.preview === 'image' ? <div className="cpt-presentation-stage"><img key={`${selected.url}:${revision}`} src={selected.url} alt={selected.description || selected.name} className="cpt-slide-enter h-full w-full object-contain" onLoad={() => setReadyKey(key)} onError={() => setFailedKey(key)} /></div>
            : selected.preview === 'video' ? <div className="cpt-presentation-stage"><video key={selected.url} controls preload="metadata" className="h-full w-full object-contain" onError={() => setFailedKey(key)}><source src={selected.url} type={selected.mimeType} />Tu navegador no admite este video.</video></div>
              : <div className="cpt-presentation-stage flex-col gap-4 p-6"><p>Este archivo no puede reproducirse en el visor. Los PPTX necesitan convertirse a PDF o Google Slides desde Drive. No hay un conversor de PowerPoint instalado en el servidor.</p><p>Descarga el original para consultarlo o pide una versión PDF al equipo.</p></div>}
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
      <button className={driveButton} onClick={() => move(-1)} aria-label="Página o archivo anterior"><ChevronLeft size={18} aria-hidden="true" />Anterior</button>
      <button className={driveButton} disabled={reduced || selected.preview === 'video' || !selected.preview} aria-pressed={paused || reduced} onClick={() => setPaused(p => !p)}>{paused || reduced ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}{paused || reduced ? 'Reanudar' : 'Pausar'}</button>
      <button className={driveButton} onClick={() => move(1)} aria-label="Página o archivo siguiente">Siguiente<ChevronRight size={18} aria-hidden="true" /></button>
    </div>
    <p className="mt-3 text-center text-sm text-fg2">{reduced ? 'Avance automático desactivado por tu preferencia de movimiento reducido.' : selected.preview === 'video' ? 'El video utiliza sus propios controles. El avance automático está detenido.' : !selected.preview ? 'Este formato queda fuera del avance automático.' : paused ? 'Presentación pausada.' : 'Avance automático cada 10 segundos. Se detiene al ocultar esta pestaña.'}</p>
    {selected.mimeType === 'application/vnd.google-apps.presentation' && <p className="mt-2 text-sm text-fg2">Diapositivas convertidas a PDF de solo lectura; las animaciones originales no se reproducen.</p>}
    {selected.downloadUrl && <a href={selected.downloadUrl} className={`${driveButton} mt-3`}>Descargar para consultar</a>}
  </section>;
}

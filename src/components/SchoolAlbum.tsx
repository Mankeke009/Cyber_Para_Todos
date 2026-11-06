import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, Pause, Play } from 'lucide-react';
import type { Foto } from '@/content/colegios';
import Modal from './Modal';
import { driveButton, useVisible } from '@/lib/drive';

export function SchoolCover({ photo }: { photo: Foto }) {
  return <img src={photo.src} alt={photo.alt} loading="lazy" className="mt-3 aspect-[16/9] w-full rounded-ui border border-line/20 object-cover" />;
}
function Lightbox({ photos, start, title, onClose }: { photos: Foto[]; start: number; title: string; onClose: () => void }) {
  const [i, setI] = useState(start);
  const prev = () => setI(n => (n - 1 + photos.length) % photos.length);
  const next = () => setI(n => (n + 1) % photos.length);
  return <Modal title={`Álbum: ${title}`} onClose={onClose}>
    <div onKeyDown={e => { if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); } if (e.key === 'ArrowRight') { e.preventDefault(); next(); } }}>
      <figure><img src={photos[i].src} alt={photos[i].alt} className="mx-auto max-h-[65vh] w-auto max-w-full rounded-card object-contain" />
        <figcaption className="mt-3 break-words text-sm text-fg2">{photos[i].alt}</figcaption></figure>
      <div className="mt-4 flex items-center justify-center gap-3">
        <button onClick={prev} className={driveButton} aria-label="Foto anterior"><ChevronLeft aria-hidden="true" size={18} /></button>
        <span role="status">{i + 1} / {photos.length}</span>
        <button onClick={next} className={driveButton} aria-label="Foto siguiente"><ChevronRight aria-hidden="true" size={18} /></button>
      </div>
    </div>
  </Modal>;
}
export function SchoolAlbum({ photos, schoolName }: { photos: Foto[]; schoolName: string }) {
  const [i, setI] = useState(0);
  const [openAt, setOpenAt] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [interacting, setInteracting] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { ref, visible } = useVisible();
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const moving = !paused && !reduced && !interacting && !hovered && openAt === null && visible;
  useEffect(() => {
    if (!moving || photos.length < 2) return;
    const interval = window.setInterval(() => { if (!document.hidden) setI(n => (n + 1) % photos.length); }, 6000);
    return () => clearInterval(interval);
  }, [moving, photos.length]);
  if (!photos.length) return null;
  const move = (delta: number) => { setPaused(true); setI(n => (n + delta + photos.length) % photos.length); };
  return <div ref={ref} role="region" aria-roledescription="carrusel" aria-label={`Fotos de ${schoolName}`} className="mt-3"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setInteracting(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setInteracting(false); }}>
    <button className="block w-full rounded-ui" onClick={() => setOpenAt(i)} aria-label={`Ampliar foto ${i + 1}: ${photos[i].alt}`}>
      <img src={photos[i].src} alt={photos[i].alt} loading="lazy" className="aspect-[16/10] w-full rounded-ui object-cover" />
    </button>
    <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
      <button className={driveButton} onClick={() => move(-1)} aria-label="Foto anterior"><ChevronLeft size={16} aria-hidden="true" /></button>
      <span aria-live={moving ? 'off' : 'polite'} className="text-sm">{i + 1} / {photos.length}</span>
      <button className={driveButton} onClick={() => move(1)} aria-label="Foto siguiente"><ChevronRight size={16} aria-hidden="true" /></button>
      {!reduced && <button className={driveButton} aria-pressed={paused} onClick={() => setPaused(p => !p)}>{paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}{paused ? 'Reanudar' : 'Pausar'}</button>}
    </div>
    {reduced && <p className="mt-2 text-xs text-fg2">Avance automático desactivado por tu preferencia de movimiento reducido.</p>}
    <button onClick={() => setOpenAt(i)} className={`${driveButton} mt-3`}><Images size={14} aria-hidden="true" />Ver álbum completo ({photos.length})</button>
    {openAt !== null && <Lightbox photos={photos} start={openAt} title={schoolName} onClose={() => setOpenAt(null)} />}
  </div>;
}

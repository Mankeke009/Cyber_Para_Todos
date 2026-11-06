import { destinationKey, useDriveFiles } from '@/lib/drive';
import { temas, type Tema } from '@/content/temas';
import Modal from './Modal';
import UploadFiles from './UploadFiles';
import MaterialPlayer from './MaterialPlayer';
import { MoreLink } from './TemaPreview';
import { driveButton } from '@/lib/drive';

export function FileState({ loading, error, empty, retry }: { loading: boolean; error: string; empty: boolean; retry: () => void }) {
  return <div aria-live="polite" className="my-3 text-sm text-fg2">
    {loading && <p role="status">Actualizando archivos…</p>}
    {error && <div role="alert"><p>{error}</p><button className={`${driveButton} mt-2`} onClick={retry}>Reintentar</button></div>}
    {!loading && !error && empty && <p>Esta carpeta todavía no tiene archivos publicados.</p>}
  </div>;
}
export function MaterialBrowser({ title, onClose }: { title: string; onClose: () => void }) {
  const tema: Tema | undefined = temas.find(t => t.title === title);
  const key = destinationKey('material', title);
  const { files, loading, error, retry } = useDriveFiles(key, true);
  return <Modal title={`Materiales: ${title}`} onClose={onClose} wide>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-fg2">Materiales de este tema · Solo lectura · Actualización cada minuto</p><UploadFiles destination={key} /></div>
    <FileState loading={loading} error={error} empty={!files.length} retry={retry} />
    <MaterialPlayer files={files} />
    {tema && <details className="mt-6 rounded-card border border-line/20 p-4">
      <summary className="cursor-pointer font-geist text-lg">Explicación y consejos: {tema.title}</summary>
      <p className="mt-4 text-fg2">{tema.body}</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-fg2">{tema.tips.map(tip => <li key={tip}>{tip}</li>)}</ul>
      {tema.example && <p className="mt-4 text-fg2">{tema.example}</p>}
      <MoreLink tema={tema} className="mt-4" />
    </details>}
  </Modal>;
}

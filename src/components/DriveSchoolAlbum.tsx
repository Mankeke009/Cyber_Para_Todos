import type { Colegio } from '@/content/colegios';
import { destinationKey, useDriveFiles, useVisible } from '@/lib/drive';
import { SchoolAlbum } from './SchoolAlbum';
import { FileState } from './DriveMaterials';
import UploadFiles from './UploadFiles';

export default function DriveSchoolAlbum({ school }: { school: Colegio }) {
  const { ref, visible } = useVisible();
  const key = destinationKey('school', school.name);
  const { files, loading, error, retry } = useDriveFiles(key, visible);
  const photos = files.map(f => ({ src: f.url, alt: f.description || `${school.name}: ${f.name}` }));
  return <div ref={ref} className="mt-3">
    <h4 className="font-medium">Fotos de las visitas</h4>
    <FileState loading={loading} error={error} empty={!photos.length} retry={retry} />
    {photos.length > 0 && <SchoolAlbum key={photos.map(p => p.src).join('|')} photos={photos} schoolName={school.name} />}
    {!photos.length && school.photos && school.photos.length > 0 && <SchoolAlbum photos={school.photos} schoolName={school.name} />}
    <div className="mt-3"><UploadFiles destination={key} /></div>
  </div>;
}

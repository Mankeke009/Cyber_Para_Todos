import { createContext, useCallback, useContext, useEffect, useState, type ReactNode, useRef } from 'react';

export type Destination = { key: string; label: string; kind: 'material' | 'school'; configured: boolean };
export type Account = { user: { email: string } | null; role: 'visitor' | 'student' | 'admin'; destinations: string[]; csrf: string; nonce: string; clientId: string; driveConfigured: boolean; catalog: Destination[] };
export type DriveFile = { id: string; name: string; mimeType: string; modifiedTime: string; description?: string; preview: 'image' | 'video' | 'pdf' | null; url: string; downloadUrl: string | null; thumbnail: string | null };
export const destinationKey = (kind: string, label: string) => `${kind}-${label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
export const driveButton = 'inline-flex items-center justify-center gap-2 rounded-full border border-line/30 px-4 py-2 text-sm text-fg transition hover:bg-glass/10 disabled:cursor-wait disabled:opacity-60';

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, { ...options, credentials: 'same-origin' });
  const result = await response.json().catch(() => ({ error: 'El backend no está disponible. Inicia npm.cmd run server.' }));
  if (!response.ok) throw new Error(result.error || 'No se pudo completar la solicitud.');
  return result;
}
const Context = createContext<{ account: Account | null; error: string; refresh: () => Promise<void>; write: <T>(path: string, body: unknown, method?: string) => Promise<T> }>({ account: null, error: '', refresh: async () => {}, write: async () => { throw new Error('Sesión no disponible'); } });
export function DriveProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try { setAccount(await api<Account>('/session')); setError(''); }
    catch (e) { setAccount(null); setError((e as Error).message); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const write = async <T,>(path: string, body: unknown, method = 'POST') => {
    if (!account) throw new Error('Recarga tu sesión antes de continuar.');
    return api<T>(path, { method, headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': account.csrf }, body: JSON.stringify(body) });
  };
  return <Context.Provider value={{ account, error, refresh, write }}>{children}</Context.Provider>;
}
export const useDrive = () => useContext(Context);
export function useVisible() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting));
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}
export function useDriveFiles(key: string, visible: boolean) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let controller: AbortController | null = null;
    let disposed = false;
    const load = async () => {
      if (document.hidden) return;
      controller?.abort();
      const request = new AbortController();
      controller = request;
      setLoading(true);
      try {
        const data = await api<{ files: DriveFile[] }>(`/destinations/${encodeURIComponent(key)}/files`, { signal: request.signal });
        if (!disposed) { setFiles(data.files); setError(''); }
      } catch (e) {
        if (!disposed && (e as Error).name !== 'AbortError') { setError((e as Error).message); setFiles([]); }
      } finally { if (!disposed && !request.signal.aborted) setLoading(false); }
    };
    void load();
    const interval = window.setInterval(() => void load(), 60000);
    const update = () => void load();
    document.addEventListener('visibilitychange', update);
    window.addEventListener('focus', update);
    window.addEventListener('cpt-files-changed', update);
    return () => { disposed = true; controller?.abort(); clearInterval(interval); document.removeEventListener('visibilitychange', update); window.removeEventListener('focus', update); window.removeEventListener('cpt-files-changed', update); };
  }, [key, visible, revision]);
  return { files, loading, error, retry: () => setRevision(n => n + 1) };
}

import { useEffect, useRef, useState } from 'react';
import { api, driveButton, useDrive, type Destination } from '@/lib/drive';
import Modal from './Modal';
import UploadFiles from './UploadFiles';

type Identity = { accounts: { id: { initialize: (options: { client_id: string; nonce: string; callback: (response: { credential: string }) => void }) => void; renderButton: (element: HTMLElement, options: Record<string, unknown>) => void; disableAutoSelect: () => void } } };
declare global { interface Window { google?: Identity } }
let identityScript: Promise<void> | null = null;
function loadIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!identityScript) identityScript = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
    script.onload = () => resolve(); script.onerror = () => { identityScript = null; script.remove(); reject(new Error('No se pudo cargar el inicio de sesión de Google.')); };
    document.head.appendChild(script);
  });
  return identityScript;
}
export default function DriveAccount() {
  const { account, error, refresh, write } = useDrive();
  const [admin, setAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const [driveStatus, setDriveStatus] = useState('Comprobando conexión con Google Drive…');
  const button = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!account) return;
    const controller = new AbortController();
    setDriveStatus('Comprobando conexión con Google Drive…');
    fetch('/api/drive/status', { signal: controller.signal, credentials: 'same-origin' })
      .then(async response => {
        const result = await response.json();
        setDriveStatus(result.state === 'connected' ? 'Google Drive conectado. Las carpetas del proyecto son accesibles.' : result.error || 'No se pudo comprobar el acceso a Drive.');
      }).catch(error => { if (error.name !== 'AbortError') setDriveStatus('No se pudo comprobar la conexión. Pulsa Actualizar sesión para reintentar.'); });
    return () => controller.abort();
  }, [account]);
  useEffect(() => {
    if (!account?.clientId || account.user) return;
    let disposed = false;
    loadIdentity().then(() => {
      if (disposed || !button.current) return;
      window.google!.accounts.id.initialize({ client_id: account.clientId, nonce: account.nonce, callback: async ({ credential }) => {
        try { await write('/login', { credential }); await refresh(); setMessage(''); }
        catch (e) { setMessage((e as Error).message); }
      } });
      button.current.replaceChildren();
      window.google!.accounts.id.renderButton(button.current, { type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', locale: 'es', width: 240 });
    }).catch(e => { if (!disposed) setMessage(e.message); });
    return () => { disposed = true; };
  }, [account?.clientId, account?.nonce, account?.user?.email]);
  return <section aria-label="Cuenta y gestión de archivos" className="mx-auto max-w-[1200px] px-6 pt-10">
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-line/20 bg-surface p-5">
      <div><h2 className="font-geist text-lg">Materiales y fotografías</h2><p className="text-sm text-fg2">Consulta los archivos en cada tema y colegio. Las cuentas autorizadas pueden contribuir.</p>
        {account?.user && <p className="mt-2 break-all text-sm">{account.user.email} · {account.role === 'admin' ? 'Administrador' : account.role === 'student' ? 'Alumno autorizado' : 'Visitante (sin permiso para subir)'}</p>}
        {account && <p role="status" className="mt-2 text-sm text-fg2">{driveStatus}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {account?.user ? <><UploadFiles />{account.role === 'admin' && <button className={driveButton} onClick={() => setAdmin(true)}>Administrar autorizaciones</button>}
          <button className={driveButton} onClick={async () => { try { await write('/logout', {}); window.google?.accounts.id.disableAutoSelect(); await refresh(); } catch (e) { setMessage((e as Error).message); } }}>Cerrar sesión</button></>
          : account?.clientId ? <div ref={button} /> : <p className="text-sm text-fg2">Inicio de sesión pendiente de configurar.</p>}
        <button className={driveButton} onClick={() => void refresh()}>Actualizar sesión</button>
      </div>
      {(error || message) && <p role="alert" className="w-full text-sm">{error || message}</p>}
    </div>
    {admin && <AdminPanel onClose={() => setAdmin(false)} />}
  </section>;
}
type Grant = { email: string; active: boolean; destinations: string[]; subject: string | null; updated_at: string };
function AdminPanel({ onClose }: { onClose: () => void }) {
  const { account, write } = useDrive();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [destinations, setDestinations] = useState<string[]>(['*']);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const load = async () => {
    setLoading(true);
    try { const data = await api<{ grants: Grant[]; administrators: string[] }>('/admin/grants'); setGrants(data.grants); setAdmins(data.administrators); setError(''); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const save = async (address: string, active: boolean, scopes: string[]) => {
    setBusy(true); setMessage('');
    try { await write('/admin/grants', { email: address, active, destinations: scopes }, 'PUT'); await load(); setMessage(`Permiso de ${address} actualizado.`); return true; }
    catch (e) { setError((e as Error).message); return false; }
    finally { setBusy(false); }
  };
  return <Modal title="Administrar autorizaciones" onClose={onClose}>
    <p className="text-sm text-fg2">Autoriza una cuenta incluso antes de su primer inicio de sesión. Estos permisos permiten subir desde esta página; no conceden acceso ni edición general a Drive.</p>
    <p className="mt-3 break-words text-sm">Administradores configurados en el servidor: {admins.join(', ') || 'Cargando…'}</p>
    <form className="my-5 space-y-3 rounded-card border border-line/20 p-4" onSubmit={async e => { e.preventDefault(); if (await save(email, true, destinations)) setEmail(''); }}>
      <label className="block">Correo de Google del alumno<input type="email" required maxLength={254} value={email} disabled={busy} onChange={e => setEmail(e.target.value)} className="cpt-input mt-2" placeholder="Correo del alumno" /></label>
      <DestinationChoices catalog={account!.catalog} value={destinations} onChange={setDestinations} disabled={busy} />
      <button className={driveButton} disabled={busy || !destinations.length}>Autorizar alumno</button>
    </form>
    {loading && <p role="status">Consultando autorizaciones…</p>}
    {error && <div role="alert"><p>{error}</p><button className={driveButton} onClick={() => void load()}>Reintentar</button></div>}
    <p role="status">{message}</p>
    {!loading && !grants.length && !error && <p>Aún no hay alumnos autorizados.</p>}
    <ul className="space-y-4">{grants.map(g => <GrantRow key={`${g.email}-${g.updated_at}`} grant={g} catalog={account!.catalog} busy={busy} save={save} />)}</ul>
  </Modal>;
}
function GrantRow({ grant, catalog, busy, save }: { grant: Grant; catalog: Destination[]; busy: boolean; save: (email: string, active: boolean, destinations: string[]) => Promise<boolean> }) {
  const [scopes, setScopes] = useState(grant.destinations);
  return <li className="rounded-card border border-line/20 p-4">
    <p className="break-all font-medium">{grant.email}</p><p className="my-2 text-sm text-fg2">{grant.active ? 'Autorizado' : 'Revocado'} · {grant.subject ? 'Identidad vinculada' : 'Pendiente de primer inicio de sesión'}</p>
    <DestinationChoices catalog={catalog} value={scopes} onChange={setScopes} disabled={busy} />
    <div className="mt-3 flex flex-wrap gap-3"><button disabled={busy} className={driveButton} onClick={() => void save(grant.email, !grant.active, scopes)}>{grant.active ? 'Revocar permiso' : 'Reactivar permiso'}</button><button disabled={busy} className={driveButton} onClick={() => void save(grant.email, grant.active, scopes)}>Guardar destinos</button></div>
  </li>;
}
function DestinationChoices({ catalog, value, onChange, disabled }: { catalog: Destination[]; value: string[]; onChange: (v: string[]) => void; disabled: boolean }) {
  return <fieldset disabled={disabled} className="rounded-ui border border-line/20 p-3"><legend>Destinos permitidos</legend>
    <label className="flex items-center gap-2"><input type="checkbox" checked={value.includes('*')} onChange={e => onChange(e.target.checked ? ['*'] : [])} />Todos los destinos del proyecto</label>
    {!value.includes('*') && <div className="mt-2 grid max-h-48 gap-2 overflow-auto sm:grid-cols-2">{catalog.map(d => <label key={d.key} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={value.includes(d.key)} onChange={e => onChange(e.target.checked ? [...value, d.key] : value.filter(k => k !== d.key))} />{d.kind === 'school' ? 'Colegio' : 'Tema'}: {d.label}</label>)}</div>}
  </fieldset>;
}

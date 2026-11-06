import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { useEffect } from 'react';
import type { DriveFile } from '../src/lib/drive';
import MaterialPlayer from '../src/components/MaterialPlayer';
import { MaterialBrowser } from '../src/components/DriveMaterials';

const fixture = vi.hoisted(() => ({ pages: 0 }));
// Navigation tests use the actual page count read from our generated multipage PDF.
// Raster rendering with PDF.js is verified separately in pdf-render.test.ts.
vi.mock('../src/components/PdfPage', () => ({
  usePdf: (url: string | null) => ({ document: url ? { numPages: fixture.pages } : undefined, retry: vi.fn() }),
  default: ({ page, onReady }: { page: number; onReady: () => void }) => {
    useEffect(() => { onReady(); }, [page]);
    return <div data-testid="pdf-page">Página PDF {page}</div>;
  },
}));
const files: DriveFile[] = [
  { id: 'pdf', name: '01 Guía.pdf', mimeType: 'application/pdf', preview: 'pdf', url: '/pdf?v=1', downloadUrl: '/pdf?download=1', thumbnail: null, modifiedTime: '1' },
  { id: 'image', name: '02 Imagen.png', mimeType: 'image/png', preview: 'image', url: '/image?v=1', downloadUrl: '/image?download=1', thumbnail: null, modifiedTime: '1' },
  { id: 'video', name: '03 Video.mp4', mimeType: 'video/mp4', preview: 'video', url: '/video', downloadUrl: '/video?download=1', thumbnail: null, modifiedTime: '1' },
  { id: 'pptx', name: '04 Presentación.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', preview: null, url: '/pptx', downloadUrl: '/pptx?download=1', thumbnail: null, modifiedTime: '1' },
];
let reduced = false;
beforeAll(async () => {
  const source = await PDFDocument.create();
  const font = await source.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 3; i++) source.addPage([640, 360]).drawText(`Slide ${i}`, { font });
  const data = await source.save();
  const { DOMMatrix, ImageData, Path2D } = await import('@napi-rs/canvas');
  Object.assign(globalThis, { DOMMatrix, ImageData, Path2D });
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = pdfjs.getDocument({ data, useSystemFonts: true, disableWorkerRendering: true });
  const pdf = await task.promise; fixture.pages = pdf.numPages; await task.destroy();
});
beforeEach(() => {
  reduced = false;
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() }) });
  vi.useFakeTimers();
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
const advance = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const next = () => fireEvent.click(screen.getByRole('button', { name: 'Página o archivo siguiente' }));

describe('presentación con PDF real de tres páginas', () => {
  it('avanza a los 10 segundos, respeta páginas y continúa con la imagen siguiente', async () => {
    render(<MaterialPlayer files={[...files].reverse()} />);
    expect(fixture.pages).toBe(3);
    expect(screen.getByText('Página 1 de 3')).toBeTruthy();
    await advance(9999); expect(screen.getByText('Página 1 de 3')).toBeTruthy();
    await advance(1); expect(screen.getByText('Página 2 de 3')).toBeTruthy();
    await advance(10000); expect(screen.getByText('Página 3 de 3')).toBeTruthy();
    await advance(10000); expect((screen.getByLabelText('Archivo') as HTMLSelectElement).value).toBe('image');
  });
  it('pausa/reanuda y reinicia los diez segundos después de navegar manualmente', async () => {
    render(<MaterialPlayer files={files} />);
    await advance(6000); next(); expect(screen.getByText('Página 2 de 3')).toBeTruthy();
    await advance(9999); expect(screen.getByText('Página 2 de 3')).toBeTruthy();
    await advance(1); expect(screen.getByText('Página 3 de 3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }));
    await advance(30000); expect(screen.getByText('Página 3 de 3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reanudar' }));
    await advance(10000); expect((screen.getByLabelText('Archivo') as HTMLSelectElement).value).toBe('image');
  });
  it('selecciona archivos, vuelve a la última página anterior y no interrumpe videos', async () => {
    render(<MaterialPlayer files={files} />);
    fireEvent.change(screen.getByLabelText('Archivo'), { target: { value: 'image' } });
    fireEvent.load(screen.getByRole('img'));
    fireEvent.click(screen.getByRole('button', { name: 'Página o archivo anterior' }));
    expect(screen.getByText('Página 3 de 3')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Archivo'), { target: { value: 'video' } });
    await advance(60000); expect((screen.getByLabelText('Archivo') as HTMLSelectElement).value).toBe('video');
    expect(document.querySelector('video')?.controls).toBe(true);
    fireEvent.change(screen.getByLabelText('Archivo'), { target: { value: 'pptx' } });
    expect(screen.getByText(/Los PPTX necesitan convertirse/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Descargar para consultar' }).getAttribute('href')).toBe('/pptx?download=1');
  });
  it('conserva archivo/página al actualizar y se recupera si se elimina el archivo', () => {
    const { rerender } = render(<MaterialPlayer files={files} />);
    next(); rerender(<MaterialPlayer files={files.map(f => ({ ...f }))} />);
    expect(screen.getByText('Página 2 de 3')).toBeTruthy();
    rerender(<MaterialPlayer files={files.filter(f => f.id !== 'pdf')} />);
    expect((screen.getByLabelText('Archivo') as HTMLSelectElement).value).toBe('image');
  });
  it('desactiva el avance con movimiento reducido, permite teclado y limpia al desmontar', async () => {
    reduced = true;
    const { unmount } = render(<MaterialPlayer files={files} />);
    await advance(30000); expect(screen.getByText('Página 1 de 3')).toBeTruthy();
    fireEvent.keyDown(screen.getByLabelText(/Contenido del material/), { key: 'ArrowRight' });
    expect(screen.getByText('Página 2 de 3')).toBeTruthy();
    unmount(); expect(vi.getTimerCount()).toBe(0);
  });
  it('el diálogo consulta solo el tema, actualiza cada minuto y cancela al cerrar recuperando foco', async () => {
    const requests: Array<{ url: string; signal: AbortSignal }> = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit) => {
      requests.push({ url, signal: options.signal as AbortSignal });
      return new Response(JSON.stringify({ files }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));
    HTMLDialogElement.prototype.showModal = function() { this.setAttribute('open', ''); this.querySelector('button')?.focus(); };
    HTMLDialogElement.prototype.close = function() { this.removeAttribute('open'); };
    const opener = document.createElement('button'); document.body.append(opener); opener.focus();
    const closed = vi.fn();
    const { unmount } = render(<MaterialBrowser title="Ciberacoso" onClose={closed} />);
    await act(async () => {});
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe('/api/destinations/material-ciberacoso/files');
    expect(screen.queryByRole('button', { name: 'Subir archivos' })).toBeNull();
    await advance(60000); expect(requests).toHaveLength(2);
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: true, cancelable: true }));
    expect(closed).toHaveBeenCalledOnce();
    unmount(); expect(requests.at(-1)!.signal.aborted).toBe(true);
    expect(document.activeElement).toBe(opener);
    await advance(60000); expect(requests).toHaveLength(2); expect(vi.getTimerCount()).toBe(0);
    opener.remove();
  });
});

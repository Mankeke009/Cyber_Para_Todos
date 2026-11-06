import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { createCanvas, DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas';
import PdfPage, { usePdf } from '../src/components/PdfPage';

const source = vi.hoisted(() => ({ bytes: new Uint8Array(), destroyed: vi.fn() }));
vi.mock('../src/lib/pdfRuntime', () => ({ loadPdf: () => {
  let task: any;
  const promise = import('pdfjs-dist/legacy/build/pdf.mjs').then(pdfjs => {
    task = pdfjs.getDocument({ data: source.bytes.slice(), useSystemFonts: true, disableWorkerRendering: true });
    return task.promise;
  });
  return { promise, destroy: async () => { source.destroyed(); await promise.catch(() => {}); await task?.destroy(); } };
} }));
beforeAll(async () => {
  Object.assign(globalThis, { DOMMatrix, ImageData, Path2D });
  const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 3; i++) pdf.addPage([640, 360]).drawText(`Slide ${i}`, { font, x: 40, y: 180 });
  source.bytes = await pdf.save();
  vi.stubGlobal('ResizeObserver', class { constructor(private callback: any) {} observe() { this.callback([{ contentRect: { width: 640, height: 360 } }]); } disconnect() {} });
});
beforeEach(() => {
  const canvases = new WeakMap<HTMLCanvasElement, ReturnType<typeof createCanvas>>();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function(this: HTMLCanvasElement) {
    if (!canvases.has(this)) canvases.set(this, createCanvas(this.width || 300, this.height || 150));
    return canvases.get(this)!.getContext('2d') as any;
  });
});
afterEach(() => cleanup());
function Harness({ page, url = '/fixture.pdf' }: { page: number; url?: string }) {
  const { document, error } = usePdf(url);
  return error ? <p>{error}</p> : document ? <PdfPage document={document} page={page} onReady={() => {}} onError={() => { throw new Error('Falló el dibujo de la página'); }} /> : <p>Cargando</p>;
}
it('el componente carga un PDF real, dibuja páginas distintas y destruye el documento al cerrar', async () => {
  const { rerender, unmount, container } = render(<Harness page={1} />);
  await screen.findByText('Slide 1');
  expect(container.querySelector('canvas')?.width).toBeGreaterThan(0);
  rerender(<Harness page={3} />);
  await screen.findByText('Slide 3');
  // Reloading a previously visited URL must not reuse a destroyed document.
  rerender(<Harness page={1} url="/second.pdf" />); await screen.findByText('Slide 1');
  rerender(<Harness page={2} url="/fixture.pdf" />); await screen.findByText('Slide 2');
  unmount();
  await waitFor(() => expect(source.destroyed).toHaveBeenCalledTimes(3));
});

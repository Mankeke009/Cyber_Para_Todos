import { useEffect, useMemo, useRef, useState } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

export function usePdf(url: string | null) {
  const [result, setResult] = useState<{ request: object; document?: PDFDocumentProxy; error?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const request = useMemo(() => ({ url }), [url, attempt]);
  useEffect(() => {
    if (!url) return;
    let disposed = false;
    let task: ReturnType<typeof import('@/lib/pdfRuntime').loadPdf> | undefined;
    void import('@/lib/pdfRuntime').then(({ loadPdf }) => {
      if (disposed) return;
      task = loadPdf(url);
      return task.promise.then(document => { if (!disposed) setResult({ request, document }); });
    }).catch(() => { if (!disposed) setResult({ request, error: 'No se pudo abrir el PDF. Comprueba el archivo o descarga una copia para consultarlo.' }); });
    return () => { disposed = true; void task?.destroy().catch(() => {}); };
  }, [request]);
  const current = result?.request === request ? result : null;
  return { document: current?.document, error: current?.error, retry: () => { setResult(null); setAttempt(n => n + 1); } };
}

export default function PdfPage({ document: pdf, page, onReady, onError }: { document: PDFDocumentProxy; page: number; onReady: () => void; onError: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 500 });
  const [text, setText] = useState('');
  const ready = useRef(onReady), error = useRef(onError);
  ready.current = onReady; error.current = onError;
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) setSize({ width, height });
    });
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let disposed = false;
    let rendering: RenderTask | undefined;
    const container = host.current!;
    container.replaceChildren(); setText('');
    void pdf.getPage(page).then(async pdfPage => {
      if (disposed) return;
      const original = pdfPage.getViewport({ scale: 1 });
      const scale = Math.min(size.width / original.width, size.height / original.height);
      const viewport = pdfPage.getViewport({ scale });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width * ratio); canvas.height = Math.ceil(viewport.height * ratio);
      canvas.style.width = `${viewport.width}px`; canvas.style.height = `${viewport.height}px`;
      canvas.setAttribute('aria-hidden', 'true'); canvas.className = 'cpt-slide-enter';
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas no disponible');
      rendering = pdfPage.render({ canvas: null, canvasContext: context, viewport, transform: [ratio, 0, 0, ratio, 0, 0] });
      await rendering.promise;
      if (disposed) return;
      container.replaceChildren(canvas);
      ready.current();
      const content = await pdfPage.getTextContent();
      if (!disposed) setText(content.items.map(item => 'str' in item ? item.str : '').join(' '));
    }).catch(e => { if (!disposed && e.name !== 'RenderingCancelledException') error.current(); });
    return () => { disposed = true; rendering?.cancel(); container.replaceChildren(); };
  }, [pdf, page, size.width, size.height]);
  return <><div ref={host} className="cpt-presentation-stage" role="img" aria-label={`Página ${page} del documento`} /><div className="sr-only" aria-label={`Texto de la página ${page}`}>{text || 'Esta página no contiene texto extraíble. Consulta su contenido visual o descarga el documento.'}</div></>;
}

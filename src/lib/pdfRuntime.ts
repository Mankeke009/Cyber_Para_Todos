import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;
export function loadPdf(url: string) {
  return getDocument({ url, useSystemFonts: true, disableWorkerRendering: true,
    cMapUrl: '/pdfjs-assets/cmaps/', cMapPacked: true, standardFontDataUrl: '/pdfjs-assets/standard_fonts/', wasmUrl: '/pdfjs-assets/wasm/' });
}

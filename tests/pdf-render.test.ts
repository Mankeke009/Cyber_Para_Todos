// @vitest-environment node
import { expect, it } from 'vitest';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createCanvas, DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas';

it('PDF.js lee y dibuja por separado las tres páginas de un PDF real', async () => {
  Object.assign(globalThis, { DOMMatrix, ImageData, Path2D });
  const source = await PDFDocument.create();
  const font = await source.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 3; i++) {
    const page = source.addPage([640, 360]);
    page.drawRectangle({ x: 0, y: 0, width: 640, height: 360, color: rgb(i / 4, .2, .4) });
    page.drawText(`Slide ${i}`, { font, x: 60, y: 180, size: 36 });
  }
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = pdfjs.getDocument({ data: await source.save(), useSystemFonts: true, disableWorkerRendering: true });
  try {
    const document = await task.promise; expect(document.numPages).toBe(3);
    const rasters = [];
    for (let i = 1; i <= 3; i++) {
      const page = await document.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      const canvas = createCanvas(viewport.width, viewport.height);
      await page.render({ canvas: null, canvasContext: canvas.getContext('2d') as unknown as CanvasRenderingContext2D, viewport }).promise;
      expect((await page.getTextContent()).items.some(item => 'str' in item && item.str === `Slide ${i}`)).toBe(true);
      rasters.push(canvas.toBuffer('image/png'));
    }
    expect(rasters[0].equals(rasters[1])).toBe(false);
    expect(rasters[1].equals(rasters[2])).toBe(false);
  } finally { await task.destroy(); }
});

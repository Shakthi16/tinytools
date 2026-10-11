import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import {
  FilePlus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Download,
  Scissors,
  FileSignature,
  Eraser,
  Check,
  ShieldCheck,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';
import { downloadBlob } from '@/lib/tools/files';
import { formatBytes } from '@/lib/tools/image';

export function PdfWorkspace({ id }: { id: string }) {
  if (id === 'pdf-merge') return <PdfMergeView />;
  if (id === 'pdf-split') return <PdfSplitView />;
  if (id === 'images-to-pdf') return <ImagesToPdfView />;
  if (id === 'pdf-sign') return <PdfSignView />;

  return <PdfMergeView />;
}

// ---------------------------------------------------------------------------
// 1. PDF MERGE VIEW
// ---------------------------------------------------------------------------
interface MergeFileItem {
  id: string;
  file: File;
  pageCount: number;
}

function PdfMergeView() {
  const [items, setItems] = useState<MergeFileItem[]>([]);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    if (files.length === 0) return;

    setError('');
    const newItems: MergeFileItem[] = [];

    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          pageCount: pdf.getPageCount(),
        });
      } catch {
        setError(`Could not read "${file.name}". Is it password-protected?`);
      }
    }

    setItems((prev) => [...prev, ...newItems]);
    e.target.value = '';
  }

  function moveItem(index: number, direction: 'up' | 'down') {
    setItems((prev) => {
      const copy = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= copy.length) return prev;
      const [moved] = copy.splice(index, 1);
      if (moved) copy.splice(target, 0, moved);
      return copy;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function mergePdfs() {
    if (items.length < 2) {
      toast.error('Add at least 2 PDF files to merge.');
      return;
    }

    setMerging(true);
    setError('');

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of items) {
        const buffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(buffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
      downloadBlob(blob, `merged-document-${Date.now()}.pdf`);
      toast.success(`Merged ${items.length} PDFs into a single file!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge PDF files.');
    } finally {
      setMerging(false);
    }
  }

  const totalPages = items.reduce((acc, curr) => acc + curr.pageCount, 0);

  return (
    <div className="tool-panel">
      <label className="dropzone flex flex-col items-center gap-3 cursor-pointer">
        <FilePlus size={32} />
        <strong>Choose or drop PDF files to combine</strong>
        <span className="text-sm text-muted-foreground">
          Combined 100% in your browser · No files uploaded
        </span>
        <input
          type="file"
          accept="application/pdf"
          multiple
          className="sr-only"
          onChange={handleFileChange}
        />
      </label>

      {items.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 text-sm font-mono text-muted-foreground">
            <span>
              {items.length} files ({totalPages} total pages)
            </span>
            <Button variant="ghost" size="sm" onClick={() => setItems([])}>
              Clear all
            </Button>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 bg-background border-1.5 border-border rounded-md shadow-[2px_2px_0_var(--foreground)]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold w-6 text-center text-muted-foreground">
                    #{index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.pageCount} page{item.pageCount === 1 ? '' : 's'} ·{' '}
                      {formatBytes(item.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => moveItem(index, 'up')}
                    aria-label="Move up"
                  >
                    <ArrowUp size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, 'down')}
                    aria-label="Move down"
                  >
                    <ArrowDown size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    aria-label="Remove"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="control-row mt-6">
            <Button variant="tool" disabled={merging || items.length < 2} onClick={mergePdfs}>
              <Download />
              {merging ? 'Merging in browser…' : `Merge ${items.length} PDFs`}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="error-note" role="alert">
          {error}
        </p>
      )}

      <p className="text-xs text-muted-foreground mt-6 flex items-center gap-2">
        <ShieldCheck size={14} /> Processed directly with PDF-Lib in WebAssembly/JS.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. PDF SPLIT & EXTRACT VIEW
// ---------------------------------------------------------------------------
function PdfSplitView() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rangeInput, setRangeInput] = useState('');
  const [splitting, setSplitting] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0];
    if (!next) return;
    setError('');

    try {
      const buffer = await next.arrayBuffer();
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = pdf.getPageCount();
      setFile(next);
      setPageCount(count);
      setRangeInput(`1-${Math.min(count, 3)}`);
    } catch {
      setError('Could not open this PDF. It may be encrypted or corrupted.');
    }
  }

  function parsePageRange(rangeStr: string, max: number): number[] {
    const pages = new Set<number>();
    const parts = rangeStr.split(',').map((p) => p.trim());

    for (const part of parts) {
      if (!part) continue;
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr || '1', 10);
        const end = parseInt(endStr || `${max}`, 10);
        if (!isNaN(start) && !isNaN(end)) {
          for (let p = Math.max(1, start); p <= Math.min(max, end); p++) {
            pages.add(p - 1); // 0-indexed
          }
        }
      } else {
        const single = parseInt(part, 10);
        if (!isNaN(single) && single >= 1 && single <= max) {
          pages.add(single - 1);
        }
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  }

  async function splitPdf() {
    if (!file) return;
    const pageIndices = parsePageRange(rangeInput, pageCount);
    if (pageIndices.length === 0) {
      setError(`Please specify valid pages between 1 and ${pageCount}.`);
      return;
    }

    setSplitting(true);
    setError('');

    try {
      const buffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buffer);
      const newDoc = await PDFDocument.create();

      const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
      copiedPages.forEach((page) => newDoc.addPage(page));

      const bytes = await newDoc.save();
      const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
      downloadBlob(blob, `${file.name.replace(/\.pdf$/i, '')}-extracted.pdf`);
      toast.success(`Extracted ${copiedPages.length} pages successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to split PDF.');
    } finally {
      setSplitting(false);
    }
  }

  return (
    <div className="tool-panel">
      <label className="dropzone flex flex-col items-center gap-3 cursor-pointer">
        <Scissors size={32} />
        <strong>{file ? file.name : 'Choose a PDF to extract pages from'}</strong>
        <span className="text-sm text-muted-foreground">
          {pageCount > 0 ? `${pageCount} pages detected` : 'Extract specific pages or page ranges'}
        </span>
        <input type="file" accept="application/pdf" className="sr-only" onChange={handleFile} />
      </label>

      {file && (
        <div className="mt-6 max-w-lg space-y-4">
          <label className="field">
            Page numbers or ranges to extract
            <input
              type="text"
              className="form-input font-mono"
              placeholder="e.g. 1-3, 5, 8-10"
              value={rangeInput}
              onChange={(e) => setRangeInput(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">
              Total pages available: 1 to {pageCount}. Comma separated.
            </span>
          </label>

          <div className="control-row">
            <Button variant="tool" disabled={splitting} onClick={splitPdf}>
              <Download />
              {splitting ? 'Extracting…' : 'Download Extracted PDF'}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="error-note" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. IMAGES TO PDF CONVERTER
// ---------------------------------------------------------------------------
function ImagesToPdfView() {
  const [images, setImages] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Fit'>('A4');
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState('');

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    setImages((prev) => [...prev, ...files]);
    e.target.value = '';
  }

  async function convertToPdf() {
    if (images.length === 0) return;
    setBuilding(true);
    setError('');

    try {
      const pdf = await PDFDocument.create();

      for (const imgFile of images) {
        const buffer = await imgFile.arrayBuffer();
        let embeddedImage;

        if (imgFile.type === 'image/jpeg' || imgFile.name.toLowerCase().endsWith('.jpg')) {
          embeddedImage = await pdf.embedJpg(buffer);
        } else {
          // PNG or Canvas convert
          embeddedImage = await pdf.embedPng(buffer);
        }

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        let pageWidth = imgWidth;
        let pageHeight = imgHeight;

        if (pageSize === 'A4') {
          pageWidth = 595.28;
          pageHeight = 841.89;
        } else if (pageSize === 'Letter') {
          pageWidth = 612;
          pageHeight = 792;
        }

        const page = pdf.addPage([pageWidth, pageHeight]);

        if (pageSize === 'Fit') {
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: imgWidth,
            height: imgHeight,
          });
        } else {
          const margin = 36; // 0.5 inch
          const maxW = pageWidth - margin * 2;
          const maxH = pageHeight - margin * 2;
          const scale = Math.min(maxW / imgWidth, maxH / imgHeight, 1);
          const drawW = imgWidth * scale;
          const drawH = imgHeight * scale;
          const x = (pageWidth - drawW) / 2;
          const y = (pageHeight - drawH) / 2;

          page.drawImage(embeddedImage, {
            x,
            y,
            width: drawW,
            height: drawH,
          });
        }
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
      downloadBlob(blob, `images-document-${Date.now()}.pdf`);
      toast.success(`Generated PDF with ${images.length} pages!`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to convert images. Ensure they are PNG or JPG.'
      );
    } finally {
      setBuilding(false);
    }
  }

  return (
    <div className="tool-panel">
      <label className="dropzone flex flex-col items-center gap-3 cursor-pointer">
        <ImageIcon size={32} />
        <strong>Choose PNG or JPG photos to convert into PDF</strong>
        <span className="text-sm text-muted-foreground">
          {images.length > 0
            ? `${images.length} images selected`
            : 'Convert receipts, notes, and photos into a document'}
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg"
          multiple
          className="sr-only"
          onChange={handleFiles}
        />
      </label>

      {images.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="control-row">
            <span className="text-sm font-medium">Page format:</span>
            {(['A4', 'Letter', 'Fit'] as const).map((size) => (
              <Button
                key={size}
                variant={pageSize === size ? 'tool' : 'tab'}
                onClick={() => setPageSize(size)}
              >
                {size === 'Fit' ? 'Fit to photo' : size}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImages([])}
              className="ml-auto"
            >
              Clear
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-2 bg-muted/40 rounded border border-border">
            {images.map((img, i) => (
              <div key={i} className="text-xs truncate bg-background p-2 rounded border border-border">
                <span className="font-mono text-muted-foreground mr-1">#{i + 1}</span>
                {img.name}
              </div>
            ))}
          </div>

          <div className="control-row">
            <Button variant="tool" disabled={building} onClick={convertToPdf}>
              <Download />
              {building ? 'Building PDF…' : `Convert ${images.length} Images to PDF`}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="error-note" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. PDF SIGN & ANNOTATE VIEW
// ---------------------------------------------------------------------------
function PdfSignView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [penColor, setPenColor] = useState('#000000');
  const [penWidth, setPenWidth] = useState(3);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function downloadSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (mode === 'type') {
      // Render typed text to temporary canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 600;
      tempCanvas.height = 200;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = penColor;
        ctx.font = 'italic 54px "Brush Script MT", "Caveat", "Segoe Script", cursive';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName || 'Your Signature', 300, 100);
        tempCanvas.toBlob((blob) => {
          if (blob) downloadBlob(blob, 'signature.png');
        });
      }
      return;
    }

    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, 'signature.png');
        toast.success('Signature saved as transparent PNG!');
      }
    });
  }

  return (
    <div className="tool-panel">
      <div className="control-row mb-4">
        <Button variant={mode === 'draw' ? 'tool' : 'tab'} onClick={() => setMode('draw')}>
          Draw Signature
        </Button>
        <Button variant={mode === 'type' ? 'tool' : 'tab'} onClick={() => setMode('type')}>
          Type Signature
        </Button>
      </div>

      {mode === 'draw' ? (
        <div className="space-y-4">
          <div className="border-2 border-border rounded-lg bg-card overflow-hidden shadow-[4px_4px_0_var(--foreground)]">
            <canvas
              ref={canvasRef}
              width={600}
              height={220}
              className="w-full max-w-[600px] h-[220px] bg-background cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          <div className="control-row">
            <label className="flex items-center gap-2 text-xs font-mono">
              Color:
              <input
                type="color"
                value={penColor}
                onChange={(e) => setPenColor(e.target.value)}
                className="size-8 p-0.5 border border-border rounded"
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-mono">
              Stroke:
              <input
                type="range"
                min="1"
                max="8"
                value={penWidth}
                onChange={(e) => setPenWidth(Number(e.target.value))}
                className="w-24"
              />
            </label>
            <Button variant="ghost" size="sm" onClick={clearCanvas}>
              <Eraser size={14} /> Clear
            </Button>
            <Button variant="tool" onClick={downloadSignature}>
              <Download /> Download Transparent PNG
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-w-lg">
          <label className="field">
            Type your full name or initials
            <input
              type="text"
              className="form-input text-xl"
              placeholder="e.g. Johnathan Doe"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
            />
          </label>

          <div className="p-8 border-2 border-border rounded-lg bg-background text-center shadow-[4px_4px_0_var(--foreground)]">
            <span
              style={{ color: penColor }}
              className="text-4xl italic font-serif select-none"
            >
              {typedName || 'Your Signature Preview'}
            </span>
          </div>

          <div className="control-row">
            <label className="flex items-center gap-2 text-xs font-mono">
              Ink Color:
              <input
                type="color"
                value={penColor}
                onChange={(e) => setPenColor(e.target.value)}
                className="size-8 p-0.5 border border-border rounded"
              />
            </label>
            <Button variant="tool" onClick={downloadSignature}>
              <Download /> Download Typed Signature
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-6 flex items-center gap-2">
        <ShieldCheck size={14} /> Signatures are created on your device and never stored on any server.
      </p>
    </div>
  );
}

import { useState, useRef, useEffect, useMemo, type ChangeEvent } from 'react';
import {
  ImagePlus,
  Download,
  QrCode,
  Sparkles,
  Layers,
  Copy,
  Scissors,
  Check,
  RefreshCw,
  Fingerprint,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { downloadBlob, loadImage } from '@/lib/tools/files';
import { formatBytes } from '@/lib/tools/image';

export function MediaExtendedWorkspace({ id }: { id: string }) {
  if (id === 'image-compressor') return <ImageCompressorView />;
  if (id === 'qr-generator') return <QrGeneratorView />;
  if (id === 'passport-photo') return <PassportPhotoView />;

  return <ImageCompressorView />;
}

// ---------------------------------------------------------------------------
// 1. TARGET KB IMAGE COMPRESSOR
// ---------------------------------------------------------------------------
function ImageCompressorView() {
  const [file, setFile] = useState<File | null>(null);
  const [targetKb, setTargetKb] = useState<number>(100);
  const [compressing, setCompressing] = useState(false);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedUrl, setCompressedUrl] = useState('');
  const [stats, setStats] = useState<{ quality: number; bytes: number } | null>(null);
  const [error, setError] = useState('');

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0];
    if (!next) return;
    setFile(next);
    setCompressedBlob(null);
    setCompressedUrl('');
    setStats(null);
    setError('');
  }

  async function compressToTarget() {
    if (!file) return;
    setCompressing(true);
    setError('');

    try {
      const img = await loadImage(file);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas');
      ctx.drawImage(img, 0, 0);

      const targetBytes = targetKb * 1024;
      let minQ = 0.05;
      let maxQ = 0.98;
      let bestBlob: Blob | null = null;
      let bestQuality = 0.8;

      // Binary search for optimal JPEG quality to achieve target size
      for (let i = 0; i < 7; i++) {
        const midQ = (minQ + maxQ) / 2;
        const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', midQ));

        if (blob.size <= targetBytes) {
          bestBlob = blob;
          bestQuality = midQ;
          minQ = midQ; // try slightly higher quality
        } else {
          maxQ = midQ; // reduce quality
        }
      }

      // If still too large at minimum quality, scale dimensions down
      if (!bestBlob || bestBlob.size > targetBytes) {
        let scale = Math.sqrt(targetBytes / (bestBlob?.size || targetBytes * 2));
        scale = Math.max(0.2, Math.min(0.9, scale));
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        bestBlob = await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.7));
        bestQuality = 0.7;
      }

      if (!bestBlob) {
        throw new Error('Could not compress image to target size.');
      }

      if (compressedUrl) URL.revokeObjectURL(compressedUrl);
      const url = URL.createObjectURL(bestBlob);
      setCompressedBlob(bestBlob);
      setCompressedUrl(url);
      setStats({ quality: Math.round(bestQuality * 100), bytes: bestBlob.size });
      toast.success(`Compressed to ${formatBytes(bestBlob.size)}!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression failed.');
    } finally {
      setCompressing(false);
    }
  }

  return (
    <div className="tool-panel">
      <label className="dropzone flex flex-col items-center gap-3 cursor-pointer">
        <ImagePlus size={32} />
        <strong>{file ? file.name : 'Choose an image to compress'}</strong>
        <span className="text-sm text-muted-foreground">
          {file ? `Original: ${formatBytes(file.size)}` : 'Hit exact upload caps: 50 KB, 100 KB, 200 KB'}
        </span>
        <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
      </label>

      {file && (
        <div className="mt-6 space-y-4 max-w-lg">
          <div className="control-row">
            <span className="text-sm font-medium">Target Cap:</span>
            {[50, 100, 200, 500].map((kb) => (
              <Button
                key={kb}
                variant={targetKb === kb ? 'tool' : 'tab'}
                onClick={() => setTargetKb(kb)}
              >
                {kb} KB
              </Button>
            ))}
          </div>

          <label className="field">
            Or custom size in KB
            <input
              type="number"
              min={10}
              max={10000}
              className="form-input font-mono"
              value={targetKb}
              onChange={(e) => setTargetKb(Number(e.target.value))}
            />
          </label>

          <Button variant="tool" disabled={compressing} onClick={compressToTarget}>
            {compressing ? 'Compressing…' : `Compress to under ${targetKb} KB`}
          </Button>

          {stats && compressedBlob && (
            <div className="p-4 bg-background border-2 border-border rounded-lg shadow-[4px_4px_0_var(--foreground)] flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-lg text-emerald-600">{formatBytes(stats.bytes)}</p>
                <p className="text-xs text-muted-foreground">
                  Saved {Math.round((1 - stats.bytes / file.size) * 100)}% of original size ({stats.quality}% quality)
                </p>
              </div>
              <Button
                variant="paper"
                onClick={() => downloadBlob(compressedBlob, `${file.name.replace(/\.[^.]+$/, '')}-${targetKb}kb.jpg`)}
              >
                <Download size={16} /> Download JPEG
              </Button>
            </div>
          )}
        </div>
      )}

      {error && <p className="error-note mt-3">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. QR CODE GENERATOR & CUSTOMIZER
// ---------------------------------------------------------------------------
function QrGeneratorView() {
  const [text, setText] = useState('https://tinytools.dev');
  const [fgColor, setFgColor] = useState('#1b1c1e');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [mode, setMode] = useState<'url' | 'wifi' | 'upi'>('url');

  // Wi-Fi inputs
  const [ssid, setSsid] = useState('HomeNetwork');
  const [wifiPass, setWifiPass] = useState('password123');

  // UPI inputs
  const [upiVpa, setUpiVpa] = useState('name@upi');
  const [upiName, setUpiName] = useState('John Doe');
  const [upiAmount, setUpiAmount] = useState('500');

  const finalPayload = useMemo(() => {
    if (mode === 'wifi') {
      return `WIFI:S:${ssid};T:WPA;P:${wifiPass};;`;
    }
    if (mode === 'upi') {
      return `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(upiName)}&am=${encodeURIComponent(
        upiAmount
      )}&cu=INR`;
    }
    return text;
  }, [mode, text, ssid, wifiPass, upiVpa, upiName, upiAmount]);

  useEffect(() => {
    if (!finalPayload.trim()) {
      setQrDataUrl('');
      return;
    }
    void (async () => {
      try {
        const url = await QRCode.toDataURL(finalPayload, {
          width: 512,
          margin: 2,
          color: {
            dark: fgColor,
            light: bgColor,
          },
          errorCorrectionLevel: 'M',
        });
        setQrDataUrl(url);
      } catch {
        setQrDataUrl('');
      }
    })();
  }, [finalPayload, fgColor, bgColor]);

  function downloadQrPng() {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'qrcode.png';
    a.click();
    toast.success('Downloaded QR code PNG!');
  }

  return (
    <div className="tool-panel">
      <div className="control-row mb-4">
        <Button variant={mode === 'url' ? 'tool' : 'tab'} onClick={() => setMode('url')}>
          URL / Text
        </Button>
        <Button variant={mode === 'wifi' ? 'tool' : 'tab'} onClick={() => setMode('wifi')}>
          Wi-Fi Network
        </Button>
        <Button variant={mode === 'upi' ? 'tool' : 'tab'} onClick={() => setMode('upi')}>
          UPI Payment
        </Button>
      </div>

      <div className="editor-grid">
        <div className="space-y-4">
          {mode === 'url' && (
            <label className="field">
              Target URL or Plain Text
              <textarea
                className="editor min-h-[140px]"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="https://yourlink.com"
              />
            </label>
          )}

          {mode === 'wifi' && (
            <div className="space-y-3">
              <label className="field">
                Network Name (SSID)
                <input
                  type="text"
                  className="form-input"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                />
              </label>
              <label className="field">
                Wi-Fi Password
                <input
                  type="text"
                  className="form-input font-mono"
                  value={wifiPass}
                  onChange={(e) => setWifiPass(e.target.value)}
                />
              </label>
            </div>
          )}

          {mode === 'upi' && (
            <div className="space-y-3">
              <label className="field">
                UPI ID (VPA)
                <input
                  type="text"
                  className="form-input font-mono"
                  placeholder="e.g. name@okaxis"
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value)}
                />
              </label>
              <label className="field">
                Payee Name
                <input
                  type="text"
                  className="form-input"
                  value={upiName}
                  onChange={(e) => setUpiName(e.target.value)}
                />
              </label>
              <label className="field">
                Amount (INR ₹)
                <input
                  type="number"
                  className="form-input"
                  value={upiAmount}
                  onChange={(e) => setUpiAmount(e.target.value)}
                />
              </label>
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 text-xs font-mono">
              Pattern:
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="size-8 p-0.5 border border-border rounded"
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-mono">
              Background:
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="size-8 p-0.5 border border-border rounded"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-6 border-2 border-border rounded-lg bg-background shadow-[4px_4px_0_var(--foreground)]">
          {qrDataUrl ? (
            <div className="space-y-4 text-center">
              <img src={qrDataUrl} alt="Generated QR code" className="size-56 object-contain rounded mx-auto" />
              <Button variant="tool" onClick={downloadQrPng}>
                <Download size={16} /> Download High-Res PNG
              </Button>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
              <QrCode size={40} />
              <span>Enter payload to generate QR code</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. PASSPORT & ID PHOTO MAKER (4x6 PRINT SHEET)
// ---------------------------------------------------------------------------
function PassportPhotoView() {
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<'US' | 'India' | 'Schengen'>('US');
  const [previewUrl, setPreviewUrl] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [generating, setGenerating] = useState(false);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0];
    if (!next) return;
    setFile(next);
    setSheetUrl('');
  }

  async function generatePrintSheet() {
    if (!file) return;
    setGenerating(true);

    try {
      const img = await loadImage(file);

      // Passport photo dimensions in pixels at 300 DPI:
      // US Visa: 2x2 inches = 600x600 px
      // India / Schengen: 35x45 mm = ~413 x 531 px
      let photoW = 600;
      let photoH = 600;

      if (preset === 'India' || preset === 'Schengen') {
        photoW = 413;
        photoH = 531;
      }

      // Crop photo into required aspect ratio (centered)
      const singleCanvas = document.createElement('canvas');
      singleCanvas.width = photoW;
      singleCanvas.height = photoH;
      const sCtx = singleCanvas.getContext('2d')!;

      const targetAspect = photoW / photoH;
      const srcAspect = img.naturalWidth / img.naturalHeight;
      let sx = 0,
        sy = 0,
        sw = img.naturalWidth,
        sh = img.naturalHeight;

      if (srcAspect > targetAspect) {
        sw = img.naturalHeight * targetAspect;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / targetAspect;
        sy = (img.naturalHeight - sh) / 2;
      }

      sCtx.drawImage(img, sx, sy, sw, sh, 0, 0, photoW, photoH);
      sCtx.strokeStyle = '#cccccc';
      sCtx.lineWidth = 2;
      sCtx.strokeRect(0, 0, photoW, photoH);

      // Now create standard 4x6 inch print sheet at 300 DPI = 1800 x 1200 px
      const sheetCanvas = document.createElement('canvas');
      sheetCanvas.width = 1800;
      sheetCanvas.height = 1200;
      const ctx = sheetCanvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1800, 1200);

      // Tile 2 rows x 3 columns or 2x2
      const cols = preset === 'US' ? 2 : 3;
      const rows = 2;
      const startX = (1800 - cols * (photoW + 60) + 60) / 2;
      const startY = (1200 - rows * (photoH + 50) + 50) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = startX + c * (photoW + 60);
          const y = startY + r * (photoH + 50);
          ctx.drawImage(singleCanvas, x, y, photoW, photoH);
        }
      }

      const blob = await new Promise<Blob>((res) => sheetCanvas.toBlob((b) => res(b!), 'image/jpeg', 0.95));
      const url = URL.createObjectURL(blob);
      setSheetUrl(url);
      toast.success('Generated 4×6 inch printable sheet!');
    } catch {
      toast.error('Failed to create passport sheet.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="tool-panel">
      <label className="dropzone flex flex-col items-center gap-3 cursor-pointer">
        <Fingerprint size={32} />
        <strong>{file ? file.name : 'Upload portrait photo'}</strong>
        <span className="text-sm text-muted-foreground">
          Auto-crop to passport specs & tile onto a standard 4×6 print sheet
        </span>
        <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
      </label>

      {file && (
        <div className="mt-6 space-y-4">
          <div className="control-row">
            <span className="text-sm font-medium">Country Specification:</span>
            <Button
              variant={preset === 'US' ? 'tool' : 'tab'}
              onClick={() => setPreset('US')}
            >
              US Visa / Passport (2×2")
            </Button>
            <Button
              variant={preset === 'India' ? 'tool' : 'tab'}
              onClick={() => setPreset('India')}
            >
              India Passport / OCI (35×45mm)
            </Button>
            <Button
              variant={preset === 'Schengen' ? 'tool' : 'tab'}
              onClick={() => setPreset('Schengen')}
            >
              Schengen / EU / UK (35×45mm)
            </Button>
          </div>

          <Button variant="tool" disabled={generating} onClick={generatePrintSheet}>
            {generating ? 'Processing…' : 'Generate 4×6" Print Sheet'}
          </Button>

          {sheetUrl && (
            <div className="p-4 border-2 border-border rounded-lg bg-background shadow-[4px_4px_0_var(--foreground)] space-y-4 text-center">
              <img
                src={sheetUrl}
                alt="4x6 inch passport photos sheet"
                className="max-h-72 object-contain mx-auto rounded border border-border"
              />
              <Button
                variant="paper"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = sheetUrl;
                  a.download = `passport-photo-4x6-${preset}.jpg`;
                  a.click();
                }}
              >
                <Download size={16} /> Download 4×6 Print Sheet (JPEG)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Copy, Download, RotateCcw, Shapes, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadBlob } from '@/lib/tools/files';

export function DeveloperWorkspace({ id }: { id: string }) {
  const [radius, setRadius] = useState(24);
  const [emoji, setEmoji] = useState('✨');
  const [background, setBackground] = useState('#FDE047');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function copySvg() {
    const value = svgMarkup(emoji, background);
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setError('Clipboard unavailable. Download the SVG instead.');
    }
  }

  if (id === 'border-radius') return <div className="tool-panel"><div className="radius-stage"><div className="radius-shape" style={{ borderRadius: `${radius}px` }} /></div><div className="control-row"><label className="field flex-1">Corner radius: {radius} px<input aria-label="Corner radius" type="range" min={0} max={100} value={radius} onChange={(event) => setRadius(Number(event.target.value))} /></label><Button variant="paper" onClick={() => setRadius(24)}><RotateCcw />Reset</Button></div><div className="result-box"><code className="break-all">border-radius: {radius}px;</code><Button className="ml-4" variant="paper" size="sm" onClick={() => void navigator.clipboard.writeText(`border-radius: ${radius}px;`)}><Copy />Copy CSS</Button></div></div>;

  return <div className="tool-panel"><div className="editor-grid"><label className="field">Choose an emoji<input className="form-input text-3xl" maxLength={4} value={emoji} onChange={(event) => { setEmoji(event.target.value || '✨'); setCopied(false); }} /></label><label className="field">Background color<input className="form-input h-14 p-1" type="color" value={background} onChange={(event) => { setBackground(event.target.value); setCopied(false); }} /></label></div><div className="result-box mt-6 flex min-h-40 items-center justify-center" style={{ backgroundColor: background }}><span aria-label={`Favicon preview ${emoji}`} className="text-8xl">{emoji}</span></div><div className="control-row"><Button variant="tool" onClick={() => downloadBlob(new Blob([svgMarkup(emoji, background)], { type: 'image/svg+xml' }), 'emoji-favicon.svg')}><Download />Download SVG favicon</Button><Button variant="paper" onClick={() => void copySvg()}><Copy />{copied ? 'Copied SVG' : 'Copy SVG code'}</Button></div>{error && <p className="error-note" role="alert">{error}</p>}<p className="text-sm text-muted-foreground">The SVG scales cleanly in browser tabs and is ready to add as a site icon.</p><Shapes className="sr-only" /><Smile className="sr-only" /></div>;
}

function svgMarkup(emoji: string, background: string) {
  const safeEmoji = emoji.replace(/[&<>"']/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="${background}"/><text x="32" y="47" text-anchor="middle" font-size="42">${safeEmoji}</text></svg>`;
}
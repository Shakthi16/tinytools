import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Copy,
  Trash2,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Download,
  Check,
  ExternalLink,
  Clock,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal,
  Layers,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  characterCount,
  cleanMarkdown,
  splitThread,
  transformText,
  TIKTOK_LIMIT,
  getWordCountStats,
  getTopKeywords,
  cleanLinkDetailed,
} from '@/lib/tools/text';
import { downloadBlob } from '@/lib/tools/files';

export async function copyText(t: string, label = 'Copied to clipboard') {
  try {
    await navigator.clipboard.writeText(t);
    toast.success(label);
  } catch {
    toast.error('Clipboard unavailable. Select text manually to copy.');
  }
}

export function TextWorkspace({ id }: { id: string }) {
  if (id === 'word-counter') return <WordCounterView />;
  if (id === 'markdown-rich') return <MarkdownRichView />;
  if (id === 'link-cleaner') return <LinkCleanerView />;

  return <GenericTextWorkspace id={id} />;
}

// -------------------------------------------------------------
// 1. WORD & CHARACTER COUNTER VIEW
// -------------------------------------------------------------
function WordCounterView() {
  const [text, setText] = useState('');
  const [readingWpm, setReadingWpm] = useState(250);
  const [speakingWpm, setSpeakingWpm] = useState(130);
  const [targetLimit, setTargetLimit] = useState<number | ''>('');
  const [ngram, setNgram] = useState<1 | 2 | 3>(1);
  const [ignoreStopWords, setIgnoreStopWords] = useState(true);
  const [selectionStats, setSelectionStats] = useState<{ words: number; chars: number } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stats = useMemo(
    () => getWordCountStats(text, readingWpm, speakingWpm),
    [text, readingWpm, speakingWpm]
  );

  const keywords = useMemo(
    () => getTopKeywords(text, ngram, ignoreStopWords),
    [text, ngram, ignoreStopWords]
  );

  function handleSelect() {
    const el = textareaRef.current;
    if (!el) return;
    const selected = el.value.substring(el.selectionStart, el.selectionEnd);
    if (selected && selected.trim().length > 0) {
      const selStats = getWordCountStats(selected);
      setSelectionStats({ words: selStats.words, chars: selStats.characters });
    } else {
      setSelectionStats(null);
    }
  }

  const limitNumber = Number(targetLimit);
  const isOverLimit = limitNumber > 0 && stats.words > limitNumber;
  const progressPercent = limitNumber > 0 ? Math.min(100, Math.round((stats.words / limitNumber) * 100)) : 0;

  return (
    <div className="tool-panel">
      {/* Top Live Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pb-6 border-b-2 border-border">
        <div className="p-3 bg-primary rounded border border-border">
          <span className="text-xs font-mono uppercase text-muted-foreground block">Words</span>
          <strong className="text-3xl font-display">{stats.words.toLocaleString()}</strong>
        </div>
        <div className="p-3 bg-background rounded border border-border">
          <span className="text-xs font-mono uppercase text-muted-foreground block">Characters</span>
          <strong className="text-3xl font-display">{stats.characters.toLocaleString()}</strong>
        </div>
        <div className="p-3 bg-background rounded border border-border">
          <span className="text-xs font-mono uppercase text-muted-foreground block">No Spaces</span>
          <strong className="text-3xl font-display">{stats.charactersNoSpaces.toLocaleString()}</strong>
        </div>
        <div className="p-3 bg-background rounded border border-border">
          <span className="text-xs font-mono uppercase text-muted-foreground block">Sentences</span>
          <strong className="text-3xl font-display">{stats.sentences.toLocaleString()}</strong>
        </div>
        <div className="p-3 bg-background rounded border border-border">
          <span className="text-xs font-mono uppercase text-muted-foreground block">Paragraphs</span>
          <strong className="text-3xl font-display">{stats.paragraphs.toLocaleString()}</strong>
        </div>
        <div className="p-3 bg-background rounded border border-border">
          <span className="text-xs font-mono uppercase text-muted-foreground block">Lines</span>
          <strong className="text-3xl font-display">{stats.lines.toLocaleString()}</strong>
        </div>
      </div>

      {/* Reading & Speaking Times Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-border text-sm">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" />
            <span>
              Reading:{' '}
              <strong>
                {stats.readingMinutes > 0 ? `${stats.readingMinutes}m ` : ''}
                {stats.readingSeconds}s
              </strong>
            </span>
            <span className="text-xs text-muted-foreground font-mono">({readingWpm} wpm)</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" />
            <span>
              Speaking:{' '}
              <strong>
                {stats.speakingMinutes > 0 ? `${stats.speakingMinutes}m ` : ''}
                {stats.speakingSeconds}s
              </strong>
            </span>
            <span className="text-xs text-muted-foreground font-mono">({speakingWpm} wpm)</span>
          </div>

          {selectionStats && (
            <div className="bg-pink px-2.5 py-0.5 rounded font-mono text-xs border border-border">
              Selection: <strong>{selectionStats.words}</strong> words, <strong>{selectionStats.chars}</strong> chars
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs font-mono"
          onClick={() => setShowSettings(!showSettings)}
        >
          <SlidersHorizontal size={14} /> Speeds & Target Limit
        </Button>
      </div>

      {/* Target Limit & Speed Config Panel */}
      {showSettings && (
        <div className="p-4 my-4 bg-muted/60 border border-border rounded-md grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <label className="flex flex-col gap-1.5">
            <span>Target Word Limit (optional)</span>
            <input
              type="number"
              placeholder="e.g. 500"
              className="form-input text-sm py-1 min-h-9"
              value={targetLimit}
              onChange={(e) => setTargetLimit(e.target.value ? Number(e.target.value) : '')}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span>Reading Speed ({readingWpm} WPM)</span>
            <input
              type="range"
              min={100}
              max={450}
              step={10}
              value={readingWpm}
              onChange={(e) => setReadingWpm(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span>Speaking Speed ({speakingWpm} WPM)</span>
            <input
              type="range"
              min={80}
              max={250}
              step={5}
              value={speakingWpm}
              onChange={(e) => setSpeakingWpm(Number(e.target.value))}
            />
          </label>
        </div>
      )}

      {/* Target Progress Bar */}
      {limitNumber > 0 && (
        <div className="my-4">
          <div className="flex justify-between text-xs font-mono mb-1">
            <span>
              Target: {stats.words} / {limitNumber} words ({progressPercent}%)
            </span>
            {isOverLimit ? (
              <span className="text-destructive font-bold">
                ⚠️ {stats.words - limitNumber} words over limit
              </span>
            ) : (
              <span className="text-muted-foreground">{limitNumber - stats.words} words remaining</span>
            )}
          </div>
          <div className="w-full bg-muted h-3 rounded-full overflow-hidden border border-border">
            <div
              className={`h-full transition-all duration-300 ${
                isOverLimit ? 'bg-destructive' : progressPercent > 85 ? 'bg-primary' : 'bg-lime'
              }`}
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Text Area */}
      <div className="my-4">
        <label htmlFor="word-counter-input" className="editor-label flex justify-between items-center">
          <span>Text to analyze</span>
          <span className="text-xs normal-case font-normal text-muted-foreground">
            Highlight any sentence to view selection stats
          </span>
        </label>
        <textarea
          ref={textareaRef}
          id="word-counter-input"
          autoFocus
          className="editor min-h-[300px]"
          placeholder="Paste or type your text here to see live word counts, speaking time, and keyword density…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onSelect={handleSelect}
          onKeyUp={handleSelect}
          onMouseUp={handleSelect}
        />
      </div>

      {/* Action Row */}
      <div className="control-row justify-between">
        <div className="flex items-center gap-2">
          <Button variant="paper" disabled={!text} onClick={() => copyText(text, 'Text copied')}>
            <Copy size={16} /> Copy text
          </Button>
          <Button
            variant="ghost"
            disabled={!text}
            onClick={() => {
              setText('');
              setSelectionStats(null);
            }}
          >
            <Trash2 size={16} /> Clear
          </Button>
        </div>

        {text && (
          <span className="text-xs font-mono text-muted-foreground">
            Live updates as you type · nothing stored on servers
          </span>
        )}
      </div>

      {/* Top Keywords & Density Panel */}
      {text.trim().length > 0 && (
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold">Top Keywords & Density</h3>
              <p className="text-xs text-muted-foreground">Most repeated phrases and their percentage share</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex border border-border rounded overflow-hidden">
                <button
                  className={`px-3 py-1 text-xs font-mono ${ngram === 1 ? 'bg-foreground text-card font-bold' : 'bg-card'}`}
                  onClick={() => setNgram(1)}
                >
                  1-Word
                </button>
                <button
                  className={`px-3 py-1 text-xs font-mono border-l border-border ${ngram === 2 ? 'bg-foreground text-card font-bold' : 'bg-card'}`}
                  onClick={() => setNgram(2)}
                >
                  2-Word
                </button>
                <button
                  className={`px-3 py-1 text-xs font-mono border-l border-border ${ngram === 3 ? 'bg-foreground text-card font-bold' : 'bg-card'}`}
                  onClick={() => setNgram(3)}
                >
                  3-Word
                </button>
              </div>

              <label className="flex items-center gap-1.5 text-xs font-mono cursor-pointer ml-2">
                <input
                  type="checkbox"
                  checked={ignoreStopWords}
                  onChange={(e) => setIgnoreStopWords(e.target.checked)}
                />
                Ignore stop words (the, of, and)
              </label>
            </div>
          </div>

          {keywords.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {keywords.map((kw, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-background border border-border rounded flex flex-col justify-between"
                >
                  <span className="font-mono text-xs font-semibold truncate" title={kw.phrase}>
                    {kw.phrase}
                  </span>
                  <div className="flex items-baseline justify-between mt-1 text-[11px] text-muted-foreground font-mono">
                    <span>{kw.count}×</span>
                    <span className="bg-primary px-1 rounded text-foreground font-semibold">{kw.density}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">No matching phrases found.</p>
          )}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 2. MARKDOWN TO RICH TEXT VIEW
// -------------------------------------------------------------
function MarkdownRichView() {
  const [text, setText] = useState(
    `# Project Status Report\n\nHere is the latest update for the **Tiny Tools** platform:\n\n| Tool | Category | Status |\n| :--- | :--- | :--- |\n| Word Counter | Text | Done |\n| Image Resizer | Media | Ready |\n| Rich Formatter | Text | Testing |\n\n### Key Highlights\n- All calculations run **100% in-browser**.\n- No data is ever uploaded.\n- Fast one-click formatting.\n\n> Note: Paste this directly into Google Docs, Word, or Gmail with intact styling.`
  );
  const [destination, setDestination] = useState<'google-docs' | 'word' | 'email' | 'plain'>('google-docs');
  const [copied, setCopied] = useState(false);

  // Generate clean, destination-tailored HTML
  const formattedHtml = useMemo(() => {
    try {
      const rawHtml = marked.parse(text, { async: false }) as string;
      const clean = DOMPurify.sanitize(rawHtml);

      if (destination === 'google-docs') {
        // Google Docs likes explicit borders and clean font hierarchy
        return clean
          .replace(/<table>/g, '<table style="border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #c7c7c7;">')
          .replace(/<th>/g, '<th style="border: 1px solid #c7c7c7; padding: 8px 12px; background-color: #f3f4f6; text-align: left; font-weight: bold;">')
          .replace(/<td>/g, '<td style="border: 1px solid #c7c7c7; padding: 8px 12px; vertical-align: top;">')
          .replace(/<blockquote/g, '<blockquote style="border-left: 3px solid #6b7280; margin: 12px 0; padding-left: 14px; color: #4b5563;"')
          .replace(/<pre>/g, '<pre style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; font-family: monospace; overflow-x: auto;">');
      }

      if (destination === 'word') {
        // Word supports full 6 headings and needs legacy table attributes
        return clean
          .replace(/<table>/g, '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; border: 1px solid #999;">')
          .replace(/<th>/g, '<th style="background-color: #eaeaea; font-weight: bold; border: 1px solid #999;">')
          .replace(/<td>/g, '<td style="border: 1px solid #999;">')
          .replace(/<blockquote/g, '<blockquote style="border-left: 4px solid #888; padding-left: 12px; margin: 10px 0;"');
      }

      if (destination === 'email') {
        // Email safe inline styling
        return clean
          .replace(/<p>/g, '<p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #111827;">')
          .replace(/<table>/g, '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; border: 1px solid #e5e7eb; margin: 16px 0;">')
          .replace(/<th>/g, '<th style="background-color: #f9fafb; font-weight: 600; text-align: left; border: 1px solid #e5e7eb; padding: 8px 12px;">')
          .replace(/<td>/g, '<td style="border: 1px solid #e5e7eb; padding: 8px 12px;">');
      }

      return clean;
    } catch {
      return '';
    }
  }, [text, destination]);

  async function handleCopyFormatted() {
    try {
      const blobHtml = new Blob([formattedHtml], { type: 'text/html' });
      const blobPlain = new Blob([cleanMarkdown(text)], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobPlain,
        }),
      ]);
      setCopied(true);
      toast.success(`Copied for ${destination === 'google-docs' ? 'Google Docs' : destination === 'word' ? 'Word' : 'Email'}! Press Ctrl+V to paste.`);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback
      try {
        await navigator.clipboard.writeText(formattedHtml);
        toast.success('HTML copied to clipboard!');
      } catch {
        toast.error('Clipboard access not allowed. Please copy manually.');
      }
    }
  }

  return (
    <div className="tool-panel">
      {/* Destination Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase font-bold text-muted-foreground">Format for:</span>
          <div className="flex border-2 border-border rounded overflow-hidden">
            <button
              className={`px-3 py-1.5 text-xs font-bold ${destination === 'google-docs' ? 'bg-foreground text-card' : 'bg-card'}`}
              onClick={() => setDestination('google-docs')}
            >
              Google Docs
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-bold border-l-2 border-border ${destination === 'word' ? 'bg-foreground text-card' : 'bg-card'}`}
              onClick={() => setDestination('word')}
            >
              MS Word
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-bold border-l-2 border-border ${destination === 'email' ? 'bg-foreground text-card' : 'bg-card'}`}
              onClick={() => setDestination('email')}
            >
              Gmail / Email
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-bold border-l-2 border-border ${destination === 'plain' ? 'bg-foreground text-card' : 'bg-card'}`}
              onClick={() => setDestination('plain')}
            >
              Clean HTML
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="tool" size="sm" onClick={handleCopyFormatted}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied Formatted!' : 'Copy Formatted Text'}
          </Button>
          <Button
            variant="paper"
            size="sm"
            onClick={() => copyText(formattedHtml, 'Raw HTML copied')}
          >
            Copy HTML
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setText('')}
          >
            <Trash2 size={16} /> Clear
          </Button>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="editor-grid">
        <div>
          <label htmlFor="markdown-input" className="editor-label flex justify-between">
            <span>Markdown Input</span>
            <span className="text-xs normal-case text-muted-foreground font-normal">
              Paste from ChatGPT, Claude, Docs
            </span>
          </label>
          <textarea
            id="markdown-input"
            autoFocus
            className="editor min-h-[380px] font-mono text-xs"
            placeholder="Paste your raw markdown here (tables, headings, lists, quotes)…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div>
          <span className="editor-label flex justify-between">
            <span>Live Rendered Preview</span>
            <span className="text-xs normal-case text-muted-foreground font-normal">
              Zero gray background · Ready for paste
            </span>
          </span>
          <div
            className="rich-preview min-h-[380px] bg-card overflow-y-auto max-h-[500px]"
            dangerouslySetInnerHTML={{ __html: formattedHtml }}
          />
        </div>
      </div>

      <div className="mt-4 p-3 bg-muted rounded border border-border text-xs flex items-center justify-between gap-4">
        <span className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <span>
            <strong>Pro Tip:</strong> Click <strong>Copy Formatted Text</strong>, switch to Docs/Word/Gmail, and press <strong>Ctrl+V</strong>. Tables and headings keep full styling!
          </span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7"
          onClick={() =>
            setText(
              `# New Product Feature\n\nHere is a clean summary:\n\n- **Feature A**: Instant browser processing\n- **Feature B**: Real HTML tables\n\n| Item | Value |\n| --- | --- |\n| Speed | Instant |\n| Privacy | 100% Local |\n\n> "Simplicity is the soul of efficiency."`
            )
          }
        >
          Load sample
        </Button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. CLEAN LINK REDIRECTOR VIEW
// -------------------------------------------------------------
function LinkCleanerView() {
  const [input, setInput] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=twitter&utm_medium=social&si=xyz123&fbclid=IwAR2a');
  const [stripAllParams, setStripAllParams] = useState(false);
  const [preserveAffiliate, setPreserveAffiliate] = useState(false);
  const [customParams, setCustomParams] = useState('');
  const [copied, setCopied] = useState(false);

  const cleanResult = useMemo(() => {
    const customList = customParams
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    return cleanLinkDetailed(input, {
      stripAllParams,
      preserveAffiliate,
      customParams: customList,
    });
  }, [input, stripAllParams, preserveAffiliate, customParams]);

  function handleCopy() {
    copyText(cleanResult.cleanedText, 'Clean link copied!');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const firstCleanUrl = cleanResult.cleanedUrls[0];

  return (
    <div className="tool-panel">
      {/* Trust & Summary Counter Banner */}
      <div className="p-4 mb-6 rounded-md border-2 border-border bg-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck size={24} className="text-foreground" />
          <div>
            <h3 className="font-bold text-sm">
              {cleanResult.removedCount > 0 ? (
                <span>{cleanResult.removedCount} tracking parameter{cleanResult.removedCount > 1 ? 's' : ''} stripped!</span>
              ) : cleanResult.unwrappedCount > 0 ? (
                <span>Redirect unwrapped successfully!</span>
              ) : input.trim() ? (
                <span className="text-muted-foreground">Link is already clean (no trackers found)</span>
              ) : (
                <span>Paste a link below to remove trackers</span>
              )}
            </h3>
            {cleanResult.removedParams.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Removed:{' '}
                <span className="font-mono text-foreground font-semibold">
                  {cleanResult.removedParams.join(', ')}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {firstCleanUrl && (
            <Button
              asChild
              variant="paper"
              size="sm"
            >
              <a href={firstCleanUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} /> Open clean link
              </a>
            </Button>
          )}
          <Button variant="tool" size="sm" disabled={!input.trim()} onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy clean link'}
          </Button>
        </div>
      </div>

      {/* Editor Grid: Raw vs Clean */}
      <div className="editor-grid">
        <div>
          <label htmlFor="raw-link-input" className="editor-label">
            Original URL(s)
          </label>
          <textarea
            id="raw-link-input"
            autoFocus
            className="editor min-h-[200px] font-mono text-xs"
            placeholder="Paste one or more URLs here (one per line)…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="clean-link-output" className="editor-label flex justify-between">
            <span>Cleaned URL(s)</span>
            {cleanResult.removedCount > 0 && (
              <span className="tag bg-lime text-foreground font-bold">
                -{cleanResult.removedCount} TRACKERS
              </span>
            )}
          </label>
          <textarea
            id="clean-link-output"
            readOnly
            className="editor min-h-[200px] font-mono text-xs bg-background"
            value={cleanResult.cleanedText}
            placeholder="Cleaned URL will appear here…"
          />
        </div>
      </div>

      {/* Options Bar */}
      <div className="mt-5 p-4 bg-muted/60 border border-border rounded-md flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer font-semibold">
            <input
              type="checkbox"
              checked={preserveAffiliate}
              onChange={(e) => setPreserveAffiliate(e.target.checked)}
            />
            Keep affiliate tags (tag, aff, ref)
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-semibold">
            <input
              type="checkbox"
              checked={stripAllParams}
              onChange={(e) => setStripAllParams(e.target.checked)}
            />
            Strip ALL parameters after &quot;?&quot;
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span>Extra params:</span>
          <input
            type="text"
            placeholder="e.g. custom_id, tracker"
            className="form-input text-xs py-1 min-h-8 max-w-[200px]"
            value={customParams}
            onChange={(e) => setCustomParams(e.target.value)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="control-row mt-4">
        <Button variant="paper" disabled={!input} onClick={handleCopy}>
          <Copy size={16} /> Copy clean URL
        </Button>
        <Button
          variant="ghost"
          disabled={!input}
          onClick={() => setInput('')}
        >
          <Trash2 size={16} /> Clear
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs ml-auto"
          onClick={() =>
            setInput(
              'https://amazon.com/dp/B08N5WRWNW?ref_=cm_sw_r_cp_ud_dp_1234&tag=mytag-20&utm_source=deal'
            )
          }
        >
          Try Amazon Example
        </Button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. GENERIC WORKSPACE (All other text utilities)
// -------------------------------------------------------------
function GenericTextWorkspace({ id }: { id: string }) {
  const [text, setText] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState(
    id === 'list-sorter'
      ? 'A–Z'
      : id === 'html-entities'
      ? 'Encode'
      : id === 'smart-quotes'
      ? 'Straighten'
      : 'camelCase'
  );
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(35);
  const [font, setFont] = useState(32);
  const [mirror, setMirror] = useState(false);
  const [checks, setChecks] = useState<Record<number, boolean>>({});
  const promptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running) return;
    let last = 0;
    let frame = 0;
    function step(time: number) {
      if (last && promptRef.current) {
        promptRef.current.scrollTop += ((time - last) * speed) / 1000;
      }
      last = time;
      if (
        promptRef.current &&
        promptRef.current.scrollTop + promptRef.current.clientHeight >= promptRef.current.scrollHeight
      ) {
        setRunning(false);
        return;
      }
      frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [running, speed]);

  // Live transform as user types
  useEffect(() => {
    if (['caption-counter', 'teleprompter', 'thread-previewer'].includes(id)) return;
    try {
      if (id === 'svg-sanitizer') {
        if (!text.trim()) {
          setOutput('');
          return;
        }
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg') {
          return;
        }
        doc.querySelectorAll('metadata,title,desc,script,foreignObject').forEach((n) => n.remove());
        doc.querySelectorAll('*').forEach((n) => {
          for (const a of [...n.attributes]) {
            if (
              /^on/i.test(a.name) ||
              /^(javascript:|data:text\/html)/i.test(a.value) ||
              ((a.name === 'href' || a.name === 'xlink:href') && !a.value.startsWith('#'))
            ) {
              n.removeAttribute(a.name);
            }
          }
        });
        const safe = DOMPurify.sanitize(new XMLSerializer().serializeToString(doc.documentElement), {
          USE_PROFILES: { svg: true, svgFilters: true },
        });
        setOutput(safe);
        return;
      }

      if (id === 'json-checklist') {
        if (!text.trim()) {
          setOutput('');
          return;
        }
        const parsed: unknown = JSON.parse(text);
        function flatten(v: unknown, path = ''): string[] {
          if (v === null || typeof v !== 'object') return [`${path ? path + ': ' : ''}${String(v)}`];
          return Object.entries(v).flatMap(([k, val]) =>
            flatten(val, Array.isArray(v) ? path : path ? `${path}.${k}` : k)
          );
        }
        setOutput(flatten(parsed).join('\n'));
        return;
      }

      if (id === 'html-entities') {
        if (mode === 'Encode') {
          setOutput(
            text
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;')
          );
        } else {
          const doc = new DOMParser().parseFromString(text, 'text/html');
          setOutput(doc.documentElement.textContent ?? '');
        }
        return;
      }

      setOutput(transformText(id, text, mode, find, replace));
      setError('');
    } catch (e) {
      // Keep going silently on typing
    }
  }, [text, mode, find, replace, id]);

  const count = characterCount(text);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const thread = splitThread(text);
  const hashtags = text.match(/#[\p{L}\p{N}_]+/gu)?.length ?? 0;

  const options =
    id === 'case-cleaner'
      ? ['camelCase', 'snake_case', 'kebab-case', 'UPPERCASE', 'lowercase', 'Title Case']
      : id === 'list-sorter'
      ? ['A–Z', 'Z–A']
      : id === 'html-entities'
      ? ['Encode', 'Decode']
      : id === 'smart-quotes'
      ? ['Straighten', 'Curl']
      : [];

  const isCaption = id === 'caption-counter';
  const isTele = id === 'teleprompter';
  const isThread = id === 'thread-previewer';

  return (
    <div className="tool-panel">
      {options.length > 0 && (
        <div className="control-row" role="group" aria-label="Output format">
          {options.map((o) => (
            <Button key={o} variant={mode === o ? 'tool' : 'tab'} onClick={() => setMode(o)}>
              {o}
            </Button>
          ))}
        </div>
      )}

      {id === 'find-replace' && (
        <div className="editor-grid mb-5">
          <label className="field">
            Find
            <input
              className="form-input"
              maxLength={1000}
              value={find}
              onChange={(e) => setFind(e.target.value)}
            />
          </label>
          <label className="field">
            Replace with
            <input
              className="form-input"
              maxLength={1000}
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
            />
          </label>
        </div>
      )}

      <div className={isCaption || isTele || isThread ? '' : 'editor-grid'}>
        <div>
          <label htmlFor="tool-input" className="editor-label">
            {isTele ? 'Your Script' : 'Your Input'}
          </label>
          <textarea
            id="tool-input"
            autoFocus
            className="editor"
            placeholder={
              id === 'json-checklist'
                ? '["Review designs", "Publish changes"]'
                : id === 'svg-sanitizer'
                ? '<svg xmlns="http://www.w3.org/2000/svg">...</svg>'
                : 'Paste or type your text here…'
            }
            maxLength={isCaption ? TIKTOK_LIMIT : 200000}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {!isCaption && !isTele && !isThread && (
          <div>
            <span className="editor-label">Live Result</span>
            {id === 'json-checklist' && output ? (
              <div className="rich-preview">
                {output.split('\n').map((line, i) => (
                  <label key={i} className="flex items-start gap-3 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checks[i] ?? false}
                      onChange={(e) => setChecks({ ...checks, [i]: e.target.checked })}
                    />
                    <span className={checks[i] ? 'line-through text-muted-foreground' : ''}>
                      {line}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                aria-label="Your result"
                className="editor bg-background"
                readOnly
                value={output}
                placeholder="Your result will appear here live…"
              />
            )}
          </div>
        )}
      </div>

      <div className="control-row">
        <Button
          variant="paper"
          disabled={!(isCaption || isTele || isThread ? text : output)}
          onClick={() => copyText(isCaption || isTele || isThread ? text : output)}
        >
          <Copy size={16} /> {isCaption ? 'Copy caption' : 'Copy result'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setText('');
            setOutput('');
            setError('');
          }}
        >
          <Trash2 size={16} /> Clear
        </Button>

        {['svg-sanitizer', 'json-checklist'].includes(id) && (
          <label className="field">
            <input
              type="file"
              accept={id === 'svg-sanitizer' ? '.svg' : '.json'}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setText(await file.text());
              }}
            />
          </label>
        )}

        {id === 'svg-sanitizer' && output && (
          <Button
            variant="paper"
            onClick={() => downloadBlob(new Blob([output], { type: 'image/svg+xml' }), 'clean.svg')}
          >
            <Download size={16} /> Download SVG
          </Button>
        )}
      </div>

      {error && (
        <p className="error-note" role="alert">
          {error}
        </p>
      )}

      {/* Caption & Hashtag Counter Details */}
      {isCaption && (
        <>
          <div className="stats">
            <div className="stat">
              <strong>{words.toLocaleString()}</strong>
              <span>Words</span>
            </div>
            <div className="stat">
              <strong>{count.toLocaleString()}</strong>
              <span>Characters</span>
            </div>
            <div className="stat">
              <strong>{hashtags}</strong>
              <span>Hashtags</span>
            </div>
            <div className="stat">
              <strong>{text ? text.split(/\n\s*\n/).length : 0}</strong>
              <span>Paragraphs</span>
            </div>
          </div>
          {count > 2200 && (
            <p className="error-note">⚠️ Over Instagram’s 2,200 character limit ({count - 2200} characters over).</p>
          )}
          {count > 125 && (
            <p className="text-xs text-muted-foreground mt-3 font-mono">
              ℹ️ Characters after ~125 will be hidden behind &quot;... more&quot; on mobile Instagram feeds.
            </p>
          )}
        </>
      )}

      {/* Thread Previewer Details */}
      {isThread && (
        <>
          <div className="stats">
            <div className="stat">
              <strong>{thread.length}</strong>
              <span>Posts in thread (280 characters max each)</span>
            </div>
          </div>
          {thread.map((post, i) => (
            <div className="thread-post" key={i}>
              <div className="flex justify-between text-xs text-muted-foreground mb-3 font-mono">
                <span>Post {i + 1} / {thread.length}</span>
                <span>{characterCount(post)} / 280</span>
              </div>
              <p className="whitespace-pre-wrap">{post}</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => copyText(post)}>
                <Copy size={14} /> Copy post
              </Button>
            </div>
          ))}
        </>
      )}

      {/* Teleprompter Details */}
      {isTele && (
        <>
          <div className="control-row">
            <Button variant="tool" disabled={!text} onClick={() => setRunning(!running)}>
              {running ? <Pause size={16} /> : <Play size={16} />}
              {running ? 'Pause' : 'Start scrolling'}
            </Button>
            <Button
              variant="paper"
              onClick={() => {
                setRunning(false);
                promptRef.current?.scrollTo(0, 0);
              }}
            >
              <RotateCcw size={16} /> Reset
            </Button>
            <label className="field text-xs font-mono">
              Speed: {speed} px/s
              <input type="range" min={10} max={100} value={speed} onChange={(e) => setSpeed(+e.target.value)} />
            </label>
            <label className="field text-xs font-mono">
              Text size: {font}px
              <input type="range" min={20} max={64} value={font} onChange={(e) => setFont(+e.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
              <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} />
              Mirror mode (for rigs)
            </label>
          </div>
          <div
            ref={promptRef}
            className="teleprompter"
            style={{ fontSize: font, transform: mirror ? 'scaleX(-1)' : undefined }}
          >
            {text || 'Your script will roll here when you hit Start scrolling.'}
          </div>
        </>
      )}
    </div>
  );
}

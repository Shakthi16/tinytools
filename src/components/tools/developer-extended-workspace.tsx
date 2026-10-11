import { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import {
  Code,
  Copy,
  Download,
  Key,
  ShieldAlert,
  Lock,
  Unlock,
  Check,
  RefreshCw,
  Binary,
  Layers,
  Clock,
  Sparkles,
  GitCompare,
  Fingerprint,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { copyText } from '@/components/tools/text-workspace';
import { downloadBlob } from '@/lib/tools/files';

export function DeveloperExtendedWorkspace({ id }: { id: string }) {
  if (id === 'json-formatter') return <JsonFormatterView />;
  if (id === 'password-generator') return <PasswordGeneratorView />;
  if (id === 'hash-generator') return <HashGeneratorView />;
  if (id === 'text-encrypt') return <TextEncryptView />;
  if (id === 'base64-tool') return <Base64ToolView />;
  if (id === 'jwt-decoder') return <JwtDecoderView />;
  if (id === 'diff-checker') return <DiffCheckerView />;
  if (id === 'uuid-generator') return <UuidGeneratorView />;
  if (id === 'unix-timestamp') return <UnixTimestampView />;

  return <JsonFormatterView />;
}

// ---------------------------------------------------------------------------
// 1. JSON FORMATTER & VALIDATOR
// ---------------------------------------------------------------------------
function JsonFormatterView() {
  const [input, setInput] = useState('{\n  "name": "tiny tools",\n  "version": 2.0,\n  "offline": true\n}');
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => {
    if (!input.trim()) {
      setError(null);
      return null;
    }
    try {
      const obj = JSON.parse(input);
      setError(null);
      return obj;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
      return null;
    }
  }, [input]);

  function formatJson(indent: number) {
    if (parsed === null) return;
    setInput(JSON.stringify(parsed, null, indent));
  }

  function minifyJson() {
    if (parsed === null) return;
    setInput(JSON.stringify(parsed));
  }

  return (
    <div className="tool-panel">
      <div className="control-row">
        <Button variant="tool" onClick={() => formatJson(2)}>Prettify (2 spaces)</Button>
        <Button variant="tab" onClick={() => formatJson(4)}>Prettify (4 spaces)</Button>
        <Button variant="tab" onClick={minifyJson}>Minify</Button>
        <Button variant="paper" onClick={() => void copyText(input)}>
          <Copy size={16} /> Copy
        </Button>
        <Button
          variant="ghost"
          onClick={() => downloadBlob(new Blob([input], { type: 'application/json' }), 'formatted.json')}
        >
          <Download size={16} /> Download .json
        </Button>
      </div>

      <div className="mt-4">
        <label className="field">
          JSON Input / Output
          <textarea
            className="editor font-mono text-sm min-h-[360px]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your JSON here…"
            spellCheck={false}
          />
        </label>
      </div>

      {error ? (
        <div className="p-3 mt-3 bg-red-100 border border-destructive text-destructive rounded text-xs font-mono">
          ❌ {error}
        </div>
      ) : input.trim() ? (
        <div className="p-3 mt-3 bg-emerald-50 border border-emerald-500 text-emerald-800 rounded text-xs font-mono flex items-center gap-2">
          <Check size={16} className="text-emerald-600" /> Valid JSON syntax
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. CRYPTOGRAPHIC PASSWORD GENERATOR
// ---------------------------------------------------------------------------
function PasswordGeneratorView() {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState('');

  function generate() {
    let charset = '';
    if (useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (useNumbers) charset += '0123456789';
    if (useSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) {
      setPassword('');
      return;
    }

    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);

    let res = '';
    for (let i = 0; i < length; i++) {
      const val = randomValues[i] ?? 0;
      res += charset[val % charset.length];
    }
    setPassword(res);
  }

  useEffect(() => {
    generate();
  }, [length, useUpper, useLower, useNumbers, useSymbols]);

  // Entropy calculation
  const charsetSize =
    (useUpper ? 26 : 0) + (useLower ? 26 : 0) + (useNumbers ? 10 : 0) + (useSymbols ? 28 : 0);
  const entropy = charsetSize > 0 ? Math.round(length * Math.log2(charsetSize)) : 0;
  const strength = entropy > 80 ? 'Very Strong' : entropy > 60 ? 'Strong' : entropy > 40 ? 'Moderate' : 'Weak';

  return (
    <div className="tool-panel max-w-2xl">
      <div className="p-5 bg-background border-2 border-border rounded-lg shadow-[4px_4px_0_var(--foreground)] flex items-center justify-between gap-4">
        <span className="font-mono text-xl sm:text-2xl font-bold tracking-wider select-all break-all">
          {password || 'Select options below'}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="tool" size="icon" onClick={generate} title="Regenerate">
            <RefreshCw size={18} />
          </Button>
          <Button variant="paper" size="icon" onClick={() => void copyText(password)} title="Copy">
            <Copy size={18} />
          </Button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span>Entropy: ~{entropy} bits</span>
        <span className="font-bold text-foreground">Rating: {strength}</span>
      </div>

      <div className="mt-6 space-y-4">
        <label className="field">
          Length ({length} characters)
          <input
            type="range"
            min="6"
            max="64"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full"
          />
        </label>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={useUpper}
              onChange={(e) => setUseUpper(e.target.checked)}
            />
            Uppercase (A-Z)
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={useLower}
              onChange={(e) => setUseLower(e.target.checked)}
            />
            Lowercase (a-z)
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={useNumbers}
              onChange={(e) => setUseNumbers(e.target.checked)}
            />
            Numbers (0-9)
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={useSymbols}
              onChange={(e) => setUseSymbols(e.target.checked)}
            />
            Special symbols (!@#$)
          </label>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. HASH & CHECKSUM GENERATOR
// ---------------------------------------------------------------------------
function HashGeneratorView() {
  const [text, setText] = useState('Hello, Tiny Tools!');
  const [sha256, setSha256] = useState('');
  const [sha512, setSha512] = useState('');
  const [sha1, setSha1] = useState('');
  const [compareHash, setCompareHash] = useState('');

  useEffect(() => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    void (async () => {
      // SHA-256
      const buf256 = await crypto.subtle.digest('SHA-256', data);
      setSha256(Array.from(new Uint8Array(buf256)).map((b) => b.toString(16).padStart(2, '0')).join(''));

      // SHA-512
      const buf512 = await crypto.subtle.digest('SHA-512', data);
      setSha512(Array.from(new Uint8Array(buf512)).map((b) => b.toString(16).padStart(2, '0')).join(''));

      // SHA-1
      const buf1 = await crypto.subtle.digest('SHA-1', data);
      setSha1(Array.from(new Uint8Array(buf1)).map((b) => b.toString(16).padStart(2, '0')).join(''));
    })();
  }, [text]);

  const matches =
    compareHash.trim() &&
    [sha256, sha512, sha1].some((h) => h.toLowerCase() === compareHash.trim().toLowerCase());

  return (
    <div className="tool-panel">
      <label className="field">
        Input Text to Hash
        <textarea
          className="editor min-h-[140px]"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste text to compute hashes…"
        />
      </label>

      <div className="mt-6 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs font-bold uppercase">SHA-256</span>
            <Button variant="ghost" size="sm" onClick={() => void copyText(sha256)}>
              <Copy size={14} /> Copy
            </Button>
          </div>
          <p className="p-2.5 bg-background border border-border rounded font-mono text-xs select-all break-all">
            {sha256}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs font-bold uppercase">SHA-512</span>
            <Button variant="ghost" size="sm" onClick={() => void copyText(sha512)}>
              <Copy size={14} /> Copy
            </Button>
          </div>
          <p className="p-2.5 bg-background border border-border rounded font-mono text-xs select-all break-all">
            {sha512}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs font-bold uppercase">SHA-1</span>
            <Button variant="ghost" size="sm" onClick={() => void copyText(sha1)}>
              <Copy size={14} /> Copy
            </Button>
          </div>
          <p className="p-2.5 bg-background border border-border rounded font-mono text-xs select-all break-all">
            {sha1}
          </p>
        </div>

        <div className="pt-4 border-t border-border">
          <label className="field">
            Verify / Compare with expected checksum
            <input
              type="text"
              className="form-input font-mono text-xs"
              placeholder="Paste expected hash to verify match…"
              value={compareHash}
              onChange={(e) => setCompareHash(e.target.value)}
            />
          </label>
          {compareHash.trim() && (
            <p className={`mt-2 text-xs font-mono font-bold ${matches ? 'text-emerald-600' : 'text-destructive'}`}>
              {matches ? '✓ Hash match confirmed!' : '✗ Hash does NOT match'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. TEXT ENCRYPT & DECRYPT (AES-GCM 256)
// ---------------------------------------------------------------------------
function TextEncryptView() {
  const [plaintext, setPlaintext] = useState('Confidential project notes');
  const [password, setPassword] = useState('SecretPassword123');
  const [cipherText, setCipherText] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [error, setError] = useState('');

  async function getKey(pass: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pass), { name: 'PBKDF2' }, false, [
      'deriveKey',
    ]);
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function handleEncrypt() {
    if (!plaintext || !password) return;
    setError('');
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await getKey(password, salt);
      const encoded = new TextEncoder().encode(plaintext);

      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encrypted), salt.length + iv.length);

      const b64 = btoa(String.fromCharCode(...combined));
      setCipherText(b64);
      toast.success('Text encrypted with AES-256!');
    } catch {
      setError('Encryption failed.');
    }
  }

  async function handleDecrypt() {
    if (!cipherText || !password) return;
    setError('');
    try {
      const binary = Uint8Array.from(atob(cipherText), (c) => c.charCodeAt(0));
      const salt = binary.slice(0, 16);
      const iv = binary.slice(16, 28);
      const data = binary.slice(28);

      const key = await getKey(password, salt);
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
      setDecryptedText(new TextDecoder().decode(decrypted));
      toast.success('Text decrypted successfully!');
    } catch {
      setError('Decryption failed. Incorrect password or invalid ciphertext.');
    }
  }

  return (
    <div className="tool-panel">
      <div className="editor-grid">
        <div>
          <label className="field">
            Plaintext Message
            <textarea
              className="editor min-h-[160px]"
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
            />
          </label>
          <label className="field mt-3">
            Passphrase
            <input
              type="text"
              className="form-input font-mono"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <Button variant="tool" className="mt-3" onClick={handleEncrypt}>
            <Lock size={16} /> Encrypt (AES-GCM)
          </Button>
        </div>

        <div>
          <label className="field">
            Encrypted Ciphertext (Base64)
            <textarea
              className="editor font-mono text-xs min-h-[160px]"
              value={cipherText}
              onChange={(e) => setCipherText(e.target.value)}
              placeholder="Encrypted data will show here…"
            />
          </label>
          <div className="control-row mt-3">
            <Button variant="paper" onClick={handleDecrypt}>
              <Unlock size={16} /> Decrypt
            </Button>
            {cipherText && (
              <Button variant="ghost" onClick={() => void copyText(cipherText)}>
                <Copy size={16} /> Copy
              </Button>
            )}
          </div>
        </div>
      </div>

      {decryptedText && (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-500 rounded text-sm font-mono text-emerald-900">
          <strong>Decrypted result:</strong>
          <p className="mt-1">{decryptedText}</p>
        </div>
      )}

      {error && <p className="error-note mt-3">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. BASE64 & URL ENCODER/DECODER
// ---------------------------------------------------------------------------
function Base64ToolView() {
  const [text, setText] = useState('Hello world!');
  const [mode, setMode] = useState<'b64' | 'url'>('b64');

  const b64Encoded = useMemo(() => {
    try {
      return btoa(unescape(encodeURIComponent(text)));
    } catch {
      return '';
    }
  }, [text]);

  const urlEncoded = useMemo(() => {
    return encodeURIComponent(text);
  }, [text]);

  function decodeBase64() {
    try {
      setText(decodeURIComponent(escape(atob(text.trim()))));
      toast.success('Decoded Base64!');
    } catch {
      toast.error('Invalid Base64 string.');
    }
  }

  function decodeUrl() {
    try {
      setText(decodeURIComponent(text.trim()));
      toast.success('Decoded URL!');
    } catch {
      toast.error('Invalid URL encoding.');
    }
  }

  return (
    <div className="tool-panel">
      <div className="control-row mb-4">
        <Button variant={mode === 'b64' ? 'tool' : 'tab'} onClick={() => setMode('b64')}>
          Base64 Mode
        </Button>
        <Button variant={mode === 'url' ? 'tool' : 'tab'} onClick={() => setMode('url')}>
          URL Encode Mode
        </Button>
      </div>

      <div className="editor-grid">
        <div>
          <label className="field">
            Raw Text
            <textarea
              className="editor min-h-[220px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
        </div>

        <div>
          <label className="field">
            {mode === 'b64' ? 'Base64 Output' : 'URL Encoded Output'}
            <textarea
              readOnly
              className="editor font-mono text-xs min-h-[220px] bg-muted/40"
              value={mode === 'b64' ? b64Encoded : urlEncoded}
            />
          </label>
        </div>
      </div>

      <div className="control-row mt-4">
        <Button
          variant="paper"
          onClick={() => void copyText(mode === 'b64' ? b64Encoded : urlEncoded)}
        >
          <Copy size={16} /> Copy Encoded
        </Button>
        {mode === 'b64' ? (
          <Button variant="ghost" onClick={decodeBase64}>
            Decode Input from Base64
          </Button>
        ) : (
          <Button variant="ghost" onClick={decodeUrl}>
            Decode Input from URL
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. JWT DECODER
// ---------------------------------------------------------------------------
function JwtDecoderView() {
  const [token, setToken] = useState(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4zC4T7Z1hR9aF9a'
  );

  const parsed = useMemo(() => {
    try {
      const parts = token.trim().split('.');
      if (parts.length < 2) return null;
      const headerStr = atob(parts[0]!.replace(/-/g, '+').replace(/_/g, '/'));
      const payloadStr = atob(parts[1]!.replace(/-/g, '+').replace(/_/g, '/'));
      return {
        header: JSON.parse(headerStr),
        payload: JSON.parse(payloadStr),
      };
    } catch {
      return null;
    }
  }, [token]);

  const isExpired = useMemo(() => {
    if (!parsed?.payload?.exp) return null;
    return parsed.payload.exp * 1000 < Date.now();
  }, [parsed]);

  return (
    <div className="tool-panel">
      <label className="field">
        Paste JWT Token
        <textarea
          className="editor font-mono text-xs min-h-[110px]"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="eyJhbGciOi..."
        />
      </label>

      {parsed ? (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-1 rounded font-mono text-xs font-bold ${
                isExpired === null
                  ? 'bg-muted text-muted-foreground'
                  : isExpired
                  ? 'bg-red-100 text-destructive border border-destructive'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-500'
              }`}
            >
              {isExpired === null ? 'No Expiry Set' : isExpired ? 'Expired Token' : 'Active Token'}
            </span>
            {parsed.payload.exp && (
              <span className="text-xs font-mono text-muted-foreground">
                Expires: {new Date(parsed.payload.exp * 1000).toLocaleString()}
              </span>
            )}
          </div>

          <div className="editor-grid">
            <div>
              <span className="text-xs font-mono font-bold uppercase mb-2 block">Header</span>
              <pre className="p-3 bg-background border border-border rounded font-mono text-xs overflow-auto">
                {JSON.stringify(parsed.header, null, 2)}
              </pre>
            </div>
            <div>
              <span className="text-xs font-mono font-bold uppercase mb-2 block">Payload / Claims</span>
              <pre className="p-3 bg-background border border-border rounded font-mono text-xs overflow-auto">
                {JSON.stringify(parsed.payload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : token.trim() ? (
        <p className="error-note mt-3">Invalid JWT format.</p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. DIFF CHECKER
// ---------------------------------------------------------------------------
function DiffCheckerView() {
  const [left, setLeft] = useState('Apple\nBanana\nOrange\nPineapple');
  const [right, setRight] = useState('Apple\nBlueberry\nOrange\nMango');

  const linesLeft = left.split('\n');
  const linesRight = right.split('\n');
  const maxLines = Math.max(linesLeft.length, linesRight.length);

  return (
    <div className="tool-panel">
      <div className="editor-grid">
        <label className="field">
          Original Text
          <textarea
            className="editor font-mono text-sm min-h-[180px]"
            value={left}
            onChange={(e) => setLeft(e.target.value)}
          />
        </label>
        <label className="field">
          Modified Text
          <textarea
            className="editor font-mono text-sm min-h-[180px]"
            value={right}
            onChange={(e) => setRight(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-6 border-2 border-border rounded-lg bg-background p-4 shadow-[4px_4px_0_var(--foreground)]">
        <span className="font-mono text-xs font-bold uppercase mb-3 block text-muted-foreground">
          Line-by-Line Comparison
        </span>
        <div className="space-y-1 font-mono text-xs">
          {Array.from({ length: maxLines }).map((_, i) => {
            const l = linesLeft[i] ?? '';
            const r = linesRight[i] ?? '';
            const isSame = l === r;
            return (
              <div
                key={i}
                className={`grid grid-cols-2 gap-4 p-1.5 rounded ${
                  isSame ? 'bg-transparent' : 'bg-yellow-50/80 border border-yellow-200'
                }`}
              >
                <div className={isSame ? 'text-foreground' : 'text-red-700 bg-red-100/60 px-1 rounded'}>
                  {l || <span className="text-muted-foreground italic">&lt;empty&gt;</span>}
                </div>
                <div className={isSame ? 'text-foreground' : 'text-emerald-700 bg-emerald-100/60 px-1 rounded'}>
                  {r || <span className="text-muted-foreground italic">&lt;empty&gt;</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8. UUID / ULID GENERATOR
// ---------------------------------------------------------------------------
function UuidGeneratorView() {
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [uuids, setUuids] = useState<string[]>([]);

  function generate() {
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      let id: string = crypto.randomUUID();
      if (!hyphens) id = id.replace(/-/g, '');
      if (uppercase) id = id.toUpperCase();
      list.push(id);
    }
    setUuids(list);
  }

  useEffect(() => {
    generate();
  }, [count, uppercase, hyphens]);

  return (
    <div className="tool-panel max-w-xl">
      <div className="control-row">
        <label className="flex items-center gap-2 text-sm font-mono">
          Quantity:
          <select
            className="form-input w-24 py-1"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          >
            <option value={1}>1</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(e) => setUppercase(e.target.checked)}
          />
          Uppercase
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={hyphens}
            onChange={(e) => setHyphens(e.target.checked)}
          />
          Hyphens
        </label>
        <Button variant="tool" size="sm" onClick={generate}>
          <RefreshCw size={14} /> Regenerate
        </Button>
      </div>

      <div className="mt-4 p-4 bg-background border-2 border-border rounded-lg shadow-[4px_4px_0_var(--foreground)] space-y-2">
        {uuids.map((u, i) => (
          <div key={i} className="flex items-center justify-between font-mono text-xs select-all">
            <span>{u}</span>
            <Button variant="ghost" size="icon" onClick={() => void copyText(u)}>
              <Copy size={13} />
            </Button>
          </div>
        ))}
      </div>

      <Button
        variant="paper"
        className="mt-4"
        onClick={() => void copyText(uuids.join('\n'), 'Copied all UUIDs!')}
      >
        <Copy size={16} /> Copy All ({uuids.length})
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 9. UNIX TIMESTAMP CONVERTER
// ---------------------------------------------------------------------------
function UnixTimestampView() {
  const [epochInput, setEpochInput] = useState(`${Math.floor(Date.now() / 1000)}`);
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 16));

  const parsedEpoch = useMemo(() => {
    const num = parseInt(epochInput.trim(), 10);
    if (isNaN(num)) return null;
    const ms = epochInput.trim().length > 11 ? num : num * 1000;
    return new Date(ms);
  }, [epochInput]);

  function setNow() {
    setEpochInput(`${Math.floor(Date.now() / 1000)}`);
  }

  function convertFromDate() {
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      setEpochInput(`${Math.floor(d.getTime() / 1000)}`);
    }
  }

  return (
    <div className="tool-panel max-w-xl space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-mono font-bold uppercase">Epoch Seconds</label>
          <Button variant="ghost" size="sm" onClick={setNow}>
            Set Current Time
          </Button>
        </div>
        <input
          type="number"
          className="form-input font-mono text-lg"
          value={epochInput}
          onChange={(e) => setEpochInput(e.target.value)}
        />
      </div>

      {parsedEpoch && (
        <div className="p-4 bg-background border-2 border-border rounded-lg shadow-[4px_4px_0_var(--foreground)] space-y-2 font-mono text-xs">
          <div>
            <span className="text-muted-foreground">UTC: </span>
            <strong>{parsedEpoch.toUTCString()}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Local: </span>
            <strong>{parsedEpoch.toString()}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">ISO 8601: </span>
            <strong>{parsedEpoch.toISOString()}</strong>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <label className="field">
          Or pick human date to get Epoch:
          <input
            type="datetime-local"
            className="form-input font-mono"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
          />
        </label>
        <Button variant="paper" className="mt-3" onClick={convertFromDate}>
          Convert to Epoch
        </Button>
      </div>
    </div>
  );
}

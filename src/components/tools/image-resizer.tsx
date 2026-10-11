import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  AlertTriangle,
  Archive,
  Check,
  Download,
  ImagePlus,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/tools/files";
import { createZipBlob, type ZipEntry } from "@/lib/tools/zip";
import {
  DEFAULT_BACKGROUND,
  DEFAULT_QUALITY,
  IMAGE_PRESETS,
  OUTPUT_FORMATS,
  buildOutputName,
  computeTargetSize,
  computeDrawPlan,
  describeOrientation,
  fitWithin,
  formatBytes,
  isTooLarge,
  isUpscale,
  outputFormat,
  readJpegOrientation,
  type FitMode,
  type ImagePreset,
  type OutputFormatId,
  type ResizeMode,
  type Size,
} from "@/lib/tools/image";

const STORAGE_KEY = "tinytools.image-resizer.settings.v1";
const MAX_INPUT_BYTES = 50 * 1024 * 1024;
const MAX_INPUT_COUNT = 50;

interface Settings {
  mode: ResizeMode;
  width: number;
  height: number;
  percentage: number;
  keepRatio: boolean;
  presetId: string;
  fit: FitMode;
  format: OutputFormatId;
  quality: number;
  background: string;
}

interface Result {
  blob: Blob;
  url: string;
  bytes: number;
  size: Size;
  name: string;
}

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  originalBytes: number;
  orientation: number;
  source?: Size | undefined;
  status: "idle" | "working" | "done" | "error";
  result?: Result | undefined;
  error?: string | undefined;
}

interface DecodedImage {
  image: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  mode: "dimensions",
  width: 1080,
  height: 1080,
  percentage: 100,
  keepRatio: true,
  presetId: IMAGE_PRESETS[0]?.id ?? "ig-square",
  fit: "cover",
  format: "image/jpeg",
  quality: DEFAULT_QUALITY,
  background: DEFAULT_BACKGROUND,
};

const MODE_LABELS: Record<ResizeMode, string> = {
  dimensions: "Custom size",
  percentage: "Percentage",
  preset: "Preset",
};

const FIT_OPTIONS: Array<{ id: FitMode; label: string; hint: string }> = [
  { id: "cover", label: "Cover", hint: "Crop to fill the frame" },
  { id: "contain", label: "Contain", hint: "Fit inside, pad with color" },
  { id: "stretch", label: "Stretch", hint: "Distort to exact size" },
];

function nextId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

function toBoundedNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function toPositiveInt(value: unknown, fallback: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(1, Math.round(numeric));
}

function sanitizePresetId(value: unknown): string {
  const candidate = typeof value === "string" ? value : "";
  return IMAGE_PRESETS.some((preset) => preset.id === candidate)
    ? candidate
    : DEFAULT_SETTINGS.presetId;
}

function sanitizeSettings(input: Partial<Settings>): Settings {
  return {
    mode: isOneOf(input.mode, ["dimensions", "percentage", "preset"])
      ? input.mode
      : DEFAULT_SETTINGS.mode,
    width: toPositiveInt(input.width, DEFAULT_SETTINGS.width),
    height: toPositiveInt(input.height, DEFAULT_SETTINGS.height),
    percentage: toBoundedNumber(input.percentage, 1, 400, DEFAULT_SETTINGS.percentage),
    keepRatio: typeof input.keepRatio === "boolean" ? input.keepRatio : DEFAULT_SETTINGS.keepRatio,
    presetId: sanitizePresetId(input.presetId),
    fit: isOneOf(input.fit, ["cover", "contain", "stretch"]) ? input.fit : DEFAULT_SETTINGS.fit,
    format: isOneOf(input.format, ["image/png", "image/jpeg", "image/webp"])
      ? input.format
      : DEFAULT_SETTINGS.format,
    quality: toBoundedNumber(input.quality, 0.1, 1, DEFAULT_SETTINGS.quality),
    background:
      typeof input.background === "string" && /^#[0-9a-f]{6}$/i.test(input.background)
        ? input.background
        : DEFAULT_SETTINGS.background,
  };
}

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return sanitizeSettings(JSON.parse(raw) as Partial<Settings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This image could not be decoded."));
    image.src = url;
  });
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        image: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Some formats/engines reject options; fall back to an <img> decode.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImageElement(url);
    return {
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function toBlob(
  canvas: HTMLCanvasElement,
  formatId: OutputFormatId,
  quality: number,
): Promise<Blob> {
  const format = outputFormat(formatId);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("This browser could not encode the image.")),
      format.id,
      format.supportsQuality ? quality : undefined,
    );
  });
}

function paintInto(
  context: CanvasRenderingContext2D,
  decoded: DecodedImage,
  target: Size,
  fit: FitMode,
  background: string,
  formatId: OutputFormatId,
): void {
  const format = outputFormat(formatId);
  if (!format.supportsAlpha || fit === "contain") {
    context.fillStyle = background || DEFAULT_BACKGROUND;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  const plan = computeDrawPlan({ width: decoded.width, height: decoded.height }, target, fit);
  context.drawImage(
    decoded.image,
    plan.sx,
    plan.sy,
    plan.sw,
    plan.sh,
    plan.dx,
    plan.dy,
    plan.dw,
    plan.dh,
  );
}

export function ImageResizer() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [runSignature, setRunSignature] = useState("");

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewDecodedRef = useRef<{ id: string; decoded: DecodedImage } | null>(null);
  const probingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage can be unavailable (private mode); settings simply are not remembered.
    }
  }, [settings, hydrated]);

  const updateItem = useCallback(
    (id: string, patch: Partial<ImageItem> | ((item: ImageItem) => ImageItem)) => {
      setItems((previous) =>
        previous.map((item) => {
          if (item.id !== id) return item;
          return typeof patch === "function" ? patch(item) : { ...item, ...patch };
        }),
      );
    },
    [],
  );

  const probeItem = useCallback(
    async (item: ImageItem) => {
      try {
        const decoded = await decodeImage(item.file);
        const source = { width: decoded.width, height: decoded.height };
        decoded.close();
        let orientation = 1;
        if (item.file.type === "image/jpeg") {
          try {
            orientation = readJpegOrientation(await item.file.arrayBuffer());
          } catch {
            orientation = 1;
          }
        }
        updateItem(item.id, { source, orientation });
      } catch (caught) {
        updateItem(item.id, { status: "error", error: message(caught) });
      }
    },
    [updateItem],
  );

  const addFiles = useCallback(
    (fileList: FileList | File[] | null | undefined) => {
      if (!fileList) return;
      const incoming = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
      if (incoming.length === 0) {
        setError("Choose PNG, JPG, WebP, or GIF images.");
        return;
      }
      const oversized = incoming.find((file) => file.size > MAX_INPUT_BYTES);
      if (oversized) {
        setError(
          `"${oversized.name}" is larger than ${formatBytes(MAX_INPUT_BYTES)}. Try a smaller file.`,
        );
        return;
      }
      const room = Math.max(0, MAX_INPUT_COUNT - items.length);
      const accepted = incoming.slice(0, room);
      if (accepted.length === 0) {
        setError(`You can resize up to ${MAX_INPUT_COUNT} images at once.`);
        return;
      }
      setItems((previous) => [
        ...previous,
        ...accepted.map((file) => ({
          id: nextId(),
          file,
          previewUrl: URL.createObjectURL(file),
          originalBytes: file.size,
          orientation: 1,
          status: "idle" as const,
        })),
      ]);
      setError(
        accepted.length < incoming.length
          ? `Only the first ${MAX_INPUT_COUNT} images were added.`
          : "",
      );
    },
    [items],
  );

  useEffect(() => {
    const pending = items.filter(
      (item) => !item.source && item.status === "idle" && !probingRef.current.has(item.id),
    );
    for (const item of pending) {
      probingRef.current.add(item.id);
      void probeItem(item).finally(() => probingRef.current.delete(item.id));
    }
  }, [items, probeItem]);

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const files = event.clipboardData?.files;
      if (files && files.length > 0) addFiles(files);
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [addFiles]);

  const processAll = useCallback(async () => {
    if (isWorking) return;
    const sourceItems = items.filter((item) => item.source);
    if (sourceItems.length === 0) {
      setError("Add an image first.");
      return;
    }
    setIsWorking(true);
    setError("");
    setProgress({ done: 0, total: sourceItems.length });
    setRunSignature(JSON.stringify(settings));
    let failures = 0;

    for (let index = 0; index < sourceItems.length; index += 1) {
      const item = sourceItems[index];
      if (!item || !item.source) continue;
      updateItem(item.id, { status: "working", error: undefined });
      try {
        const target = computeTargetSize(item.source, settings);
        if (isTooLarge(target)) {
          throw new Error("Output size is too large for this browser. Pick a smaller size.");
        }
        const decoded = await decodeImage(item.file);
        try {
          const canvas = document.createElement("canvas");
          canvas.width = target.width;
          canvas.height = target.height;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Your browser could not create a drawing surface.");
          paintInto(context, decoded, target, settings.fit, settings.background, settings.format);
          const blob = await toBlob(canvas, settings.format, settings.quality);
          const url = URL.createObjectURL(blob);
          const result: Result = {
            blob,
            url,
            bytes: blob.size,
            size: target,
            name: buildOutputName(
              item.file.name,
              "resized",
              outputFormat(settings.format).extension,
            ),
          };
          updateItem(item.id, (previous) => {
            if (previous.result) URL.revokeObjectURL(previous.result.url);
            return { ...previous, result, status: "done", error: undefined };
          });
        } finally {
          decoded.close();
        }
      } catch (caught) {
        failures += 1;
        updateItem(item.id, { status: "error", error: message(caught) });
      }
      setProgress({ done: index + 1, total: sourceItems.length });
    }

    setIsWorking(false);
    if (failures === 0) {
      toast.success(`Resized ${sourceItems.length} image${sourceItems.length === 1 ? "" : "s"}.`);
    } else {
      toast.error(`${failures} image${failures === 1 ? "" : "s"} could not be processed.`);
    }
  }, [items, settings, isWorking, updateItem]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void processAll();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [processAll]);

  const firstItem = items[0];
  const firstSource = firstItem?.source;
  const targetSize = useMemo(
    () => (firstSource ? computeTargetSize(firstSource, settings) : null),
    [firstSource, settings],
  );
  const upscale = firstSource && targetSize ? isUpscale(firstSource, targetSize) : false;
  const tooLarge = targetSize ? isTooLarge(targetSize) : false;
  const orientationNote = describeOrientation(firstItem?.orientation ?? 1);
  const totalBytes = items.reduce((sum, item) => sum + item.originalBytes, 0);
  const doneCount = items.filter((item) => item.result).length;
  const settingsChanged =
    doneCount > 0 && runSignature !== "" && runSignature !== JSON.stringify(settings);

  // Live preview of the first image using the current settings.
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const item = items[0];
    if (!item?.source) {
      previewDecodedRef.current?.decoded.close();
      previewDecodedRef.current = null;
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        let decoded =
          previewDecodedRef.current && previewDecodedRef.current.id === item.id
            ? previewDecodedRef.current.decoded
            : null;
        if (!decoded) {
          previewDecodedRef.current?.decoded.close();
          previewDecodedRef.current = null;
          const fresh = await decodeImage(item.file);
          if (cancelled) {
            fresh.close();
            return;
          }
          previewDecodedRef.current = { id: item.id, decoded: fresh };
          decoded = fresh;
        }
        if (cancelled) return;
        const target = computeTargetSize(decoded, settings);
        const previewSize = fitWithin(target, 440, 320);
        canvas.width = previewSize.width;
        canvas.height = previewSize.height;
        const context = canvas.getContext("2d");
        if (!context) return;
        paintInto(
          context,
          decoded,
          previewSize,
          settings.fit,
          settings.background,
          settings.format,
        );
      } catch {
        // Preview is best-effort; the live size readout still guides the user.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items, settings]);

  function removeItem(id: string) {
    const target = items.find((item) => item.id === id);
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
      if (target.result) URL.revokeObjectURL(target.result.url);
    }
    setItems((previous) => previous.filter((item) => item.id !== id));
  }

  function clearAll() {
    for (const item of items) {
      URL.revokeObjectURL(item.previewUrl);
      if (item.result) URL.revokeObjectURL(item.result.url);
    }
    previewDecodedRef.current?.decoded.close();
    previewDecodedRef.current = null;
    setItems([]);
    setProgress({ done: 0, total: 0 });
    setRunSignature("");
    setError("");
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    addFiles(event.target.files);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  async function downloadZip() {
    const completed = items.filter((item) => item.result);
    if (completed.length === 0) return;
    try {
      const usedNames = new Map<string, number>();
      const entries: ZipEntry[] = [];
      for (const item of completed) {
        const result = item.result;
        if (!result) continue;
        const seen = usedNames.get(result.name) ?? 0;
        usedNames.set(result.name, seen + 1);
        const name = seen === 0 ? result.name : result.name.replace(/(\.[^.]+)$/, `-${seen + 1}$1`);
        entries.push({ name, data: new Uint8Array(await result.blob.arrayBuffer()) });
      }
      downloadBlob(createZipBlob(entries), `resized-images-${Date.now()}.zip`);
      toast.success(`ZIP with ${entries.length} image${entries.length === 1 ? "" : "s"} ready.`);
    } catch (caught) {
      setError(message(caught));
    }
  }

  function presetGroups(): Array<{ group: string; presets: readonly ImagePreset[] }> {
    const groups = new Map<string, ImagePreset[]>();
    for (const preset of IMAGE_PRESETS) {
      const list = groups.get(preset.group) ?? [];
      list.push(preset);
      groups.set(preset.group, list);
    }
    return Array.from(groups, ([group, presets]) => ({ group, presets }));
  }

  return (
    <div className="tool-panel">
      <div
        className={`rounded border-2 border-border p-4 mb-5 flex flex-wrap items-center justify-between gap-3 ${
          isDragging ? "bg-mint" : "bg-muted/60"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="flex items-center gap-3">
          <ImagePlus size={22} />
          <div>
            <strong className="text-sm">
              {items.length > 0
                ? `${items.length} image${items.length === 1 ? "" : "s"} · ${formatBytes(totalBytes)} original`
                : "Drop images, paste from clipboard, or choose files"}
            </strong>
            <p className="text-xs text-muted-foreground mt-0.5">
              PNG, JPG, WebP or GIF · resized entirely on this device · nothing uploaded
            </p>
          </div>
        </div>
        <label className="cursor-pointer">
          <span className="sr-only">Choose images</span>
          <input
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            onChange={handleFiles}
          />
          <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 border-2 border-border bg-card ink-shadow hover:bg-accent">
            <ImagePlus className="size-4" /> Add images
          </span>
        </label>
      </div>

      {items.length > 0 && (
        <>
          <div className="control-row" role="group" aria-label="Resize mode">
            {(Object.keys(MODE_LABELS) as ResizeMode[]).map((mode) => (
              <Button
                key={mode}
                variant={settings.mode === mode ? "tool" : "tab"}
                onClick={() => setSettings((previous) => ({ ...previous, mode }))}
              >
                {MODE_LABELS[mode]}
              </Button>
            ))}
          </div>

          {settings.mode === "dimensions" && (
            <div className="editor-grid mb-2">
              <label className="field">
                Width (px)
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  max={12000}
                  value={settings.width}
                  onChange={(event) =>
                    setSettings((previous) => {
                      const width = toPositiveInt(event.target.value, previous.width);
                      const height =
                        previous.keepRatio && firstSource
                          ? Math.max(
                              1,
                              Math.round((width * firstSource.height) / firstSource.width),
                            )
                          : previous.height;
                      return { ...previous, width, height };
                    })
                  }
                />
              </label>
              <label className="field">
                Height (px)
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  max={12000}
                  value={settings.height}
                  onChange={(event) =>
                    setSettings((previous) => {
                      const height = toPositiveInt(event.target.value, previous.height);
                      const width =
                        previous.keepRatio && firstSource
                          ? Math.max(
                              1,
                              Math.round((height * firstSource.width) / firstSource.height),
                            )
                          : previous.width;
                      return { ...previous, height, width };
                    })
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.keepRatio}
                  onChange={(event) =>
                    setSettings((previous) => ({ ...previous, keepRatio: event.target.checked }))
                  }
                />
                Lock aspect ratio
              </label>
            </div>
          )}

          {settings.mode === "percentage" && (
            <div className="editor-grid mb-2">
              <label className="field">
                Scale ({settings.percentage}%)
                <input
                  type="range"
                  min={5}
                  max={200}
                  step={1}
                  value={settings.percentage}
                  onChange={(event) =>
                    setSettings((previous) => ({
                      ...previous,
                      percentage: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="field">
                Exact percentage
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  max={400}
                  value={settings.percentage}
                  onChange={(event) =>
                    setSettings((previous) => ({
                      ...previous,
                      percentage: toBoundedNumber(event.target.value, 1, 400, previous.percentage),
                    }))
                  }
                />
              </label>
            </div>
          )}

          {settings.mode === "preset" && (
            <div className="mb-2">
              <label className="field max-w-sm">
                Social & screen preset
                <select
                  className="form-input"
                  value={settings.presetId}
                  onChange={(event) =>
                    setSettings((previous) => ({ ...previous, presetId: event.target.value }))
                  }
                >
                  {presetGroups().map(({ group, presets }) => (
                    <optgroup key={group} label={group}>
                      {presets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label} — {preset.width}×{preset.height}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="control-row">
            <span className="text-xs font-mono uppercase text-muted-foreground">Fit</span>
            {FIT_OPTIONS.map((option) => (
              <Button
                key={option.id}
                variant={settings.fit === option.id ? "tool" : "tab"}
                title={option.hint}
                onClick={() => setSettings((previous) => ({ ...previous, fit: option.id }))}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="control-row">
            <label className="field">
              Format
              <select
                className="form-input"
                value={settings.format}
                onChange={(event) =>
                  setSettings((previous) => ({
                    ...previous,
                    format: event.target.value as OutputFormatId,
                  }))
                }
              >
                {OUTPUT_FORMATS.map((format) => (
                  <option key={format.id} value={format.id}>
                    {format.label}
                  </option>
                ))}
              </select>
            </label>
            {outputFormat(settings.format).supportsQuality && (
              <label className="field flex-1 min-w-[200px]">
                Quality ({Math.round(settings.quality * 100)}%)
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={Math.round(settings.quality * 100)}
                  onChange={(event) =>
                    setSettings((previous) => ({
                      ...previous,
                      quality: Number(event.target.value) / 100,
                    }))
                  }
                />
              </label>
            )}
            <label className="field">
              Background
              <input
                className="form-input h-11 p-1"
                type="color"
                value={settings.background}
                onChange={(event) =>
                  setSettings((previous) => ({ ...previous, background: event.target.value }))
                }
              />
            </label>
          </div>

          {(settings.fit === "contain" || !outputFormat(settings.format).supportsAlpha) && (
            <p className="text-xs text-muted-foreground -mt-2 mb-2">
              {settings.fit === "contain"
                ? "Empty space is filled with the background color."
                : "This format has no transparency; see-through areas become the background color."}
            </p>
          )}

          {firstItem && (
            <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center border border-border rounded p-4 bg-background">
              <div>
                <p className="text-xs font-mono uppercase text-muted-foreground">Live preview</p>
                <p className="text-lg font-bold mt-1">
                  {targetSize ? `${targetSize.width} × ${targetSize.height} px` : "—"}
                </p>
                {firstSource && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Original {firstSource.width} × {firstSource.height} px ·{" "}
                    {formatBytes(firstItem.originalBytes)}
                  </p>
                )}
                {upscale && (
                  <p className="text-xs text-destructive mt-2 flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5" /> Upscaling may look soft.
                  </p>
                )}
                {tooLarge && (
                  <p className="text-xs text-destructive mt-2 flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5" /> Output is too large to render; reduce the
                    size.
                  </p>
                )}
                {orientationNote && (
                  <p className="text-xs text-muted-foreground mt-2">
                    EXIF orientation detected ({orientationNote}); applied automatically.
                  </p>
                )}
              </div>
              <canvas
                ref={previewCanvasRef}
                aria-label="Resize preview"
                className="max-w-full rounded border border-border bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]"
              />
            </div>
          )}

          <div className="control-row mt-5">
            <Button variant="tool" disabled={isWorking} onClick={() => void processAll()}>
              {isWorking ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              {isWorking
                ? `Resizing ${progress.done}/${progress.total}…`
                : doneCount > 0
                  ? "Re-run resize"
                  : "Resize images"}
            </Button>
            <Button
              variant="paper"
              disabled={doneCount === 0 || isWorking}
              onClick={() => void downloadZip()}
            >
              <Archive /> Download all (ZIP)
            </Button>
            <Button variant="ghost" disabled={isWorking} onClick={clearAll}>
              <Trash2 /> Clear all
            </Button>
            <span className="text-xs font-mono text-muted-foreground ml-auto">
              Ctrl/Cmd + Enter to resize
            </span>
          </div>

          {isWorking && progress.total > 0 && (
            <div className="w-full bg-muted h-3 rounded-full overflow-hidden border border-border mb-2">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
              />
            </div>
          )}

          {settingsChanged && (
            <p className="text-xs text-muted-foreground mb-2">
              Settings changed since the last run — hit “Re-run resize” to refresh downloads.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 mt-6">
            {items.map((item) => {
              const result = item.result;
              return (
                <div key={item.id} className="border border-border rounded-lg p-4 bg-background">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate" title={item.file.name}>
                        {item.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.source
                          ? `${item.source.width} × ${item.source.height} px`
                          : item.status === "error"
                            ? item.error
                            : "Reading…"}
                        {" · "}
                        {formatBytes(item.originalBytes)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Remove"
                      aria-label={`Remove ${item.file.name}`}
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <figure className="m-0">
                      <img
                        src={item.previewUrl}
                        alt={`Original ${item.file.name}`}
                        className="w-full h-32 object-contain rounded border border-border bg-muted"
                      />
                      <figcaption className="text-[11px] text-muted-foreground mt-1">
                        Original
                      </figcaption>
                    </figure>
                    <figure className="m-0">
                      {result ? (
                        <>
                          <img
                            src={result.url}
                            alt={`Resized ${item.file.name}`}
                            className="w-full h-32 object-contain rounded border border-border bg-muted"
                          />
                          <figcaption className="text-[11px] text-muted-foreground mt-1">
                            {result.size.width} × {result.size.height} · {formatBytes(result.bytes)}
                          </figcaption>
                        </>
                      ) : (
                        <div className="w-full h-32 grid place-items-center rounded border border-dashed border-border text-xs text-muted-foreground">
                          {item.status === "working"
                            ? "Resizing…"
                            : item.status === "error"
                              ? "Failed"
                              : "Not yet resized"}
                        </div>
                      )}
                    </figure>
                  </div>

                  {result && (
                    <div className="flex items-center justify-between gap-3 mt-3">
                      <span className="text-xs font-mono text-muted-foreground">
                        {result.bytes <= item.originalBytes
                          ? `${Math.round((1 - result.bytes / item.originalBytes) * 100)}% smaller`
                          : `${Math.round((result.bytes / item.originalBytes - 1) * 100)}% larger`}
                      </span>
                      <Button
                        variant="paper"
                        size="sm"
                        onClick={() => {
                          downloadBlob(result.blob, result.name);
                          toast.success("Download started.");
                        }}
                      >
                        <Download /> Download
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {error && (
        <p className="error-note" role="alert">
          {error}
        </p>
      )}

      <p className="text-xs text-muted-foreground mt-6 flex items-center gap-2">
        <Check className="size-3.5" /> Processed with the Canvas API in your browser. Close the tab
        and nothing is left behind beyond the files you download.
      </p>
    </div>
  );
}

// Pure, DOM-free helpers for the in-browser image tools. Everything here is
// deterministic and unit-tested so the React views can stay thin.

export type ResizeMode = "dimensions" | "percentage" | "preset";
export type FitMode = "cover" | "contain" | "stretch";
export type OutputFormatId = "image/png" | "image/jpeg" | "image/webp";

export interface Size {
  width: number;
  height: number;
}

export interface ImagePreset {
  id: string;
  label: string;
  group: string;
  width: number;
  height: number;
}

export interface OutputFormat {
  id: OutputFormatId;
  label: string;
  extension: string;
  /** JPEG and WebP take a quality argument; PNG ignores it. */
  supportsQuality: boolean;
  /** Whether the encoded format can preserve an alpha channel. */
  supportsAlpha: boolean;
}

/** Hard ceiling on a single output side. Browsers cap canvas dimensions per platform. */
export const MAX_OUTPUT_SIDE = 12000;
export const MIN_OUTPUT_SIDE = 1;
/** Guard against exhausting GPU/CPU memory with extremely large canvases. */
export const MAX_OUTPUT_PIXELS = 100_000_000;
export const DEFAULT_BACKGROUND = "#ffffff";
export const DEFAULT_QUALITY = 0.9;

export const OUTPUT_FORMATS: readonly OutputFormat[] = [
  { id: "image/png", label: "PNG", extension: "png", supportsQuality: false, supportsAlpha: true },
  { id: "image/jpeg", label: "JPG", extension: "jpg", supportsQuality: true, supportsAlpha: false },
  {
    id: "image/webp",
    label: "WebP",
    extension: "webp",
    supportsQuality: true,
    supportsAlpha: true,
  },
];

export const IMAGE_PRESETS: readonly ImagePreset[] = [
  { id: "ig-square", label: "Instagram square", group: "Social", width: 1080, height: 1080 },
  { id: "ig-portrait", label: "Instagram portrait", group: "Social", width: 1080, height: 1350 },
  { id: "ig-story", label: "Instagram story", group: "Social", width: 1080, height: 1920 },
  { id: "fb-post", label: "Facebook post", group: "Social", width: 1200, height: 630 },
  { id: "x-post", label: "X (Twitter) post", group: "Social", width: 1600, height: 900 },
  { id: "li-post", label: "LinkedIn post", group: "Social", width: 1200, height: 627 },
  { id: "yt-thumb", label: "YouTube thumbnail", group: "Social", width: 1280, height: 720 },
  { id: "pin-pin", label: "Pinterest pin", group: "Social", width: 1000, height: 1500 },
  { id: "1080p", label: "1080p (Full HD)", group: "Video", width: 1920, height: 1080 },
  { id: "720p", label: "720p (HD)", group: "Video", width: 1280, height: 720 },
  { id: "avatar", label: "Avatar / profile", group: "Other", width: 512, height: 512 },
  { id: "favicon", label: "Favicon", group: "Other", width: 512, height: 512 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Round and clamp a single output dimension into the safe canvas range. */
export function roundDimension(value: number): number {
  if (!Number.isFinite(value)) return MIN_OUTPUT_SIDE;
  return clamp(Math.round(value), MIN_OUTPUT_SIDE, MAX_OUTPUT_SIDE);
}

export interface TargetSizeOptions {
  mode: ResizeMode;
  width?: number;
  height?: number;
  percentage?: number;
  keepRatio?: boolean;
  presetId?: string;
  presets?: readonly ImagePreset[];
}

/**
 * Resolve the final output pixel size from the source size and the active mode.
 * In `dimensions` mode with `keepRatio`, the requested box is treated as a
 * bound and the source is scaled to fit inside it without distortion.
 */
export function computeTargetSize(source: Size, options: TargetSizeOptions): Size {
  const presets = options.presets ?? IMAGE_PRESETS;

  if (options.mode === "preset") {
    const preset = presets.find((item) => item.id === options.presetId) ?? presets[0];
    if (preset)
      return { width: roundDimension(preset.width), height: roundDimension(preset.height) };
    return { width: roundDimension(source.width), height: roundDimension(source.height) };
  }

  if (options.mode === "percentage") {
    const percentage = Number.isFinite(options.percentage)
      ? Math.max(1, options.percentage as number)
      : 100;
    const scale = percentage / 100;
    return {
      width: roundDimension(source.width * scale),
      height: roundDimension(source.height * scale),
    };
  }

  const requestedWidth = Number.isFinite(options.width) ? (options.width as number) : source.width;
  const requestedHeight = Number.isFinite(options.height)
    ? (options.height as number)
    : source.height;

  if (
    options.keepRatio &&
    source.width > 0 &&
    source.height > 0 &&
    requestedWidth > 0 &&
    requestedHeight > 0
  ) {
    const scale = Math.min(requestedWidth / source.width, requestedHeight / source.height);
    return {
      width: roundDimension(source.width * scale),
      height: roundDimension(source.height * scale),
    };
  }

  return { width: roundDimension(requestedWidth), height: roundDimension(requestedHeight) };
}

export interface DrawPlan {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

/**
 * Compute the source-crop and destination-placement rectangle for a canvas
 * drawImage call. `cover` crops the source to fill the target (the seam-safe
 * choice for carousels), `contain` letterboxes, and `stretch` distorts.
 */
export function computeDrawPlan(source: Size, target: Size, fit: FitMode): DrawPlan {
  const sw = Math.max(1, source.width);
  const sh = Math.max(1, source.height);
  const dw = Math.max(1, target.width);
  const dh = Math.max(1, target.height);

  if (fit === "stretch") {
    return { sx: 0, sy: 0, sw, sh, dx: 0, dy: 0, dw, dh };
  }

  if (fit === "contain") {
    const scale = Math.min(dw / sw, dh / sh);
    const renderW = sw * scale;
    const renderH = sh * scale;
    return {
      sx: 0,
      sy: 0,
      sw,
      sh,
      dx: (dw - renderW) / 2,
      dy: (dh - renderH) / 2,
      dw: renderW,
      dh: renderH,
    };
  }

  // cover
  const targetAspect = dw / dh;
  const sourceAspect = sw / sh;
  const cropW = sourceAspect > targetAspect ? sh * targetAspect : sw;
  const cropH = sourceAspect > targetAspect ? sh : sw / targetAspect;
  return {
    sx: (sw - cropW) / 2,
    sy: (sh - cropH) / 2,
    sw: cropW,
    sh: cropH,
    dx: 0,
    dy: 0,
    dw,
    dh,
  };
}

/** True when the resize would enlarge the image and risk softness. */
export function isUpscale(source: Size, target: Size): boolean {
  return target.width > source.width || target.height > source.height;
}

export function isTooLarge(target: Size): boolean {
  return target.width * target.height > MAX_OUTPUT_PIXELS;
}

/** Reduce a size proportionally so it fits inside a box (for previews). */
export function fitWithin(size: Size, maxWidth: number, maxHeight: number): Size {
  const width = Math.max(1, size.width);
  const height = Math.max(1, size.height);
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

const BYTE_UNITS = ["KB", "MB", "GB"] as const;

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)} ${BYTE_UNITS[unitIndex] ?? "KB"}`;
}

/** Build a safe, unique output filename such as `photo-resized.jpg`. */
export function buildOutputName(originalName: string, suffix: string, extension: string): string {
  const withoutExtension = originalName.replace(/\.[^./\\]+$/, "");
  const sanitized =
    withoutExtension
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .trim() || "image";
  const suffixPart = suffix ? `-${suffix}` : "";
  const safeExtension = extension.replace(/^\./, "") || "png";
  return `${sanitized}${suffixPart}.${safeExtension}`;
}

const FALLBACK_FORMAT: OutputFormat = {
  id: "image/png",
  label: "PNG",
  extension: "png",
  supportsQuality: false,
  supportsAlpha: true,
};

export function outputFormat(formatId: OutputFormatId): OutputFormat {
  return OUTPUT_FORMATS.find((format) => format.id === formatId) ?? FALLBACK_FORMAT;
}

// -------------------------------------------------------------------------
// EXIF orientation
// -------------------------------------------------------------------------

/**
 * Read the EXIF orientation tag (1-8) from a JPEG byte buffer. Modern browsers
 * apply this automatically when decoding, but reading it lets the UI explain
 * why a portrait photo may report landscape pixel dimensions.
 */
export function readJpegOrientation(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) return 1;

  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = view.getUint8(offset + 1);
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    if (marker === 0xda) break;
    const length = view.getUint16(offset + 2, false);
    if (length < 2 || offset + 2 + length > view.byteLength) break;
    if (marker === 0xe1) {
      const orientation = readExifOrientation(view, offset + 4, length - 2);
      if (orientation) return orientation;
    }
    offset += 2 + length;
  }
  return 1;
}

function readExifOrientation(view: DataView, start: number, length: number): number | null {
  if (length < 14) return null;
  // "Exif\0\0"
  if (view.getUint32(start, false) !== 0x45786966) return null;
  if (view.getUint16(start + 4, false) !== 0x0000) return null;

  const tiff = start + 6;
  const byteOrder = view.getUint16(tiff, false);
  const little = byteOrder === 0x4949;
  if (!little && byteOrder !== 0x4d4d) return null;
  if (view.getUint16(tiff + 2, little) !== 0x002a) return null;

  const ifdStart = tiff + view.getUint32(tiff + 4, little);
  if (ifdStart + 2 > view.byteLength) return null;
  const count = view.getUint16(ifdStart, little);

  for (let index = 0; index < count; index += 1) {
    const entry = ifdStart + 2 + index * 12;
    if (entry + 12 > view.byteLength) return null;
    const tag = view.getUint16(entry, little);
    if (tag !== 0x0112) continue;
    if (view.getUint16(entry + 2, little) !== 3) return null; // SHORT
    const value = view.getUint16(entry + 8, little);
    return value >= 1 && value <= 8 ? value : 1;
  }
  return null;
}

export function describeOrientation(orientation: number): string | null {
  if (orientation <= 1) return null;
  const map: Record<number, string> = {
    2: "mirrored horizontally",
    3: "rotated 180°",
    4: "mirrored vertically",
    5: "mirrored and rotated 90°",
    6: "rotated 90° clockwise",
    7: "mirrored and rotated 270°",
    8: "rotated 90° counter-clockwise",
  };
  return map[orientation] ?? null;
}

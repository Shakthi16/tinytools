import { describe, expect, it } from "vitest";

import {
  buildOutputName,
  computeDrawPlan,
  computeTargetSize,
  fitWithin,
  formatBytes,
  isTooLarge,
  isUpscale,
  outputFormat,
  readJpegOrientation,
  roundDimension,
  MAX_OUTPUT_SIDE,
} from "@/lib/tools/image";

function jpegWithOrientation(orientation: number): ArrayBuffer {
  const exif = new Uint8Array([
    0x45,
    0x78,
    0x69,
    0x66,
    0x00,
    0x00,
    0x49,
    0x49,
    0x2a,
    0x00,
    0x08,
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x12,
    0x01,
    0x03,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    orientation & 0xff,
    (orientation >> 8) & 0xff,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
  ]);
  const app1Length = exif.length + 2;
  const bytes = new Uint8Array(6 + exif.length);
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  bytes[3] = 0xe1;
  bytes[4] = (app1Length >> 8) & 0xff;
  bytes[5] = app1Length & 0xff;
  bytes.set(exif, 6);
  return bytes.buffer;
}

describe("computeTargetSize", () => {
  it("keeps the exact dimensions when ratio is unlocked", () => {
    expect(
      computeTargetSize(
        { width: 4000, height: 3000 },
        { mode: "dimensions", width: 800, height: 600, keepRatio: false },
      ),
    ).toEqual({ width: 800, height: 600 });
  });

  it("fits the source inside a bounding box when ratio is locked", () => {
    expect(
      computeTargetSize(
        { width: 2000, height: 1000 },
        { mode: "dimensions", width: 900, height: 900, keepRatio: true },
      ),
    ).toEqual({ width: 900, height: 450 });
  });

  it("scales by percentage and rounds", () => {
    expect(
      computeTargetSize({ width: 1000, height: 500 }, { mode: "percentage", percentage: 33 }),
    ).toEqual({ width: 330, height: 165 });
  });

  it("uses the requested preset", () => {
    expect(
      computeTargetSize({ width: 10, height: 10 }, { mode: "preset", presetId: "ig-story" }),
    ).toEqual({ width: 1080, height: 1920 });
  });

  it("clamps oversized dimensions to the safe canvas ceiling", () => {
    expect(roundDimension(999999)).toBe(MAX_OUTPUT_SIDE);
    expect(
      computeTargetSize(
        { width: 10, height: 10 },
        { mode: "dimensions", width: 999999, height: 999999, keepRatio: false },
      ),
    ).toEqual({
      width: MAX_OUTPUT_SIDE,
      height: MAX_OUTPUT_SIDE,
    });
  });
});

describe("computeDrawPlan", () => {
  it("stretches to the full target", () => {
    expect(
      computeDrawPlan({ width: 100, height: 100 }, { width: 200, height: 50 }, "stretch"),
    ).toEqual({
      sx: 0,
      sy: 0,
      sw: 100,
      sh: 100,
      dx: 0,
      dy: 0,
      dw: 200,
      dh: 50,
    });
  });

  it("center-crops to fill (cover) without distortion", () => {
    const plan = computeDrawPlan({ width: 200, height: 100 }, { width: 100, height: 100 }, "cover");
    expect(plan.sw).toBe(100);
    expect(plan.sh).toBe(100);
    expect(plan.sx).toBe(50);
    expect(plan.sy).toBe(0);
    expect(plan.dw).toBe(100);
    expect(plan.dh).toBe(100);
  });

  it("letterboxes (contain) and centers the render", () => {
    const plan = computeDrawPlan(
      { width: 200, height: 100 },
      { width: 100, height: 100 },
      "contain",
    );
    expect(plan.dw).toBe(100);
    expect(plan.dh).toBe(50);
    expect(plan.dx).toBe(0);
    expect(plan.dy).toBe(25);
  });
});

describe("image helpers", () => {
  it("formats bytes across units", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.00 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB");
  });

  it("builds safe output names", () => {
    expect(buildOutputName("Holiday Photo.JPG", "resized", "jpg")).toBe(
      "Holiday Photo-resized.jpg",
    );
    expect(buildOutputName("weird:name?.png", "resized", "webp")).toBe("weird-name--resized.webp");
  });

  it("detects upscaling and oversized pixel counts", () => {
    expect(isUpscale({ width: 100, height: 100 }, { width: 200, height: 50 })).toBe(true);
    expect(isUpscale({ width: 100, height: 100 }, { width: 50, height: 50 })).toBe(false);
    expect(isTooLarge({ width: 20000, height: 20000 })).toBe(true);
  });

  it("fits a preview within a box", () => {
    expect(fitWithin({ width: 1000, height: 500 }, 400, 400)).toEqual({ width: 400, height: 200 });
  });

  it("resolves output formats", () => {
    expect(outputFormat("image/webp").extension).toBe("webp");
    expect(outputFormat("image/png").supportsQuality).toBe(false);
  });
});

describe("readJpegOrientation", () => {
  it("reads orientation 6 from a JPEG EXIF segment", () => {
    expect(readJpegOrientation(jpegWithOrientation(6))).toBe(6);
  });

  it("reads orientation 1", () => {
    expect(readJpegOrientation(jpegWithOrientation(1))).toBe(1);
  });

  it("defaults to 1 for non-JPEG data", () => {
    expect(readJpegOrientation(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer)).toBe(1);
  });
});

import { describe, expect, it } from "vitest";

import { buildZip, crc32 } from "@/lib/tools/zip";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

describe("crc32", () => {
  it("matches the standard check value", () => {
    expect(crc32(encoder.encode("123456789"))).toBe(0xcbf43926);
  });
});

describe("buildZip", () => {
  it("writes a single stored entry with a valid structure", () => {
    const data = encoder.encode("hello world");
    const bytes = buildZip([{ name: "a.txt", data }]);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    expect(view.getUint32(0, true)).toBe(0x04034b50);

    const nameLength = view.getUint16(26, true);
    const name = decoder.decode(bytes.slice(30, 30 + nameLength));
    expect(name).toBe("a.txt");
    expect(view.getUint32(18, true)).toBe(data.length);

    const dataStart = 30 + nameLength;
    expect(decoder.decode(bytes.slice(dataStart, dataStart + data.length))).toBe("hello world");

    const eocd = bytes.length - 22;
    expect(view.getUint32(eocd, true)).toBe(0x06054b50);
    expect(view.getUint16(eocd + 10, true)).toBe(1);
  });

  it("stores multiple entries and reports the count", () => {
    const bytes = buildZip([
      { name: "1.png", data: encoder.encode("one") },
      { name: "2.png", data: encoder.encode("two") },
    ]);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(view.getUint16(bytes.length - 12, true)).toBe(2);
  });

  it("rejects archives with too many entries", () => {
    const entries = Array.from({ length: 0xffff + 1 }, (_value, index) => ({
      name: `file-${index}.txt`,
      data: new Uint8Array(0),
    }));
    expect(() => buildZip(entries)).toThrow();
  });
});

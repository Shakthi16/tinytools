// Minimal, dependency-free ZIP writer. Images are already compressed, so the
// stored (method 0) entries keep the archive byte-for-byte identical to the
// inputs while avoiding a multi-hundred-kilobyte compression library.

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

interface PreparedEntry {
  nameBytes: Uint8Array;
  data: Uint8Array;
  crc: number;
  offset: number;
}

const ZIP_LOCAL_HEADER = 0x04034b50;
const ZIP_CENTRAL_HEADER = 0x02014b50;
const ZIP_END_OF_CENTRAL = 0x06054b50;
const UTF8_FLAG = 0x0800;
const STORE_METHOD = 0;
const MAX_ENTRIES = 0xffff;
const MAX_UINT32 = 0xffffffff;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    crc = (CRC_TABLE[(crc ^ (bytes[index] ?? 0)) & 0xff] ?? 0) ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear());
  const time =
    (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time: time & 0xffff, date: day & 0xffff };
}

/**
 * Assemble the given entries into a ZIP archive as raw bytes. Throws when the
 * archive would exceed the classic (non-Zip64) limits so the caller can ask the
 * user to process fewer images at a time.
 */
export function buildZip(entries: readonly ZipEntry[]): Uint8Array {
  if (entries.length > MAX_ENTRIES) {
    throw new Error("Too many files for a single ZIP archive. Download them in smaller batches.");
  }

  const encoder = new TextEncoder();
  const prepared: PreparedEntry[] = [];
  let localSize = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    prepared.push({ nameBytes, data: entry.data, crc: crc32(entry.data), offset: localSize });
    localSize += 30 + nameBytes.length + entry.data.length;
  }

  const centralSize = prepared.reduce((sum, entry) => sum + 46 + entry.nameBytes.length, 0);
  const totalSize = localSize + centralSize + 22;
  if (totalSize > MAX_UINT32) {
    throw new Error("The archive is too large to build in memory. Process fewer images at once.");
  }

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const { time, date } = dosDateTime(new Date());
  let cursor = 0;

  for (const entry of prepared) {
    view.setUint32(cursor, ZIP_LOCAL_HEADER, true);
    cursor += 4;
    view.setUint16(cursor, 20, true);
    cursor += 2;
    view.setUint16(cursor, UTF8_FLAG, true);
    cursor += 2;
    view.setUint16(cursor, STORE_METHOD, true);
    cursor += 2;
    view.setUint16(cursor, time, true);
    cursor += 2;
    view.setUint16(cursor, date, true);
    cursor += 2;
    view.setUint32(cursor, entry.crc, true);
    cursor += 4;
    view.setUint32(cursor, entry.data.length, true);
    cursor += 4;
    view.setUint32(cursor, entry.data.length, true);
    cursor += 4;
    view.setUint16(cursor, entry.nameBytes.length, true);
    cursor += 2;
    view.setUint16(cursor, 0, true);
    cursor += 2;
    bytes.set(entry.nameBytes, cursor);
    cursor += entry.nameBytes.length;
    bytes.set(entry.data, cursor);
    cursor += entry.data.length;
  }

  const centralStart = cursor;

  for (const entry of prepared) {
    view.setUint32(cursor, ZIP_CENTRAL_HEADER, true);
    cursor += 4;
    view.setUint16(cursor, 20, true);
    cursor += 2;
    view.setUint16(cursor, 20, true);
    cursor += 2;
    view.setUint16(cursor, UTF8_FLAG, true);
    cursor += 2;
    view.setUint16(cursor, STORE_METHOD, true);
    cursor += 2;
    view.setUint16(cursor, time, true);
    cursor += 2;
    view.setUint16(cursor, date, true);
    cursor += 2;
    view.setUint32(cursor, entry.crc, true);
    cursor += 4;
    view.setUint32(cursor, entry.data.length, true);
    cursor += 4;
    view.setUint32(cursor, entry.data.length, true);
    cursor += 4;
    view.setUint16(cursor, entry.nameBytes.length, true);
    cursor += 2;
    view.setUint16(cursor, 0, true);
    cursor += 2;
    view.setUint16(cursor, 0, true);
    cursor += 2;
    view.setUint16(cursor, 0, true);
    cursor += 2;
    view.setUint16(cursor, 0, true);
    cursor += 2;
    view.setUint32(cursor, 0, true);
    cursor += 4;
    view.setUint32(cursor, entry.offset, true);
    cursor += 4;
    bytes.set(entry.nameBytes, cursor);
    cursor += entry.nameBytes.length;
  }

  const centralSizeActual = cursor - centralStart;

  view.setUint32(cursor, ZIP_END_OF_CENTRAL, true);
  cursor += 4;
  view.setUint16(cursor, 0, true);
  cursor += 2;
  view.setUint16(cursor, 0, true);
  cursor += 2;
  view.setUint16(cursor, prepared.length, true);
  cursor += 2;
  view.setUint16(cursor, prepared.length, true);
  cursor += 2;
  view.setUint32(cursor, centralSizeActual, true);
  cursor += 4;
  view.setUint32(cursor, centralStart, true);
  cursor += 4;
  view.setUint16(cursor, 0, true);

  return bytes;
}

export function createZipBlob(entries: readonly ZipEntry[]): Blob {
  const bytes = buildZip(entries);
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return new Blob([buffer], { type: "application/zip" });
}

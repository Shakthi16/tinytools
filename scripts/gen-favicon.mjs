import fs from 'node:fs';

const width = 32;
const height = 32;

// Create 32x32 BGRA buffer (bottom-up)
const bgra = Buffer.alloc(width * height * 4);

// Fill with transparent or lightning pattern
// Coordinate system for bottom-up: y from 0 (bottom) to 31 (top)
for (let y = 0; y < height; y++) {
  // mathematical y from top (0 is top, 31 is bottom)
  const py = 31 - y;
  for (let px = 0; px < width; px++) {
    const idx = (y * width + px) * 4;

    // Rounded rectangle check: [2, 29] x [2, 29], corner radius 6
    const inBox = px >= 2 && px <= 29 && py >= 2 && py <= 29;
    let inRounded = inBox;
    if (inBox) {
      const cx = px < 8 ? 8 : (px > 23 ? 23 : px);
      const cy = py < 8 ? 8 : (py > 23 ? 23 : py);
      const dist = Math.hypot(px - cx, py - cy);
      if (dist > 6) inRounded = false;
    }

    if (!inRounded) {
      // Shadow check: [4, 31] x [4, 31]
      const inShadowBox = px >= 4 && px <= 31 && py >= 4 && py <= 31;
      let inShadow = inShadowBox;
      if (inShadowBox) {
        const cx = px < 10 ? 10 : (px > 25 ? 25 : px);
        const cy = py < 10 ? 10 : (py > 25 ? 25 : py);
        if (Math.hypot(px - cx, py - cy) > 6) inShadow = false;
      }
      if (inShadow) {
        // Black shadow
        bgra[idx] = 27;     // B
        bgra[idx + 1] = 28; // G
        bgra[idx + 2] = 30; // R
        bgra[idx + 3] = 255;// A
      } else {
        // Transparent
        bgra[idx] = 0;
        bgra[idx + 1] = 0;
        bgra[idx + 2] = 0;
        bgra[idx + 3] = 0;
      }
      continue;
    }

    // Border check
    const isBorder = px <= 3 || px >= 28 || py <= 3 || py >= 28;

    // Lightning bolt coordinates in 32x32 grid:
    // Top-left: (17, 6) -> (9, 17) -> (15, 17) -> (13, 26) -> (23, 14) -> (17, 14) -> close
    // Simple point-in-polygon for lightning bolt
    const poly = [
      [16, 6], [8, 17], [14, 17], [12, 26], [23, 14], [16, 14]
    ];
    let insideBolt = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      const intersect = ((yi > py) !== (yj > py)) &&
        (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
      if (intersect) insideBolt = !insideBolt;
    }

    if (insideBolt) {
      // Dark ink lightning bolt
      bgra[idx] = 27;     // B
      bgra[idx + 1] = 28; // G
      bgra[idx + 2] = 30; // R
      bgra[idx + 3] = 255;// A
    } else if (isBorder) {
      bgra[idx] = 27;
      bgra[idx + 1] = 28;
      bgra[idx + 2] = 30;
      bgra[idx + 3] = 255;
    } else {
      // Bright yellow neo-brutalist fill
      bgra[idx] = 138;    // B
      bgra[idx + 1] = 240;// G
      bgra[idx + 2] = 254;// R
      bgra[idx + 3] = 255;// A
    }
  }
}

// AND mask: 1 bit per pixel, 32 bytes per row -> 128 bytes total
const andMask = Buffer.alloc((width * height) / 8, 0);

// BMP info header: 40 bytes
const bih = Buffer.alloc(40);
bih.writeUInt32LE(40, 0);
bih.writeInt32LE(width, 4);
bih.writeInt32LE(height * 2, 8); // 64
bih.writeUInt16LE(1, 12); // Planes
bih.writeUInt16LE(32, 14); // Bit count
bih.writeUInt32LE(0, 16); // BI_RGB
bih.writeUInt32LE(bgra.length + andMask.length, 20); // image size
bih.writeInt32LE(0, 24);
bih.writeInt32LE(0, 28);
bih.writeUInt32LE(0, 32);
bih.writeUInt32LE(0, 36);

const imageBytes = Buffer.concat([bih, bgra, andMask]);

// ICO Header: 6 bytes
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // Reserved
header.writeUInt16LE(1, 2); // Icon
header.writeUInt16LE(1, 4); // 1 image

// Directory entry: 16 bytes
const dir = Buffer.alloc(16);
dir.writeUInt8(width, 0);
dir.writeUInt8(height, 1);
dir.writeUInt8(0, 2); // Color palette
dir.writeUInt8(0, 3); // Reserved
dir.writeUInt16LE(1, 4); // Planes
dir.writeUInt16LE(32, 6); // Bit count
dir.writeUInt32LE(imageBytes.length, 8); // Image byte size
dir.writeUInt32LE(22, 12); // Offset = 6 + 16 = 22

const ico = Buffer.concat([header, dir, imageBytes]);
fs.writeFileSync('public/favicon.ico', ico);
console.log('Successfully wrote public/favicon.ico! Size:', ico.length);

node - << 'EOJS'
const zlib = require('zlib')
const fs   = require('fs')
const path = require('path')

// CRC32 table
const T = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  T[i] = c
}
function crc32(buf) {
  let c = 0xFFFFFFFF
  for (const b of buf) c = T[(c ^ b) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length, 0)
  const crc = Buffer.allocUnsafe(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}

function makePNG(size) {
  // Create RGBA pixel buffer: blue bg #0b84ff with a white rounded-square "✓"
  const pixels = new Uint8Array(size * size * 4)

  const cx = size / 2, cy = size / 2
  const corner = size * 0.20  // corner radius of the rounded square
  const margin = size * 0.12

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      const dx = Math.max(margin + corner - x, x - (size - margin - corner), 0)
      const dy = Math.max(margin + corner - y, y - (size - margin - corner), 0)
      const inShape = dx * dx + dy * dy <= corner * corner

      if (inShape) {
        // Blue background
        pixels[idx]   = 11   // R
        pixels[idx+1] = 132  // G
        pixels[idx+2] = 255  // B
        pixels[idx+3] = 255  // A
      } else {
        // Transparent
        pixels[idx+3] = 0
      }
    }
  }

  // Draw white checkmark polyline: (0.25,0.53) -> (0.43,0.71) -> (0.76,0.34) scaled to size
  // Use line drawing with thickness
  const pts = [
    [0.25, 0.53], [0.43, 0.71], [0.76, 0.34]
  ]
  const thick = Math.max(2, Math.round(size * 0.07))

  for (let seg = 0; seg < pts.length - 1; seg++) {
    const x0 = pts[seg][0] * size, y0 = pts[seg][1] * size
    const x1 = pts[seg+1][0] * size, y1 = pts[seg+1][1] * size
    const steps = Math.ceil(Math.hypot(x1-x0, y1-y0) * 2)
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      const px = x0 + t*(x1-x0), py = y0 + t*(y1-y0)
      for (let dy = -thick; dy <= thick; dy++) {
        for (let dx = -thick; dx <= thick; dx++) {
          if (dx*dx + dy*dy <= thick*thick) {
            const nx = Math.round(px+dx), ny = Math.round(py+dy)
            if (nx >= 0 && ny >= 0 && nx < size && ny < size) {
              const idx = (ny * size + nx) * 4
              if (pixels[idx+3] === 255) { // only paint inside shape
                pixels[idx] = pixels[idx+1] = pixels[idx+2] = 255
              }
            }
          }
        }
      }
    }
  }

  // Build PNG: RGBA colour type (6)
  const sig = Buffer.from([137,80,78,71,13,10,26,10])
  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0  // 8-bit RGBA

  const rowLen = 1 + size * 4
  const raw = Buffer.allocUnsafe(rowLen * size)
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0 // filter None
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4
      const dst = y * rowLen + 1 + x * 4
      raw[dst]   = pixels[src]
      raw[dst+1] = pixels[src+1]
      raw[dst+2] = pixels[src+2]
      raw[dst+3] = pixels[src+3]
    }
  }

  const idat = zlib.deflateSync(raw, { level: 6 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

const dir = path.join('/Users/admin/dev/imami/public/icons')
fs.writeFileSync(path.join(dir, 'icon-192.png'), makePNG(192))
fs.writeFileSync(path.join(dir, 'icon-512.png'), makePNG(512))
console.log('Generated icon-192.png and icon-512.png ✓')
EOJS
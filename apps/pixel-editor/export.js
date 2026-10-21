// PNG 내보내기: 격자 데이터 → RGBA 픽셀 → canvas → PNG 파일.
// toRgbaPixels·hexToRgb·makeFilename은 DOM 없이 동작하는 순수 함수입니다.

// '#rrggbb' → [r, g, b]
export function hexToRgb(color) {
  const value = parseInt(color.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

// 칸 하나를 scale×scale 픽셀로 확대한 RGBA 배열. 빈 칸은 [0,0,0,0]
export function toRgbaPixels(grid, scale) {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  const width = cols * scale;
  const height = rows * scale;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let gy = 0; gy < rows; gy += 1) {
    for (let gx = 0; gx < cols; gx += 1) {
      const color = grid[gy][gx];
      if (color === null) continue;
      const [r, g, b] = hexToRgb(color);
      for (let py = gy * scale; py < (gy + 1) * scale; py += 1) {
        let offset = (py * width + gx * scale) * 4;
        for (let i = 0; i < scale; i += 1) {
          data[offset] = r;
          data[offset + 1] = g;
          data[offset + 2] = b;
          data[offset + 3] = 255;
          offset += 4;
        }
      }
    }
  }
  return { width, height, data };
}

// toRgbaPixels 결과를 putImageData로 canvas에 그립니다 (DOM 사용)
export function renderToCanvas(grid, scale, canvas = document.createElement('canvas')) {
  const { width, height, data } = toRgbaPixels(grid, scale);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.putImageData(new ImageData(data, width, height), 0, 0);
  return canvas;
}

// PNG로 만들어 내려받습니다. 실패하면 reject
export function downloadPng(grid, scale, filename) {
  const canvas = renderToCanvas(grid, scale);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PNG를 만들지 못했습니다'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      resolve();
    }, 'image/png');
  });
}

function pad(value) {
  return String(value).padStart(2, '0');
}

// 'pixel-art-YYYYMMDD-HHmmss.png' (로컬 시각)
export function makeFilename(date = new Date()) {
  const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `pixel-art-${day}-${time}.png`;
}

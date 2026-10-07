import { createCanvas, loadImage } from 'canvas';
import fs from 'fs/promises';

// Pure JS image preprocessing: grayscale → gaussian blur → otsu binarization → save
// We avoid opencv-js due to its complex WASM init in ESM; instead use canvas API
// which gives us full pixel-level control for the same preprocessing steps.

function gaussianKernel(radius) {
  const sigma = radius / 3;
  const size = 2 * radius + 1;
  const kernel = [];
  let sum = 0;
  for (let i = 0; i < size; i++) {
    const x = i - radius;
    const v = Math.exp(-(x * x) / (2 * sigma * sigma));
    kernel.push(v);
    sum += v;
  }
  return kernel.map((v) => v / sum);
}

function applyGaussianBlur(data, width, height, radius = 2) {
  const kernel = gaussianKernel(radius);
  const tmp = new Uint8ClampedArray(data.length);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let k = -radius; k <= radius; k++) {
        const sx = Math.min(Math.max(x + k, 0), width - 1);
        const idx = (y * width + sx) * 4;
        const w = kernel[k + radius];
        r += data[idx] * w;
        g += data[idx + 1] * w;
        b += data[idx + 2] * w;
      }
      const i = (y * width + x) * 4;
      tmp[i] = r; tmp[i + 1] = g; tmp[i + 2] = b; tmp[i + 3] = 255;
    }
  }

  const out = new Uint8ClampedArray(data.length);
  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let k = -radius; k <= radius; k++) {
        const sy = Math.min(Math.max(y + k, 0), height - 1);
        const idx = (sy * width + x) * 4;
        const w = kernel[k + radius];
        r += tmp[idx] * w;
        g += tmp[idx + 1] * w;
        b += tmp[idx + 2] * w;
      }
      const i = (y * width + x) * 4;
      out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 255;
    }
  }
  return out;
}

function toGrayscale(data) {
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    out[i] = out[i + 1] = out[i + 2] = gray;
    out[i + 3] = 255;
  }
  return out;
}

function otsuThreshold(data, width, height) {
  // Build histogram from grayscale channel
  const hist = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) hist[data[i]]++;

  const total = width * height;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];

  let sumB = 0, wB = 0, max = 0, threshold = 0;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > max) { max = between; threshold = t; }
  }
  return threshold;
}

function applyBinarization(data, threshold) {
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const v = data[i] > threshold ? 255 : 0;
    out[i] = out[i + 1] = out[i + 2] = v;
    out[i + 3] = 255;
  }
  return out;
}

function enhanceContrast(data) {
  // Simple CLAHE-like local contrast: stretch histogram
  let min = 255, max = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
  }
  const range = max - min || 1;
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.round(((data[i] - min) / range) * 255);
    out[i] = out[i + 1] = out[i + 2] = v;
    out[i + 3] = 255;
  }
  return out;
}

export async function processImage(inputPath, outputPath) {
  const img = await loadImage(inputPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  let pixels = imageData.data;

  // Pipeline: grayscale → contrast enhance → gaussian blur → otsu binarize
  pixels = toGrayscale(pixels);
  pixels = enhanceContrast(pixels);
  pixels = applyGaussianBlur(pixels, img.width, img.height, 1);
  const threshold = otsuThreshold(pixels, img.width, img.height);
  pixels = applyBinarization(pixels, threshold);

  // Write back
  const outData = ctx.createImageData(img.width, img.height);
  outData.data.set(pixels);
  ctx.putImageData(outData, 0, 0);

  await fs.writeFile(outputPath, canvas.toBuffer('image/png'));
}

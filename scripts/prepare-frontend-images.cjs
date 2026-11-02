// Optimize existing design artwork without changing the original files.
const { loadImage, createCanvas } = require('canvas');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'src', 'assets');
async function exportImage(name, width, crop) {
  const image = await loadImage(path.join(root, 'landing', `${name}.png`));
  const [x, y, w, h] = crop || [0, 0, image.width, image.height];
  const canvas = createCanvas(width, Math.round(width * h / w));
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, x, y, w, h, 0, 0, canvas.width, canvas.height);
  fs.writeFileSync(path.join(root, 'reference', `${name}.jpg`), canvas.toBuffer('image/jpeg', { quality: .9 }));
}
(async () => {
  await exportImage('capture-illustration', 650, [191, 40, 630, 962]);
  await exportImage('database-seal', 600, [200, 98, 624, 808]);
  await exportImage('hero-banner', 1920);
  await exportImage('about-mountain', 1600);
  await exportImage('maori-pattern', 1600);
})();

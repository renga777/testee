// Gera icon-192.png e icon-512.png usando apenas Node.js built-in
// Execute: node generate-icons.js
// Requer Node 18+ (fetch nativo) — usa apenas módulos built-in

const { createCanvas } = (() => {
  try { return require('canvas'); } catch { return null; }
})() || {};

if (!createCanvas) {
  // Fallback: gera SVG que pode ser convertido manualmente
  const fs = require('fs');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#1a1a2e"/>
  <text x="256" y="320" font-size="280" text-anchor="middle" fill="#6c63ff" font-family="Arial">⚡</text>
  <text x="256" y="460" font-size="80" text-anchor="middle" fill="#a78bfa" font-family="Arial">CalcSci</text>
</svg>`;
  fs.writeFileSync('icon.svg', svg);
  console.log('Gerado icon.svg — converta para PNG em https://svgtopng.com');
  process.exit(0);
}

const fs = require('fs');

function drawIcon(size) {
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');
  const r = size * 0.15;

  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, r);
  ctx.fill();

  // Symbol
  ctx.font = `bold ${size * 0.55}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#6c63ff';
  ctx.fillText('⚡', size / 2, size / 2);

  return c.toBuffer('image/png');
}

fs.writeFileSync('icon-192.png', drawIcon(192));
fs.writeFileSync('icon-512.png', drawIcon(512));
console.log('Ícones gerados: icon-192.png, icon-512.png');

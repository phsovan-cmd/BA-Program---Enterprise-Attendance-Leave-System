import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// 1. High fidelity SVG matching the user's uploaded "Morea - EVERYDAY YOUNG" pink circle logo
const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Beautiful gradient for depth and vibrancy -->
    <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff5293" />
      <stop offset="100%" stop-color="#f0377e" />
    </linearGradient>
    <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.15" />
    </filter>
  </defs>

  <!-- Circular background -->
  <circle cx="256" cy="256" r="256" fill="url(#pinkGrad)" />

  <!-- Inner circular border accent (optional subtle glow) -->
  <circle cx="256" cy="256" r="250" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" />

  <!-- "Morea" Script Brand Text -->
  <g transform="translate(256, 275)" text-anchor="middle" filter="url(#subtleShadow)">
    <text
      x="0"
      y="0"
      fill="#ffffff"
      font-family="'Playfair Display', 'Brush Script MT', 'Great Vibes', 'Bickham Script Pro', 'Snell Roundhand', 'Georgia', 'Times New Roman', cursive, serif"
      font-size="160"
      font-style="italic"
      font-weight="600"
      letter-spacing="-2"
    >Morea</text>
  </g>

  <!-- Tagline: "• EVERYDAY YOUNG •" -->
  <g transform="translate(256, 360)" text-anchor="middle">
    <text
      x="0"
      y="0"
      fill="#ffffff"
      font-family="'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      font-size="21"
      font-weight="700"
      letter-spacing="5"
      opacity="0.95"
    >• EVERYDAY YOUNG •</text>
  </g>
</svg>
`.trim();

// Maskable icon with 15% safe zone padding for Android
const maskableSvgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff5293" />
      <stop offset="100%" stop-color="#f0377e" />
    </linearGradient>
  </defs>

  <!-- Full-bleed background for maskable container -->
  <rect width="512" height="512" fill="url(#pinkGrad)" />

  <!-- Scaled content inside safe zone (80% diameter) -->
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <circle cx="256" cy="256" r="250" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3" />
    <g transform="translate(256, 275)" text-anchor="middle">
      <text
        x="0"
        y="0"
        fill="#ffffff"
        font-family="'Playfair Display', 'Brush Script MT', 'Great Vibes', 'Georgia', cursive, serif"
        font-size="160"
        font-style="italic"
        font-weight="600"
        letter-spacing="-2"
      >Morea</text>
    </g>
    <g transform="translate(256, 360)" text-anchor="middle">
      <text
        x="0"
        y="0"
        fill="#ffffff"
        font-family="'Montserrat', 'Inter', -apple-system, sans-serif"
        font-size="21"
        font-weight="700"
        letter-spacing="5"
        opacity="0.95"
      >• EVERYDAY YOUNG •</text>
    </g>
  </g>
</svg>
`.trim();

async function generate() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
  console.log('✓ Created public/icon.svg');

  const svgBuffer = Buffer.from(svgContent);
  const maskableBuffer = Buffer.from(maskableSvgContent);

  // 2. Generate Apple Touch Icon (180x180) for iOS Safari
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created public/apple-touch-icon.png (180x180)');

  // 3. Generate PWA 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ Created public/pwa-192x192.png (192x192)');

  // 4. Generate PWA 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ Created public/pwa-512x512.png (512x512)');

  // 5. Generate PWA Maskable 512x512
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ Created public/pwa-maskable-512x512.png (512x512)');

  // 6. Generate Favicon PNG (64x64)
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ Created public/favicon.png (64x64)');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});

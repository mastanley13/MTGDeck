import sharp from 'sharp';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGO_URL = 'https://storage.googleapis.com/msgsndr/zKZ8Zy6VvGR1m7lNfRkY/media/6830e4ad6417b23718765500.png';
const FAVICON_DIR = path.join(path.dirname(__dirname), 'public', 'favicon');

const SIZES = {
  'favicon-16x16.png': 16,
  'favicon-32x32.png': 32,
  'favicon.png': 48,
  'apple-touch-icon.png': 180,
  'android-chrome-192x192.png': 192,
  'android-chrome-512x512.png': 512
};

async function downloadImage(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data, 'binary');
}

async function generateFavicons() {
  try {
    // Create favicon directory if it doesn't exist
    await fs.mkdir(FAVICON_DIR, { recursive: true });

    // Download the logo
    console.log('Downloading logo...');
    const imageBuffer = await downloadImage(LOGO_URL);

    // Generate different sizes
    console.log('Generating favicons...');
    for (const [filename, size] of Object.entries(SIZES)) {
      const outputPath = path.join(FAVICON_DIR, filename);
      await sharp(imageBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      console.log(`Generated ${filename}`);
    }

    console.log('Favicon generation complete!');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons(); 
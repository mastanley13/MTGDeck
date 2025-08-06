// This is a simple build script for Vercel
import { execSync } from 'child_process';
import fs from 'fs';

// Log the Node.js version
console.log(`Node.js version: ${process.version}`);

// Log the environment
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
});

try {
  // Run the build command
  console.log('Building the application...');
  execSync('vite build', { stdio: 'inherit' });
  
  // Generate sitemap if the script exists
  if (fs.existsSync('./scripts/generate-sitemap.js')) {
    console.log('Generating sitemap...');
    execSync('node scripts/generate-sitemap.js', { stdio: 'inherit' });
  }
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
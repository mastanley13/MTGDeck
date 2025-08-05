import { writeFileSync } from 'node:fs';

const base = 'https://aidecktutor.com';

// Define the main pages with their priorities and change frequencies
const pages = [
  { url: '/', priority: 1.0, changefreq: 'weekly' },
  { url: '/builder', priority: 0.9, changefreq: 'weekly' },
  { url: '/card-search', priority: 0.8, changefreq: 'weekly' },
  { url: '/commander-ai', priority: 0.8, changefreq: 'weekly' },
  { url: '/tutor-ai', priority: 0.8, changefreq: 'weekly' },
  { url: '/how-to-play', priority: 0.7, changefreq: 'monthly' },
  { url: '/blog', priority: 0.7, changefreq: 'weekly' },
  { url: '/contact', priority: 0.6, changefreq: 'monthly' },
  { url: '/socials', priority: 0.6, changefreq: 'monthly' },
  { url: '/legal', priority: 0.5, changefreq: 'monthly' },
  { url: '/login', priority: 0.4, changefreq: 'monthly' },
  { url: '/register', priority: 0.4, changefreq: 'monthly' },
];

// Generate properly formatted XML
let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

// Add each page to the sitemap with proper formatting
pages.forEach(page => {
  xml += '  <url>\n';
  xml += `    <loc>${base}${page.url}</loc>\n`;
  xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
  xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
  xml += `    <priority>${page.priority}</priority>\n`;
  xml += '  </url>\n';
});

xml += '</urlset>';

// Write to dist directory (Vite build output)
writeFileSync('dist/sitemap.xml', xml);
console.log('Sitemap generated successfully at dist/sitemap.xml'); 
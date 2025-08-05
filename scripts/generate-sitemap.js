import { writeFileSync } from 'node:fs';
import { SitemapStream, streamToPromise } from 'sitemap';
import { glob } from 'glob';

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

// Create sitemap stream
const sm = new SitemapStream({ hostname: base });

// Add each page to the sitemap
pages.forEach(page => {
  sm.write({
    url: page.url,
    changefreq: page.changefreq,
    priority: page.priority,
    lastmod: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  });
});

// End the stream and get the XML
sm.end();
const xml = await streamToPromise(sm);

// Write to dist directory (Vite build output)
writeFileSync('dist/sitemap.xml', xml.toString());
console.log('Sitemap generated successfully at dist/sitemap.xml'); 
import { writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const base = 'https://www.aidecktutor.com';

// Define the main pages with their priorities and change frequencies
const pages = [
  { url: '/', priority: 1.0, changefreq: 'weekly', file: 'src/pages/HomePage.jsx' },
  { url: '/builder', priority: 0.9, changefreq: 'weekly', file: 'src/pages/DeckBuilder.jsx' },
  { url: '/card-search', priority: 0.8, changefreq: 'weekly', file: 'src/pages/CardSearchPage.jsx' },
  { url: '/commander-ai', priority: 0.8, changefreq: 'weekly', file: 'src/pages/CommanderAiPage.jsx' },
  { url: '/tutor-ai', priority: 0.8, changefreq: 'weekly', file: 'src/pages/TutorAiPage.jsx' },
  { url: '/how-to-play', priority: 0.7, changefreq: 'monthly', file: 'src/pages/HowToPlayPage.jsx' },
  { url: '/blog', priority: 0.7, changefreq: 'weekly', file: 'src/pages/BlogPage.jsx' },
  { url: '/contact', priority: 0.6, changefreq: 'monthly', file: 'src/pages/ContactPage.jsx' },
  { url: '/socials', priority: 0.6, changefreq: 'monthly', file: 'src/pages/SocialsPage.jsx' },
  { url: '/legal', priority: 0.5, changefreq: 'monthly', file: 'src/pages/Legal.tsx' },
  { url: '/login', priority: 0.4, changefreq: 'monthly', file: 'src/pages/LoginPage.jsx' },
  { url: '/register', priority: 0.4, changefreq: 'monthly', file: 'src/pages/RegisterPage.jsx' },
  { url: '/about', priority: 0.6, changefreq: 'monthly', file: 'src/pages/About.tsx' },
  { url: '/profile', priority: 0.5, changefreq: 'weekly', file: 'src/pages/UserProfilePage.jsx' },
  { url: '/decks', priority: 0.7, changefreq: 'weekly', file: 'src/pages/DeckViewer.jsx' },
  { url: '/debug', priority: 0.3, changefreq: 'monthly', file: 'src/components/debug/CardDebugger.jsx' },
];

// Function to get file modification time
function getLastModified(filePath) {
  try {
    const stats = statSync(filePath);
    return stats.mtime.toISOString().split('T')[0];
  } catch (error) {
    console.warn(`Warning: Could not get modification time for ${filePath}, using current date`);
    return new Date().toISOString().split('T')[0];
  }
}

// Function to generate dynamic URLs (blog posts, deck pages)
async function generateDynamicUrls() {
  const dynamicUrls = [];
  
  // Add blog post template URL (for SEO purposes)
  dynamicUrls.push({
    url: '/blog/sample-post',
    priority: 0.6,
    changefreq: 'weekly',
    file: 'src/pages/BlogPostPage.jsx',
    isTemplate: true
  });
  
  // Add deck viewer template URL
  dynamicUrls.push({
    url: '/decks/sample-deck',
    priority: 0.6,
    changefreq: 'weekly',
    file: 'src/pages/DeckViewer.jsx',
    isTemplate: true
  });
  
  return dynamicUrls;
}

// Function to validate URL accessibility
async function validateUrl(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIDeckTutor-Bot/1.0)'
      }
    });
    return response.status === 200;
  } catch (error) {
    console.warn(`Warning: Could not validate ${url}: ${error.message}`);
    return false;
  }
}

// Generate properly formatted XML
async function generateSitemap() {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  let validPages = 0;
  let invalidPages = 0;
  let skippedPages = 0;

  // Get all pages including dynamic ones
  const allPages = [...pages, ...(await generateDynamicUrls())];

  // Add each page to the sitemap with proper formatting
  for (const page of allPages) {
    // Ensure canonical URL format: no trailing slash, https, lowercase
    const canonicalUrl = page.url.endsWith('/') && page.url !== '/' 
      ? page.url.slice(0, -1) 
      : page.url;
    const fullUrl = `${base}${canonicalUrl}`.toLowerCase();
    
    // Skip validation for template URLs (dynamic routes)
    const isAccessible = page.isTemplate ? true : await validateUrl(fullUrl);
    
    if (isAccessible) {
      const lastmod = getLastModified(page.file);
      xml += '  <url>\n';
      xml += `    <loc>${fullUrl}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
      validPages++;
      const status = page.isTemplate ? '📝' : '✅';
      console.log(`${status} Added: ${canonicalUrl}${page.isTemplate ? ' (template)' : ''}`);
    } else {
      console.log(`❌ Skipped (not accessible): ${canonicalUrl}`);
      invalidPages++;
    }
  }

  xml += '</urlset>';

  // Write to dist directory (Vite build output)
  writeFileSync('dist/sitemap.xml', xml);
  
  console.log('\n' + '='.repeat(50));
  console.log('SITEMAP GENERATION SUMMARY:');
  console.log('='.repeat(50));
  console.log(`✅ Valid pages added: ${validPages}`);
  console.log(`❌ Invalid pages skipped: ${invalidPages}`);
  console.log(`📄 Sitemap generated at: dist/sitemap.xml`);
  console.log(`🌐 Base URL: ${base}`);
  
  if (invalidPages > 0) {
    console.log('\n⚠️  Warning: Some pages are not accessible and were excluded from the sitemap.');
    console.log('   Run "node scripts/check-redirects.js" to diagnose issues.');
  }
  
  // Generate sitemap index if needed
  if (validPages > 50000) {
    console.log('\n📊 Large sitemap detected. Consider splitting into multiple sitemaps.');
  }
}

// Run the generation
generateSitemap().catch(console.error); 
import { readFileSync } from 'node:fs';

try {
  // Read the sitemap file
  const sitemapContent = readFileSync('dist/sitemap.xml', 'utf8');
  
  console.log('Sitemap Validation Results:');
  console.log('==========================');
  
  // Simple checks
  const hasXmlDeclaration = sitemapContent.startsWith('<?xml version="1.0" encoding="UTF-8"?>');
  const hasUrlset = sitemapContent.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  const hasClosingUrlset = sitemapContent.includes('</urlset>');
  const urlCount = (sitemapContent.match(/<url>/g) || []).length;
  const hasLoc = sitemapContent.includes('<loc>');
  const hasLastmod = sitemapContent.includes('<lastmod>');
  const hasChangefreq = sitemapContent.includes('<changefreq>');
  const hasPriority = sitemapContent.includes('<priority>');
  
  console.log(`XML Declaration: ${hasXmlDeclaration ? '✓' : '✗'}`);
  console.log(`Root urlset element: ${hasUrlset ? '✓' : '✗'}`);
  console.log(`Closing urlset tag: ${hasClosingUrlset ? '✓' : '✗'}`);
  console.log(`URL elements found: ${urlCount}`);
  console.log(`Location tags: ${hasLoc ? '✓' : '✗'}`);
  console.log(`Last modified tags: ${hasLastmod ? '✓' : '✗'}`);
  console.log(`Change frequency tags: ${hasChangefreq ? '✓' : '✗'}`);
  console.log(`Priority tags: ${hasPriority ? '✓' : '✗'}`);
  
  const allValid = hasXmlDeclaration && hasUrlset && hasClosingUrlset && urlCount > 0 && hasLoc && hasLastmod && hasChangefreq && hasPriority;
  
  if (allValid) {
    console.log('\n✅ Sitemap is valid and should be readable by Google!');
  } else {
    console.log('\n❌ Sitemap has issues that need to be fixed.');
  }
  
} catch (error) {
  console.error('Error reading sitemap file:', error.message);
  process.exit(1);
} 
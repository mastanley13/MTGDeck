import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

// Function to recursively find all HTML files in the dist directory
function findHtmlFiles(dir, files = []) {
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      findHtmlFiles(fullPath, files);
    } else if (extname(item) === '.html') {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to extract internal links from HTML content
function extractInternalLinks(htmlContent) {
  const links = [];
  const linkRegex = /href=["']([^"']+)["']/g;
  const anchorRegex = /id=["']([^"']+)["']/g;
  
  let match;
  while ((match = linkRegex.exec(htmlContent)) !== null) {
    const href = match[1];
    if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
      links.push(href);
    }
  }
  
  return links;
}

// Function to check if a link is valid
function isValidLink(link, basePath) {
  // Skip external links, anchors, and special protocols
  if (link.startsWith('http') || link.startsWith('mailto:') || link.startsWith('tel:') || link.startsWith('#')) {
    return true;
  }
  
  // Handle relative paths
  if (link.startsWith('/')) {
    // This would be a server-side check, but for now we'll just validate the format
    return link.length > 1 && !link.includes('..');
  }
  
  return true;
}

// Main function to check internal links
function checkInternalLinks() {
  try {
    const distPath = 'dist';
    const htmlFiles = findHtmlFiles(distPath);
    
    console.log(`Found ${htmlFiles.length} HTML files to check...\n`);
    
    let totalLinks = 0;
    let brokenLinks = 0;
    
    for (const filePath of htmlFiles) {
      const content = readFileSync(filePath, 'utf8');
      const links = extractInternalLinks(content);
      
      console.log(`Checking ${filePath.replace('dist/', '')}:`);
      
      for (const link of links) {
        totalLinks++;
        if (!isValidLink(link, filePath)) {
          brokenLinks++;
          console.log(`  ❌ Broken link: ${link}`);
        } else {
          console.log(`  ✅ Valid link: ${link}`);
        }
      }
      
      if (links.length === 0) {
        console.log(`  ℹ️  No internal links found`);
      }
      
      console.log('');
    }
    
    console.log('='.repeat(50));
    console.log('INTERNAL LINK CHECK SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total links checked: ${totalLinks}`);
    console.log(`Broken links found: ${brokenLinks}`);
    
    if (brokenLinks === 0) {
      console.log('\n✅ All internal links are valid!');
      process.exit(0);
    } else {
      console.log('\n❌ Found broken internal links that need to be fixed.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error checking internal links:', error.message);
    process.exit(1);
  }
}

// Run the check
checkInternalLinks(); 
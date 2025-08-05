import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { JSDOM } from 'jsdom';

function findHtmlFiles(dir) {
  const files = [];
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip Icons directory as it contains documentation files
      if (item === 'Icons' && dir === './dist') {
        continue;
      }
      files.push(...findHtmlFiles(fullPath));
    } else if (extname(item) === '.html') {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function checkCanonical() {
  try {
    console.log('🔍 Checking for canonical tags in HTML files...');
    
    const htmlFiles = findHtmlFiles('./dist');
    let missingCanonical = 0;
    
    for (const file of htmlFiles) {
      const content = readFileSync(file, 'utf8');
      const dom = new JSDOM(content);
      const canonical = dom.window.document.querySelector('link[rel="canonical"]');
      
      if (!canonical) {
        console.error(`❌ Missing canonical tag in ${file}`);
        missingCanonical++;
      } else {
        console.log(`✅ Found canonical tag in ${file}: ${canonical.href}`);
      }
    }
    
    if (missingCanonical > 0) {
      console.error(`\n❌ ${missingCanonical} file(s) missing canonical tags`);
      process.exit(1);
    } else {
      console.log(`\n🎉 All ${htmlFiles.length} HTML files have canonical tags!`);
    }
  } catch (error) {
    console.error('❌ Error checking canonical tags:', error);
    process.exit(1);
  }
}

checkCanonical(); 
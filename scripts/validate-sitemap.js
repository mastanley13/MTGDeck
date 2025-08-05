import { readFileSync } from 'node:fs';
import { XMLParser } from 'fast-xml-parser';

const base = 'https://www.aidecktutor.com';

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
    return false;
  }
}

// Function to validate sitemap XML structure
function validateSitemapXML(xmlContent) {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
    const result = parser.parse(xmlContent);
    
    if (!result.urlset || !result.urlset.url) {
      return { valid: false, error: 'Invalid sitemap structure' };
    }
    
    const urls = Array.isArray(result.urlset.url) ? result.urlset.url : [result.urlset.url];
    
    return {
      valid: true,
      urlCount: urls.length,
      urls: urls
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Function to check SEO best practices
function checkSEOBestPractices(urls) {
  const issues = [];
  const recommendations = [];
  
  // Check for required fields
  urls.forEach((url, index) => {
    if (!url.loc) {
      issues.push(`URL ${index + 1}: Missing <loc> tag`);
    }
    if (!url.lastmod) {
      issues.push(`URL ${index + 1}: Missing <lastmod> tag`);
    }
    if (!url.changefreq) {
      recommendations.push(`URL ${index + 1}: Consider adding <changefreq>`);
    }
    if (!url.priority) {
      recommendations.push(`URL ${index + 1}: Consider adding <priority>`);
    }
  });
  
  // Check for duplicate URLs
  const urlSet = new Set();
  urls.forEach((url, index) => {
    if (urlSet.has(url.loc)) {
      issues.push(`Duplicate URL found: ${url.loc}`);
    }
    urlSet.add(url.loc);
  });
  
  return { issues, recommendations };
}

// Main validation function
async function validateSitemap() {
  console.log('🔍 Validating sitemap...\n');
  
  try {
    // Read the generated sitemap
    const sitemapContent = readFileSync('dist/sitemap.xml', 'utf8');
    
    // Validate XML structure
    const xmlValidation = validateSitemapXML(sitemapContent);
    
    if (!xmlValidation.valid) {
      console.log(`❌ XML Validation Failed: ${xmlValidation.error}`);
      return;
    }
    
    console.log(`✅ XML Structure: Valid (${xmlValidation.urlCount} URLs found)`);
    
    // Check SEO best practices
    const seoCheck = checkSEOBestPractices(xmlValidation.urls);
    
    if (seoCheck.issues.length > 0) {
      console.log('\n❌ SEO Issues Found:');
      seoCheck.issues.forEach(issue => console.log(`   • ${issue}`));
    } else {
      console.log('\n✅ No SEO issues found');
    }
    
    if (seoCheck.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      seoCheck.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }
    
    // Validate URL accessibility (sample check)
    console.log('\n🌐 Testing URL accessibility (sampling 5 URLs)...');
    const sampleUrls = xmlValidation.urls.slice(0, 5);
    let accessibleCount = 0;
    
    for (const url of sampleUrls) {
      const isAccessible = await validateUrl(url.loc);
      const status = isAccessible ? '✅' : '❌';
      console.log(`${status} ${url.loc}`);
      if (isAccessible) accessibleCount++;
    }
    
    console.log(`\n📊 Accessibility Summary: ${accessibleCount}/${sampleUrls.length} sample URLs accessible`);
    
    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('SITEMAP VALIDATION SUMMARY:');
    console.log('='.repeat(50));
    console.log(`📄 Total URLs: ${xmlValidation.urlCount}`);
    console.log(`✅ XML Structure: Valid`);
    console.log(`❌ SEO Issues: ${seoCheck.issues.length}`);
    console.log(`💡 Recommendations: ${seoCheck.recommendations.length}`);
    console.log(`🌐 Sample Accessibility: ${accessibleCount}/${sampleUrls.length}`);
    
    if (seoCheck.issues.length === 0 && accessibleCount === sampleUrls.length) {
      console.log('\n🎉 Sitemap validation passed!');
    } else {
      console.log('\n⚠️  Sitemap validation completed with issues.');
    }
    
  } catch (error) {
    console.error('❌ Error reading sitemap:', error.message);
    console.log('\n💡 Make sure to run "node scripts/generate-sitemap.js" first.');
  }
}

// Run validation
validateSitemap().catch(console.error); 
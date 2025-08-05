import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// SEO validation configuration
const seoConfig = {
  requiredMetaTags: ['title', 'description'],
  recommendedMetaTags: ['keywords', 'author', 'robots'],
  socialMetaTags: ['og:title', 'og:description', 'og:image', 'twitter:card'],
  requiredCanonical: true,
  requiredRobots: true
};

// Function to check file for SEO elements
function checkFileForSEO(filePath, fileType = 'jsx') {
  const issues = [];
  const recommendations = [];
  
  try {
    const content = readFileSync(filePath, 'utf8');
    
    // Check for basic SEO elements
    if (!content.includes('<title>') && !content.includes('title=')) {
      issues.push('Missing title tag or title attribute');
    }
    
    if (!content.includes('description') && !content.includes('meta name="description"')) {
      issues.push('Missing meta description');
    }
    
    // Check for social media tags
    if (!content.includes('og:title') && !content.includes('og:description')) {
      recommendations.push('Consider adding Open Graph meta tags');
    }
    
    if (!content.includes('twitter:card')) {
      recommendations.push('Consider adding Twitter Card meta tags');
    }
    
    // Check for canonical URLs
    if (!content.includes('canonical')) {
      recommendations.push('Consider adding canonical URL');
    }
    
    // Check for structured data
    if (!content.includes('application/ld+json')) {
      recommendations.push('Consider adding structured data (JSON-LD)');
    }
    
    return { issues, recommendations };
  } catch (error) {
    return { 
      issues: [`Could not read file: ${error.message}`], 
      recommendations: [] 
    };
  }
}

// Function to validate page structure
function validatePageStructure() {
  const pages = [
    'src/pages/HomePage.jsx',
    'src/pages/DeckBuilder.jsx',
    'src/pages/CardSearchPage.jsx',
    'src/pages/CommanderAiPage.jsx',
    'src/pages/TutorAiPage.jsx',
    'src/pages/HowToPlayPage.jsx',
    'src/pages/BlogPage.jsx',
    'src/pages/ContactPage.jsx',
    'src/pages/SocialsPage.jsx',
    'src/pages/Legal.tsx',
    'src/pages/LoginPage.jsx',
    'src/pages/RegisterPage.jsx',
    'src/pages/About.tsx',
    'src/pages/UserProfilePage.jsx',
    'src/pages/DeckViewer.jsx'
  ];
  
  let totalIssues = 0;
  let totalRecommendations = 0;
  const pageResults = [];
  
  console.log('🔍 Checking page SEO structure...\n');
  
  pages.forEach(pagePath => {
    if (existsSync(pagePath)) {
      const result = checkFileForSEO(pagePath);
      const pageName = pagePath.split('/').pop();
      
      if (result.issues.length > 0 || result.recommendations.length > 0) {
        console.log(`📄 ${pageName}:`);
        if (result.issues.length > 0) {
          result.issues.forEach(issue => {
            console.log(`   ❌ ${issue}`);
            totalIssues++;
          });
        }
        if (result.recommendations.length > 0) {
          result.recommendations.forEach(rec => {
            console.log(`   💡 ${rec}`);
            totalRecommendations++;
          });
        }
        console.log('');
      }
      
      pageResults.push({
        page: pageName,
        issues: result.issues.length,
        recommendations: result.recommendations.length
      });
    }
  });
  
  return { totalIssues, totalRecommendations, pageResults };
}

// Function to check robots.txt
function validateRobotsTxt() {
  const robotsPath = 'public/robots.txt';
  const issues = [];
  const recommendations = [];
  
  if (!existsSync(robotsPath)) {
    issues.push('robots.txt file not found');
    return { issues, recommendations };
  }
  
  try {
    const content = readFileSync(robotsPath, 'utf8');
    
    if (!content.includes('Sitemap:')) {
      issues.push('Missing sitemap reference in robots.txt');
    }
    
    if (!content.includes('User-agent: *')) {
      issues.push('Missing User-agent directive');
    }
    
    if (!content.includes('Allow: /')) {
      recommendations.push('Consider adding explicit Allow directives');
    }
    
    return { issues, recommendations };
  } catch (error) {
    return { issues: [`Could not read robots.txt: ${error.message}`], recommendations: [] };
  }
}

// Function to check sitemap
function validateSitemapFile() {
  const sitemapPath = 'dist/sitemap.xml';
  const issues = [];
  const recommendations = [];
  
  if (!existsSync(sitemapPath)) {
    issues.push('sitemap.xml not found in dist directory');
    return { issues, recommendations };
  }
  
  try {
    const content = readFileSync(sitemapPath, 'utf8');
    
    if (!content.includes('<?xml version="1.0"')) {
      issues.push('Invalid XML declaration in sitemap');
    }
    
    if (!content.includes('<urlset')) {
      issues.push('Missing urlset element in sitemap');
    }
    
    const urlCount = (content.match(/<url>/g) || []).length;
    if (urlCount === 0) {
      issues.push('No URLs found in sitemap');
    } else {
      console.log(`✅ Sitemap contains ${urlCount} URLs`);
    }
    
    return { issues, recommendations };
  } catch (error) {
    return { issues: [`Could not read sitemap: ${error.message}`], recommendations: [] };
  }
}

// Main validation function
async function validateSEO() {
  console.log('🔍 Starting comprehensive SEO validation...\n');
  
  // Check page structure
  const pageResults = validatePageStructure();
  
  // Check robots.txt
  console.log('🤖 Checking robots.txt...');
  const robotsResults = validateRobotsTxt();
  if (robotsResults.issues.length > 0) {
    robotsResults.issues.forEach(issue => console.log(`   ❌ ${issue}`));
  } else {
    console.log('   ✅ robots.txt is properly configured');
  }
  
  // Check sitemap
  console.log('\n🗺️  Checking sitemap...');
  const sitemapResults = validateSitemapFile();
  if (sitemapResults.issues.length > 0) {
    sitemapResults.issues.forEach(issue => console.log(`   ❌ ${issue}`));
  } else {
    console.log('   ✅ sitemap.xml is properly configured');
  }
  
  // Summary
  const totalIssues = pageResults.totalIssues + robotsResults.issues.length + sitemapResults.issues.length;
  const totalRecommendations = pageResults.totalRecommendations + robotsResults.recommendations.length + sitemapResults.recommendations.length;
  
  console.log('\n' + '='.repeat(50));
  console.log('SEO VALIDATION SUMMARY:');
  console.log('='.repeat(50));
  console.log(`❌ Total Issues: ${totalIssues}`);
  console.log(`💡 Total Recommendations: ${totalRecommendations}`);
  console.log(`📄 Pages Checked: ${pageResults.pageResults.length}`);
  
  if (totalIssues === 0) {
    console.log('\n🎉 SEO validation passed! Your site is well-optimized for search engines.');
  } else {
    console.log('\n⚠️  SEO validation completed with issues that should be addressed.');
  }
  
  if (totalRecommendations > 0) {
    console.log('\n💡 Consider implementing the recommendations to further improve SEO.');
  }
}

// Run validation
validateSEO().catch(console.error); 
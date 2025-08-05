import { readFileSync } from 'node:fs';
import { XMLParser } from 'fast-xml-parser';

const base = 'https://www.aidecktutor.com';

// Parse the sitemap to get URLs
function parseSitemap() {
  try {
    const sitemapContent = readFileSync('dist/sitemap.xml', 'utf8');
    const parser = new XMLParser();
    const result = parser.parse(sitemapContent);
    
    return result.urlset.url.map(url => url.loc);
  } catch (error) {
    console.error('Error reading sitemap:', error.message);
    return [];
  }
}

async function checkRedirects() {
  const urls = parseSitemap();
  const redirectIssues = [];
  const redirectErrors = [];
  const notFoundUrls = [];

  console.log(`Checking ${urls.length} URLs for redirect issues...\n`);

  for (const url of urls) {
    try {
      // First check with manual redirect handling
      const response = await fetch(url, {
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AIDeckTutor-Bot/1.0)'
        }
      });

      if ([301, 302, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        redirectIssues.push({
          url,
          status: response.status,
          location: location || 'No location header'
        });
        console.log(`⚠️  REDIRECT: ${url} → ${response.status} → ${location}`);
      } else if (response.status === 404) {
        notFoundUrls.push(url);
        console.log(`❌ NOT FOUND: ${url}`);
      } else if (response.status !== 200) {
        redirectErrors.push({
          url,
          status: response.status
        });
        console.log(`❌ ERROR: ${url} → ${response.status}`);
      } else {
        console.log(`✅ OK: ${url}`);
      }

    } catch (error) {
      redirectErrors.push({
        url,
        error: error.message
      });
      console.log(`❌ FETCH ERROR: ${url} → ${error.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY:');
  console.log('='.repeat(50));
  
  if (redirectIssues.length > 0) {
    console.log(`\n🔴 REDIRECT ISSUES (${redirectIssues.length}):`);
    redirectIssues.forEach(issue => {
      console.log(`  ${issue.url} → ${issue.status} → ${issue.location}`);
    });
  }

  if (redirectErrors.length > 0) {
    console.log(`\n🔴 REDIRECT ERRORS (${redirectErrors.length}):`);
    redirectErrors.forEach(error => {
      console.log(`  ${error.url} → ${error.status || error.error}`);
    });
  }

  if (notFoundUrls.length > 0) {
    console.log(`\n🔴 NOT FOUND (${notFoundUrls.length}):`);
    notFoundUrls.forEach(url => {
      console.log(`  ${url}`);
    });
  }

  if (redirectIssues.length === 0 && redirectErrors.length === 0 && notFoundUrls.length === 0) {
    console.log('\n✅ All URLs are accessible without redirect issues!');
    process.exit(0);
  } else {
    console.log('\n❌ Found issues that need to be fixed before deployment.');
    process.exit(1);
  }
}

// Run the check
checkRedirects().catch(console.error); 
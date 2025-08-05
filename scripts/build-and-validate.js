import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

console.log('🚀 Starting comprehensive build and validation process...\n');

// Function to run a command and handle errors
function runCommand(command, description) {
  try {
    console.log(`📋 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

// Function to check if build is needed
function shouldBuild() {
  const distExists = existsSync('dist');
  const sitemapExists = existsSync('dist/sitemap.xml');
  
  if (!distExists) {
    console.log('📦 Build directory not found, building project...');
    return true;
  }
  
  if (!sitemapExists) {
    console.log('🗺️  Sitemap not found, regenerating...');
    return true;
  }
  
  return false;
}

// Main build and validation function
async function buildAndValidate() {
  const steps = [];
  
  // Step 1: Build the project if needed
  if (shouldBuild()) {
    steps.push(() => runCommand('npm run build', 'Building project'));
  } else {
    console.log('✅ Build directory and sitemap already exist\n');
  }
  
  // Step 2: Generate sitemap
  steps.push(() => runCommand('node scripts/generate-sitemap.js', 'Generating sitemap'));
  
  // Step 3: Validate sitemap
  steps.push(() => runCommand('node scripts/validate-sitemap.js', 'Validating sitemap'));
  
  // Step 4: Run SEO validation
  steps.push(() => runCommand('node scripts/validate-seo.js', 'Running SEO validation'));
  
  // Step 5: Check for any additional validation scripts
  if (existsSync('scripts/check-canonical.js')) {
    steps.push(() => runCommand('node scripts/check-canonical.js', 'Checking canonical URLs'));
  }
  
  if (existsSync('scripts/check-internal-links.js')) {
    steps.push(() => runCommand('node scripts/check-internal-links.js', 'Checking internal links'));
  }
  
  // Execute all steps
  let successCount = 0;
  let totalSteps = steps.length;
  
  for (const step of steps) {
    if (step()) {
      successCount++;
    }
  }
  
  // Final summary
  console.log('='.repeat(60));
  console.log('🏁 BUILD AND VALIDATION SUMMARY:');
  console.log('='.repeat(60));
  console.log(`✅ Successful steps: ${successCount}/${totalSteps}`);
  console.log(`📦 Build status: ${successCount >= 2 ? 'Ready' : 'Incomplete'}`);
  console.log(`🗺️  Sitemap status: ${successCount >= 3 ? 'Valid' : 'Issues detected'}`);
  console.log(`🔍 SEO status: ${successCount >= 4 ? 'Optimized' : 'Needs attention'}`);
  
  if (successCount === totalSteps) {
    console.log('\n🎉 All build and validation steps completed successfully!');
    console.log('🌐 Your site is ready for deployment and search engine indexing.');
  } else {
    console.log('\n⚠️  Some steps failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run the build and validation process
buildAndValidate().catch(error => {
  console.error('❌ Build and validation process failed:', error.message);
  process.exit(1);
}); 
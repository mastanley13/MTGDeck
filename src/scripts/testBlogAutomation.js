// Test script for Blog Automation System
// Run this to validate your setup and see examples

import { blogGenerationService, TOPIC_TEMPLATES } from '../services/blogGenerationService.js';
import { blogAutomation } from '../utils/blogAutomation.js';
import { validateBlogAutomationConfig, getMTGVariables } from '../config/blogAutomationConfig.js';

class BlogAutomationTester {
  constructor() {
    this.testResults = [];
  }

  // Main test runner
  async runAllTests() {
    console.log('🚀 Starting Blog Automation System Tests...\n');
    
    try {
      await this.testConfiguration();
      await this.testTopicGeneration();
      await this.testContentGeneration();
      await this.testSEOOptimization();
      await this.testSocialMediaGeneration();
      await this.testBatchGeneration();
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  // Test 1: Configuration Validation
  async testConfiguration() {
    console.log('📋 Testing Configuration...');
    
    try {
      validateBlogAutomationConfig();
      this.logSuccess('Configuration validation passed');
    } catch (error) {
      this.logError('Configuration validation failed', error.message);
      throw error;
    }
  }

  // Test 2: Topic Generation
  async testTopicGeneration() {
    console.log('\n🎯 Testing Topic Generation...');
    
    try {
      // Test template-based topic generation
      const mtgVars = getMTGVariables();
      const randomCommander = mtgVars.commanders[Math.floor(Math.random() * mtgVars.commanders.length)];
      const randomArchetype = mtgVars.archetypes[Math.floor(Math.random() * mtgVars.archetypes.length)];
      
      const deckGuideTopic = blogGenerationService.generateTopicFromTemplate('deckGuides', {
        commander: randomCommander,
        archetype: randomArchetype
      });
      
      console.log(`Generated topic: "${deckGuideTopic}"`);
      this.logSuccess('Topic generation from templates');
      
      // Test weekly topic generation
      const weeklyTopics = blogGenerationService.generateWeeklyTopics();
      console.log(`Generated ${weeklyTopics.length} weekly topics:`);
      weeklyTopics.forEach((topic, index) => {
        console.log(`  ${index + 1}. ${topic}`);
      });
      
      this.logSuccess('Weekly topic generation');
      
    } catch (error) {
      this.logError('Topic generation failed', error.message);
    }
  }

  // Test 3: Content Generation (Mock Test)
  async testContentGeneration() {
    console.log('\n📝 Testing Content Generation...');
    
    try {
      // Note: This would require OpenAI API key to actually work
      const testTopic = "Budget Atraxa Commander: Under $100 Deck Tech";
      
      console.log(`Test topic: "${testTopic}"`);
      console.log('Note: Actual generation requires OpenAI API key');
      
      // Test the prompt building
      const prompt = blogGenerationService.buildBasePrompt().replace('{{TOPIC}}', testTopic);
      console.log('✅ Prompt template built successfully');
      console.log(`Prompt length: ${prompt.length} characters`);
      
      this.logSuccess('Content generation setup (requires API key for full test)');
      
    } catch (error) {
      this.logError('Content generation test failed', error.message);
    }
  }

  // Test 4: SEO Optimization
  async testSEOOptimization() {
    console.log('\n🔍 Testing SEO Optimization...');
    
    try {
      const mockPost = {
        title: "This is a very long title about Magic The Gathering Commander that exceeds sixty characters",
        metaDescription: "This is a very long meta description that definitely exceeds the recommended one hundred fifty-five character limit for search engine optimization and should be truncated",
        content: "<h1>Test Content</h1><p>This is test content for SEO optimization.</p>",
        tags: ['mtg', 'commander', 'strategy', 'deck-building', 'budget', 'competitive', 'casual', 'edh', 'extra-tag'],
        excerpt: "Test excerpt for the blog post"
      };
      
      const optimizedPost = blogAutomation.optimizeForSEO(mockPost);
      
      console.log('Original title length:', mockPost.title.length);
      console.log('Optimized title length:', optimizedPost.title.length);
      console.log('Original tags count:', mockPost.tags.length);
      console.log('Optimized tags count:', optimizedPost.tags.length);
      console.log('Generated slug:', optimizedPost.slug);
      
      // Validate optimizations
      if (optimizedPost.title.length <= 60) {
        this.logSuccess('Title optimization (length check)');
      } else {
        this.logError('Title optimization failed', 'Title still too long');
      }
      
      if (optimizedPost.metaDescription.length <= 155) {
        this.logSuccess('Meta description optimization');
      } else {
        this.logError('Meta description optimization failed', 'Description still too long');
      }
      
      if (optimizedPost.tags.length <= 8) {
        this.logSuccess('Tags optimization');
      } else {
        this.logError('Tags optimization failed', 'Too many tags');
      }
      
    } catch (error) {
      this.logError('SEO optimization test failed', error.message);
    }
  }

  // Test 5: Social Media Generation
  async testSocialMediaGeneration() {
    console.log('\n📱 Testing Social Media Generation...');
    
    try {
      const mockPost = {
        title: "Complete Atraxa Commander Guide: Strategy & Build",
        excerpt: "Learn how to build the perfect Atraxa deck with our comprehensive guide covering strategy, card choices, and budget alternatives.",
        category: "Guides",
        tags: ['mtg', 'commander', 'atraxa', 'strategy']
      };
      
      const socialSnippets = blogAutomation.generateSocialSnippets(mockPost);
      
      console.log('Generated social media content:');
      console.log('\n📘 Facebook:');
      console.log(socialSnippets.facebook);
      
      console.log('\n🐦 Twitter:');
      console.log(socialSnippets.twitter);
      
      console.log('\n💼 LinkedIn:');
      console.log(socialSnippets.linkedin);
      
      console.log('\n🔴 Reddit:');
      console.log(`Title: ${socialSnippets.reddit.title}`);
      console.log(`Body: ${socialSnippets.reddit.body}`);
      
      console.log('\n📸 Instagram:');
      console.log(socialSnippets.instagram);
      
      // Validate character limits
      if (socialSnippets.twitter.length <= 240) {
        this.logSuccess('Twitter character limit check');
      } else {
        this.logError('Twitter character limit exceeded', `${socialSnippets.twitter.length} characters`);
      }
      
      this.logSuccess('Social media content generation');
      
    } catch (error) {
      this.logError('Social media generation test failed', error.message);
    }
  }

  // Test 6: Batch Generation
  async testBatchGeneration() {
    console.log('\n📚 Testing Batch Generation...');
    
    try {
      // Test content series creation
      const contentSeries = blogAutomation.createContentSeries('MTG Budget Builds', 3);
      
      console.log('Generated content series:');
      console.log(`Theme: ${contentSeries.theme}`);
      console.log(`Posts: ${contentSeries.posts.length}`);
      contentSeries.posts.forEach(post => {
        console.log(`  - ${post.title} (Order: ${post.order})`);
      });
      
      this.logSuccess('Content series generation');
      
      // Test publish schedule generation
      const schedule = blogAutomation.generatePublishSchedule(5);
      console.log(`\nGenerated publish schedule for 5 posts:`);
      schedule.forEach((date, index) => {
        console.log(`  ${index + 1}. ${new Date(date).toLocaleDateString()}`);
      });
      
      this.logSuccess('Publish schedule generation');
      
    } catch (error) {
      this.logError('Batch generation test failed', error.message);
    }
  }

  // Test utilities
  logSuccess(testName) {
    const result = { name: testName, status: '✅ PASS' };
    this.testResults.push(result);
    console.log(`✅ ${testName}`);
  }

  logError(testName, details) {
    const result = { name: testName, status: '❌ FAIL', details };
    this.testResults.push(result);
    console.log(`❌ ${testName}: ${details}`);
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.status.includes('PASS')).length;
    const failed = this.testResults.filter(r => r.status.includes('FAIL')).length;
    
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Blog automation system is ready to use.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the details above.');
    }
    
    console.log('\n📋 Detailed Results:');
    this.testResults.forEach(result => {
      console.log(`${result.status} ${result.name}`);
      if (result.details) {
        console.log(`   └─ ${result.details}`);
      }
    });
  }
}

// Example usage functions
export class BlogAutomationExamples {
  
  // Example 1: Generate a single blog post
  static async generateSinglePost() {
    console.log('📝 Example: Generate Single Post');
    
    const topic = "Complete Korvold Commander Guide: Strategy & Build";
    
    try {
      // Note: Requires OpenAI API key
      const post = await blogGenerationService.generateBlogPost(topic);
      console.log('Generated post:', post.title);
      return post;
    } catch (error) {
      console.log('Note: Requires OpenAI API key to generate actual content');
      console.log('Mock post structure would be returned');
    }
  }
  
  // Example 2: Generate weekly content batch
  static async generateWeeklyBatch() {
    console.log('📚 Example: Generate Weekly Batch');
    
    const customTopics = [
      "Budget Elves Tribal: Under $75 Commander Build",
      "Meta Analysis: Best Green Commanders in 2024", 
      "Card Spotlight: Why Rhystic Study is Meta-Changing",
      "How Lost Caverns Changes the Commander Meta",
      "Commander Politics: When to Make Alliances"
    ];
    
    console.log('Topics for weekly batch:');
    customTopics.forEach((topic, index) => {
      console.log(`  ${index + 1}. ${topic}`);
    });
    
    // Note: Would actually generate content with API key
    console.log('Note: Full generation requires OpenAI API key');
  }
  
  // Example 3: Optimize existing content
  static optimizeExistingContent() {
    console.log('🔍 Example: Optimize Existing Content');
    
    const existingPost = {
      title: "Atraxa deck guide that needs SEO optimization and is way too long",
      content: "<h1>My Guide</h1><p>Content here...</p>",
      excerpt: "This is a really long excerpt that probably exceeds the recommended length for meta descriptions in search engines",
      tags: ['magic', 'cards', 'game', 'strategy', 'deck', 'commander', 'edh', 'atraxa', 'superfriends']
    };
    
    const optimized = blogAutomation.optimizeForSEO(existingPost);
    const socialSnippets = blogAutomation.generateSocialSnippets(optimized);
    
    console.log('Optimized title:', optimized.title);
    console.log('Generated slug:', optimized.slug);
    console.log('Social media ready:', Object.keys(socialSnippets).join(', '));
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new BlogAutomationTester();
  tester.runAllTests();
}

export { BlogAutomationTester }; 
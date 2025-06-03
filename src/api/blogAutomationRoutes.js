// Backend API routes for blog automation
// These can be integrated into your existing Express.js backend

import { blogGenerationService, TOPIC_TEMPLATES } from '../services/blogGenerationService.js';
import { blogAutomation } from '../utils/blogAutomation.js';

// Blog automation API routes
export const blogAutomationRoutes = {

  // Manual blog generation
  async generateSinglePost(req, res) {
    try {
      const { topic, options = {} } = req.body;
      
      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }

      const generatedPost = await blogGenerationService.generateBlogPost(topic, options);
      
      res.json({
        success: true,
        post: generatedPost,
        message: 'Blog post generated successfully'
      });
      
    } catch (error) {
      console.error('Error generating blog post:', error);
      res.status(500).json({ 
        error: 'Failed to generate blog post',
        details: error.message 
      });
    }
  },

  // Generate and immediately publish
  async generateAndPublish(req, res) {
    try {
      const { topic, publishOptions = {}, generationOptions = {} } = req.body;
      
      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }

      const result = await blogGenerationService.automateFullPipeline(topic, {
        generation: generationOptions,
        publishing: publishOptions,
        autoSocial: publishOptions.autoSocial || false
      });

      res.json({
        success: true,
        postId: result.postId,
        post: result.postData,
        message: 'Blog post generated and published successfully'
      });
      
    } catch (error) {
      console.error('Error in generate and publish:', error);
      res.status(500).json({ 
        error: 'Failed to generate and publish blog post',
        details: error.message 
      });
    }
  },

  // Batch generate weekly content
  async generateWeeklyBatch(req, res) {
    try {
      const { topics, publishImmediately = false } = req.body;
      
      const generatedPosts = await blogGenerationService.generateWeeklyContent(topics);
      const results = [];

      if (publishImmediately) {
        for (const post of generatedPosts) {
          try {
            const postId = await blogGenerationService.publishToGHL(post);
            results.push({ success: true, postId, title: post.title });
          } catch (publishError) {
            results.push({ 
              success: false, 
              title: post.title, 
              error: publishError.message 
            });
          }
        }
      }

      res.json({
        success: true,
        generated: generatedPosts.length,
        published: publishImmediately ? results.filter(r => r.success).length : 0,
        posts: publishImmediately ? results : generatedPosts,
        message: `Generated ${generatedPosts.length} blog posts`
      });
      
    } catch (error) {
      console.error('Error generating weekly batch:', error);
      res.status(500).json({ 
        error: 'Failed to generate weekly blog batch',
        details: error.message 
      });
    }
  },

  // Get topic suggestions
  async getTopicSuggestions(req, res) {
    try {
      const { category, variables = {} } = req.query;
      
      if (category && TOPIC_TEMPLATES[category]) {
        const topics = TOPIC_TEMPLATES[category].map(template => {
          let topic = template;
          Object.keys(variables).forEach(key => {
            topic = topic.replace(`{${key}}`, variables[key]);
          });
          return topic;
        });
        
        res.json({ success: true, topics, category });
      } else {
        // Return all categories with sample topics
        const allSuggestions = {};
        Object.keys(TOPIC_TEMPLATES).forEach(cat => {
          allSuggestions[cat] = TOPIC_TEMPLATES[cat].slice(0, 3); // First 3 from each
        });
        
        res.json({ success: true, suggestions: allSuggestions });
      }
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get topic suggestions',
        details: error.message 
      });
    }
  },

  // Schedule content generation
  async scheduleGeneration(req, res) {
    try {
      const { 
        topics, 
        schedule = 'weekly', 
        startDate = new Date(),
        publishOptions = {} 
      } = req.body;

      // Create scheduled jobs (this would integrate with your job scheduler)
      const scheduledJobs = [];
      
      if (schedule === 'weekly') {
        // Schedule topics for weekly generation
        topics.forEach((topic, index) => {
          const scheduleDate = new Date(startDate);
          scheduleDate.setDate(startDate.getDate() + (index * 7)); // Weekly intervals
          
          scheduledJobs.push({
            id: `blog_gen_${Date.now()}_${index}`,
            topic,
            scheduledFor: scheduleDate.toISOString(),
            status: 'scheduled',
            publishOptions
          });
        });
      }

      // Save to your job queue/database
      // await saveScheduledJobs(scheduledJobs);

      res.json({
        success: true,
        scheduled: scheduledJobs.length,
        jobs: scheduledJobs,
        message: `Scheduled ${scheduledJobs.length} blog generation jobs`
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to schedule blog generation',
        details: error.message 
      });
    }
  },

  // Optimize existing post
  async optimizeExistingPost(req, res) {
    try {
      const { postId } = req.params;
      const { optimizations = ['seo', 'social'] } = req.body;

      // Get existing post from GHL
      const existingPost = await blogService.getPostById(postId);
      if (!existingPost) {
        return res.status(404).json({ error: 'Post not found' });
      }

      let optimizedPost = { ...existingPost };

      // Apply optimizations
      if (optimizations.includes('seo')) {
        optimizedPost = blogAutomation.optimizeForSEO(optimizedPost);
      }

      if (optimizations.includes('social')) {
        const socialSnippets = blogAutomation.generateSocialSnippets(optimizedPost);
        optimizedPost.socialSnippets = socialSnippets;
      }

      // Update post in GHL
      await blogService.updatePost(postId, optimizedPost);

      res.json({
        success: true,
        post: optimizedPost,
        message: 'Post optimized successfully'
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to optimize post',
        details: error.message 
      });
    }
  },

  // Analytics and performance
  async getBlogAnalytics(req, res) {
    try {
      const { timeframe = '30d' } = req.query;
      
      // Get analytics data (integrate with your analytics service)
      const analytics = {
        totalPosts: 0,
        totalViews: 0,
        averageReadTime: '0:00',
        topPerformingPosts: [],
        categoryPerformance: {},
        timeframe
      };

      // This would be populated from your actual analytics service
      
      res.json({
        success: true,
        analytics,
        message: 'Analytics retrieved successfully'
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get analytics',
        details: error.message 
      });
    }
  }
};

// Express route setup (integrate into your existing Express app)
export function setupBlogAutomationRoutes(app) {
  // Generation routes
  app.post('/api/blog/generate', blogAutomationRoutes.generateSinglePost);
  app.post('/api/blog/generate-and-publish', blogAutomationRoutes.generateAndPublish);
  app.post('/api/blog/generate-batch', blogAutomationRoutes.generateWeeklyBatch);
  
  // Topic and planning routes
  app.get('/api/blog/topic-suggestions', blogAutomationRoutes.getTopicSuggestions);
  app.post('/api/blog/schedule-generation', blogAutomationRoutes.scheduleGeneration);
  
  // Optimization routes
  app.patch('/api/blog/optimize/:postId', blogAutomationRoutes.optimizeExistingPost);
  
  // Analytics routes
  app.get('/api/blog/analytics', blogAutomationRoutes.getBlogAnalytics);
}

// Cron job functions for scheduled automation
export const cronJobs = {
  
  // Weekly content generation (Mondays at 9 AM)
  async weeklyContentGeneration() {
    try {
      console.log('Starting weekly content generation...');
      
      const topics = blogGenerationService.generateWeeklyTopics();
      const generatedPosts = await blogGenerationService.generateWeeklyContent(topics);
      
      // Save as drafts for review
      const savedPosts = [];
      for (const post of generatedPosts) {
        try {
          const postId = await blogGenerationService.publishToGHL(post, { 
            published: false // Save as draft
          });
          savedPosts.push({ postId, title: post.title });
        } catch (error) {
          console.error(`Failed to save post: ${post.title}`, error);
        }
      }
      
      console.log(`Weekly generation complete: ${savedPosts.length} posts created`);
      return savedPosts;
      
    } catch (error) {
      console.error('Error in weekly content generation:', error);
      throw error;
    }
  },

  // Daily SEO optimization check (Daily at 10 AM)
  async dailySEOOptimization() {
    try {
      console.log('Starting daily SEO optimization...');
      
      // Get recent posts that might need optimization
      const recentPosts = await blogService.getAllPosts();
      const postsToOptimize = recentPosts.filter(post => {
        const postDate = new Date(post.date);
        const daysSinceCreated = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreated <= 7; // Posts from last week
      });

      for (const post of postsToOptimize) {
        try {
          const optimizedPost = blogAutomation.optimizeForSEO(post);
          await blogService.updatePost(post.id, optimizedPost);
          console.log(`Optimized post: ${post.title}`);
        } catch (error) {
          console.error(`Failed to optimize post: ${post.title}`, error);
        }
      }
      
      console.log(`SEO optimization complete: ${postsToOptimize.length} posts processed`);
      
    } catch (error) {
      console.error('Error in daily SEO optimization:', error);
      throw error;
    }
  },

  // Social media content generation (Daily at 2 PM)
  async dailySocialGeneration() {
    try {
      console.log('Starting daily social content generation...');
      
      // Get today's published posts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysPosts = await blogService.getAllPosts();
      const newPosts = todaysPosts.filter(post => {
        const postDate = new Date(post.date);
        return postDate >= today && post.published;
      });

      for (const post of newPosts) {
        try {
          const socialSnippets = blogAutomation.generateSocialSnippets(post);
          // Schedule social media posts (integrate with your social scheduler)
          console.log(`Generated social content for: ${post.title}`);
        } catch (error) {
          console.error(`Failed to generate social content for: ${post.title}`, error);
        }
      }
      
      console.log(`Social generation complete: ${newPosts.length} posts processed`);
      
    } catch (error) {
      console.error('Error in daily social generation:', error);
      throw error;
    }
  }
};

// Node-cron setup (add to your backend)
export function setupCronJobs() {
  const cron = require('node-cron');
  
  // Weekly content generation - Mondays at 9 AM
  cron.schedule('0 9 * * 1', cronJobs.weeklyContentGeneration);
  
  // Daily SEO optimization - Every day at 10 AM  
  cron.schedule('0 10 * * *', cronJobs.dailySEOOptimization);
  
  // Daily social content - Every day at 2 PM
  cron.schedule('0 14 * * *', cronJobs.dailySocialGeneration);
  
  console.log('Blog automation cron jobs scheduled');
} 
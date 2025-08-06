import express from 'express';
import { blogService } from '../services/blogService.js';

const router = express.Router();

// Get all blog posts
router.get('/blog', async (req, res) => {
  try {
    const posts = await blogService.getAllPosts();
    res.json(posts);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch blog posts',
      details: error.message 
    });
  }
});

// Get single blog post by slug
router.get('/blog/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await blogService.getPostBySlug(slug);
    
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ 
      error: 'Failed to fetch blog post',
      details: error.message 
    });
  }
});

// Sync blog posts from RSS feed
router.post('/sync-blog', async (req, res) => {
  try {
    const { forceUpdate = false } = req.body;
    const result = await blogService.syncBlogPosts(forceUpdate);
    
    res.json({
      success: true,
      ...result,
      message: `Successfully synced ${result.total} blog posts`
    });
  } catch (error) {
    console.error('Error syncing blog posts:', error);
    res.status(500).json({ 
      error: 'Failed to sync blog posts',
      details: error.message 
    });
  }
});

// Get blog posts by category
router.get('/blog/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const posts = await blogService.getPostsByCategory(category);
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching blog posts by category:', error);
    res.status(500).json({ 
      error: 'Failed to fetch blog posts by category',
      details: error.message 
    });
  }
});

// Health check for blog service
router.get('/blog/health', async (req, res) => {
  try {
    const posts = await blogService.getAllPosts();
    res.json({
      status: 'healthy',
      postCount: posts.length,
      lastSync: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router; 
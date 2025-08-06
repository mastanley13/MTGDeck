import axios from 'axios';
import DOMPurify from 'dompurify';
import GHLContentProcessor from '../utils/ghlContentProcessor.js';

// Enhanced blog service with GHL integration
export const blogService = {
  async getAllPosts() {
    try {
      const RSS_FEED_URL = import.meta.env.VITE_RSS_FEED_URL || 'https://rss-link.com/feed/zKZ8Zy6VvGR1m7lNfRkY?blogId=EeuF91p1BQgGYNd7t7Jf&limit=30&loadContent=true';
      
      const response = await axios.get(RSS_FEED_URL);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, 'text/xml');
      const items = xmlDoc.getElementsByTagName('item');
      
      return Array.from(items).map(item => {
        const rawContent = item.getElementsByTagName('content:encoded')[0]?.textContent || '';
        
        // Process content using GHL Content Processor
        const processedContent = GHLContentProcessor.processContent(rawContent, {
          removeCustomBlocks: true,
          extractImages: true,
          sanitizeHTML: true,
          preserveStyles: false
        });
        
        // Extract first image for featured image
        let featuredImage = '';
        if (processedContent.extractedImages.length > 0) {
          featuredImage = processedContent.extractedImages[0];
        } else {
          // Fallback: try to extract from original content
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = rawContent;
          const firstImage = tempDiv.querySelector('img')?.src || '';
          featuredImage = firstImage;
        }
        
        // Generate excerpt from processed content
        let excerpt = item.getElementsByTagName('description')[0]?.textContent || '';
        if (!excerpt && processedContent.cleanContent) {
          excerpt = GHLContentProcessor.generateExcerpt(processedContent.cleanContent, 150);
        }
        
        // Calculate read time
        const readTime = GHLContentProcessor.calculateReadTime(processedContent.cleanContent);
        
        // Generate slug from title
        const title = item.getElementsByTagName('title')[0]?.textContent || 'Untitled Post';
        const slug = GHLContentProcessor.generateSlug(title);
        
        return {
          id: item.getElementsByTagName('guid')[0]?.textContent || `ghl-${Date.now()}`,
          title: title,
          slug: slug,
          excerpt: excerpt,
          content: processedContent.cleanContent,
          date: item.getElementsByTagName('pubDate')[0]?.textContent || new Date().toISOString(),
          image: featuredImage,
          category: 'Blog',
          readTime: readTime,
          author: {
            name: item.getElementsByTagName('dc:creator')[0]?.textContent || 'AI Deck Tutor',
            avatar: null
          },
          tags: this.extractTags(item),
          published: true,
          lastModified: item.getElementsByTagName('pubDate')[0]?.textContent || new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Error fetching RSS feed:', error);
      throw new Error('Failed to fetch blog posts from RSS feed');
    }
  },

  extractTags(item) {
    const categories = item.getElementsByTagName('category');
    const tags = [];
    
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i].textContent?.trim();
      if (category) {
        tags.push(category);
      }
    }
    
    // Add default tags if none found
    if (tags.length === 0) {
      tags.push('MTG', 'Commander');
    }
    
    return tags;
  },

  async getPostsByCategory(category) {
    const posts = await this.getAllPosts();
    return posts.filter(post => post.category === category);
  },

  async getPostBySlug(slug) {
    const posts = await this.getAllPosts();
    return posts.find(post => post.slug === slug) || null;
  },

  // Sync blog posts (for future API implementation)
  async syncBlogPosts(forceUpdate = false) {
    try {
      const posts = await this.getAllPosts();
      
      // In a full implementation, this would save to database
      console.log(`Synced ${posts.length} blog posts`);
      
      return {
        imported: posts.length,
        updated: 0,
        total: posts.length
      };
    } catch (error) {
      console.error('Error syncing blog posts:', error);
      throw error;
    }
  }
}; 
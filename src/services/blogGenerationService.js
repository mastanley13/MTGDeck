import axios from 'axios';
import { blogService } from './blogService';

// Blog Content Framework as defined in BlogNotes2.0
const BLOG_FRAMEWORK = {
  structure: {
    title: 'SEO-optimized with MTG keywords',
    intro: 'Hook + what the post will cover',
    mainSections: [
      'Deck strategy',
      'Card analysis', 
      'Meta shifts',
      'Commander combos',
      'Budget vs competitive builds'
    ],
    finalThoughts: 'Summary + call to comment/share',
    tags: 'Used for GHL blog filtering'
  },
  targetLength: '1000-1500 words',
  tone: 'Friendly for Commander players',
  format: 'HTML with proper headings'
};

// Topic Templates for Content Generation
const TOPIC_TEMPLATES = {
  deckGuides: [
    "Complete {commander} Commander Deck Guide: Strategy & Build",
    "Budget {archetype} Commander: Under $100 Deck Tech", 
    "Competitive {commander} cEDH Build and Strategy",
    "Upgrading {precon}: From Precon to Powerhouse",
    "5 Hidden Gems for {color} Commander Decks"
  ],
  strategy: [
    "Mastering {mechanic}: Advanced Commander Strategies",
    "Meta Analysis: Best {color} Commanders in 2024",
    "How to Play Against {archetype} Decks",
    "Building Around {cardType}: A Complete Guide",
    "Commander Politics: When to Make Alliances"
  ],
  cardAnalysis: [
    "Card Spotlight: Why {cardName} is Meta-Changing",
    "Underrated Cards Every {color} Deck Needs",
    "New Cards from {setName}: Commander Impact",
    "Best {manaValue} CMC Cards for Commander",
    "Reprints vs Originals: What to Buy Now"
  ],
  metaShifts: [
    "How {newSet} Changes the Commander Meta",
    "Rise of {archetype}: New Meta Contender", 
    "Banned List Update: What It Means for EDH",
    "Format Health: Is Commander Too Fast?",
    "cEDH vs Casual: Finding the Balance"
  ],
  budget: [
    "Commander on a Budget: {archetype} for Under ${amount}",
    "Proxy vs Budget: Building Affordable Decks",
    "Best Bang for Buck: {color} Staples Under $5",
    "Budget Alternatives to Expensive {cardType}",
    "Building Competitive Decks Without Breaking the Bank"
  ]
};

// OpenAI Integration
class BlogGenerationService {
  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.basePrompt = this.buildBasePrompt();
  }

  // Core prompt template from BlogNotes2.0
  buildBasePrompt() {
    return `You are an expert Magic: The Gathering content creator specializing in Commander (EDH) format. 

Write a comprehensive, engaging blog post about "{{TOPIC}}".

STRUCTURE REQUIREMENTS:
- Title: SEO-optimized H1 with MTG keywords (60 chars max)
- Meta Description: Compelling summary (155 chars max)  
- Introduction: Hook readers + preview what they'll learn
- 3-4 Main Sections: Choose from deck strategy, card analysis, meta insights, commander synergies, budget considerations
- Conclusion: Summary + call-to-action to engage with community
- Word Count: 1000-1500 words
- Tone: Friendly, knowledgeable, accessible to both new and experienced players

FORMAT REQUIREMENTS:
- Use proper HTML formatting
- H1 for title, H2 for main sections, H3 for subsections
- Include bullet points and numbered lists where appropriate
- Add strategic insights and specific card recommendations
- Include deck building tips and play patterns

SEO REQUIREMENTS:
- Include keywords: MTG, Commander, EDH, deck building, strategy
- Use related terms naturally throughout
- Suggest 5-8 relevant tags
- Include calls-to-action for engagement

CONTENT QUALITY:
- Provide actionable advice
- Include specific card examples with explanations
- Discuss both budget and optimized options
- Address common player questions and scenarios
- End with questions to encourage comments

Return the response in this JSON format:
{
  "title": "SEO-optimized title",
  "metaDescription": "Compelling 155-char description", 
  "content": "Full HTML content with proper formatting",
  "excerpt": "Brief 2-3 sentence summary",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "Guides|Strategy|Deck Ideas|News",
  "readTime": "X min read"
}`;
  }

  // Generate blog post using OpenAI
  async generateBlogPost(topic, options = {}) {
    try {
      const prompt = this.basePrompt.replace('{{TOPIC}}', topic);
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: options.model || 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert MTG Commander content creator.'
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          max_tokens: options.maxTokens || 3000,
          temperature: options.temperature || 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const generatedContent = response.data.choices[0].message.content;
      
      // Parse JSON response
      let parsedContent;
      try {
        parsedContent = JSON.parse(generatedContent);
      } catch (parseError) {
        // Fallback: extract content manually if JSON parsing fails
        parsedContent = this.parseNonJSONResponse(generatedContent, topic);
      }

      // Enhance with SEO optimizations
      const optimizedPost = this.enhanceWithSEO(parsedContent);
      
      return optimizedPost;
      
    } catch (error) {
      console.error('Error generating blog post:', error);
      throw new Error('Failed to generate blog content');
    }
  }

  // Fallback content parser for non-JSON responses
  parseNonJSONResponse(content, topic) {
    const lines = content.split('\n');
    const title = lines.find(line => line.includes('<h1>') || line.toLowerCase().includes(topic.slice(0, 20))) || `MTG Guide: ${topic}`;
    
    return {
      title: title.replace(/<[^>]*>/g, '').trim(),
      metaDescription: `Complete guide to ${topic} in Magic: The Gathering Commander format.`,
      content: content,
      excerpt: `Learn everything about ${topic} in this comprehensive MTG Commander guide.`,
      tags: ['mtg', 'commander', 'edh', 'strategy', 'deck-building'],
      category: 'Guides',
      readTime: '5 min read'
    };
  }

  // SEO Enhancement from BlogNotes2.0
  enhanceWithSEO(postData) {
    return {
      ...postData,
      title: this.optimizeTitleForSEO(postData.title),
      metaDescription: this.optimizeMetaDescription(postData.metaDescription), 
      content: this.addSEOEnhancements(postData.content),
      tags: this.optimizeTags(postData.tags),
      slug: this.generateSEOSlug(postData.title)
    };
  }

  optimizeTitleForSEO(title) {
    // Ensure MTG/Commander keywords are present
    if (!title.toLowerCase().includes('mtg') && !title.toLowerCase().includes('commander')) {
      title = `MTG ${title}`;
    }
    
    // Limit to 60 characters for SEO
    return title.length > 60 ? title.substring(0, 57) + '...' : title;
  }

  optimizeMetaDescription(description) {
    // Ensure 150-155 character limit
    if (description.length > 155) {
      return description.substring(0, 152) + '...';
    }
    
    // Add MTG keywords if not present
    if (!description.toLowerCase().includes('mtg') && !description.toLowerCase().includes('commander')) {
      description = `MTG ${description}`;
    }
    
    return description;
  }

  addSEOEnhancements(content) {
    // Add schema markup, improve heading structure, etc.
    return content
      .replace(/<h1>/g, '<h1 itemprop="headline">')
      .replace(/<img([^>]*)>/g, '<img$1 loading="lazy">');
  }

  optimizeTags(tags) {
    const essentialTags = ['mtg', 'commander', 'edh'];
    const combinedTags = [...new Set([...essentialTags, ...tags])];
    return combinedTags.slice(0, 8); // Limit to 8 tags for best SEO
  }

  generateSEOSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }

  // Topic Generation System
  generateTopicFromTemplate(category, variables = {}) {
    const templates = TOPIC_TEMPLATES[category];
    if (!templates) return null;
    
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Replace variables in template
    let topic = template;
    Object.keys(variables).forEach(key => {
      topic = topic.replace(`{${key}}`, variables[key]);
    });
    
    return topic;
  }

  // Batch Generation (Weekly Content)
  async generateWeeklyContent(topicList = null) {
    const topics = topicList || this.generateWeeklyTopics();
    const generatedPosts = [];
    
    for (const topic of topics) {
      try {
        console.log(`Generating content for: ${topic}`);
        const post = await this.generateBlogPost(topic);
        generatedPosts.push(post);
        
        // Rate limiting: wait 1 second between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to generate post for topic: ${topic}`, error);
      }
    }
    
    return generatedPosts;
  }

  generateWeeklyTopics() {
    return [
      this.generateTopicFromTemplate('deckGuides', { commander: 'Atraxa', archetype: 'Superfriends' }),
      this.generateTopicFromTemplate('strategy', { mechanic: 'Cascade', color: 'Temur' }),
      this.generateTopicFromTemplate('cardAnalysis', { cardName: 'Rhystic Study' }),
      this.generateTopicFromTemplate('metaShifts', { newSet: 'Murders at Karlov Manor' }),
      this.generateTopicFromTemplate('budget', { archetype: 'Voltron', amount: '50' })
    ];
  }

  // Publish to GoHighLevel
  async publishToGHL(postData, options = {}) {
    try {
      // Add author information
      const publishData = {
        ...postData,
        author: {
          id: options.authorId || 'default-author',
          name: options.authorName || 'MTG Strategy Team',
          avatar: options.authorAvatar || null
        },
        published: options.published !== false, // Default to published
        date: new Date().toISOString()
      };

      // Use existing blog service to create post
      const postId = await blogService.createPost(publishData);
      
      console.log(`Blog post published to GHL with ID: ${postId}`);
      return postId;
      
    } catch (error) {
      console.error('Error publishing to GHL:', error);
      throw new Error('Failed to publish blog post');
    }
  }

  // Complete automation pipeline
  async automateFullPipeline(topic, options = {}) {
    try {
      console.log(`Starting automated blog pipeline for: ${topic}`);
      
      // Step 1: Generate content
      const generatedPost = await this.generateBlogPost(topic, options.generation);
      
      // Step 2: Review/edit (if manual review is enabled)
      const finalPost = options.manualReview 
        ? await this.waitForManualReview(generatedPost)
        : generatedPost;
      
      // Step 3: Publish to GHL
      const postId = await this.publishToGHL(finalPost, options.publishing);
      
      // Step 4: Schedule social media (if automation is enabled)
      if (options.autoSocial) {
        await this.scheduleSocialMedia(finalPost, postId);
      }
      
      console.log(`Blog automation pipeline completed for: ${topic}`);
      return { postId, postData: finalPost };
      
    } catch (error) {
      console.error('Error in automation pipeline:', error);
      throw error;
    }
  }

  async scheduleSocialMedia(postData, postId) {
    // This would integrate with your social media scheduling service
    console.log(`Scheduling social media for post: ${postId}`);
    // Implementation depends on your social media automation setup
  }

  async waitForManualReview(postData) {
    // This would integrate with your review system
    console.log('Post queued for manual review');
    return postData; // For now, just return as-is
  }
}

// Export the service
export const blogGenerationService = new BlogGenerationService();

// Export topic templates for external use
export { TOPIC_TEMPLATES, BLOG_FRAMEWORK }; 
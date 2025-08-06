# GoHighLevel Blog RSS Integration Guide

This guide explains how to integrate GoHighLevel (GHL) blog content with your website using RSS feeds. The system processes both plaintext and HTML/CSS content from GHL's RSS feed and transforms it into clean, displayable blog posts.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [RSS Feed Processing](#rss-feed-processing)
5. [Content Processing](#content-processing)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

## Overview

The GHL Blog Integration system allows you to:

- **Fetch blog posts** from GoHighLevel via RSS feed
- **Process complex HTML/CSS content** from GHL's custom code blocks
- **Extract and clean content** while preserving images and formatting
- **Store posts in a database** for fast retrieval
- **Serve content via API endpoints** for your website

### Key Features

- **Automatic content cleaning**: Removes GHL's custom code containers while preserving meaningful content
- **Image extraction**: Automatically extracts and preserves images from posts
- **HTML sanitization**: Cleans and sanitizes HTML while maintaining safe elements
- **Slug generation**: Creates SEO-friendly URLs from post titles
- **Duplicate prevention**: Prevents duplicate posts using unique identifiers

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GoHighLevel   │    │   RSS Service    │    │   Database      │
│   RSS Feed      │───▶│   (rss-service)  │───▶│   (PostgreSQL)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Content Processor │
                       │ (content-processor)│
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   API Routes     │
                       │   (/api/blog/*)  │
                       └──────────────────┘
```

## Setup & Configuration

### 1. Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Required: Your GoHighLevel RSS feed URL
RSS_FEED_URL=https://rss-link.com/feed/YOUR_FEED_ID?blogId=YOUR_BLOG_ID&limit=25&loadContent=true

# Database (for production)
DATABASE_URL=your_postgresql_connection_string

# Optional: Force real RSS feed in development
FORCE_REAL_FEED=false
```

### 2. GoHighLevel RSS Feed Setup

1. **Get your RSS feed URL** from GoHighLevel:
   - Go to your GHL dashboard
   - Navigate to Blog/Content section
   - Find the RSS feed URL (usually in settings)
   - The URL format is: `https://rss-link.com/feed/{FEED_ID}?blogId={BLOG_ID}&limit=25&loadContent=true`

2. **Enable content loading** by adding `&loadContent=true` to your RSS URL

### 3. Dependencies

Install required packages:

```bash
npm install rss-parser isomorphic-dompurify drizzle-orm @neondatabase/serverless
```

## RSS Feed Processing

### RSS Service (`server/services/rss-service.ts`)

The RSS service handles fetching and processing blog posts from GoHighLevel:

```typescript
import Parser from 'rss-parser';

// Setup RSS Parser with custom fields for GHL
const parser = new Parser<{ items: GHLItem[] }>({
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['content:encoded', 'content:encoded'],
      ['dc:creator', 'dc:creator'],
    ],
  },
});

export async function fetchAndStoreBlogPosts() {
  const RSS_FEED_URL = process.env.RSS_FEED_URL;
  
  if (!RSS_FEED_URL) {
    throw new Error('RSS_FEED_URL is not defined');
  }
  
  const feed = await parser.parseURL(RSS_FEED_URL);
  
  for (const item of feed.items) {
    const blogPostData = createBlogPostFromGhlData(item, true);
    await storage.createBlogPost(blogPostData);
  }
}
```

### Blog Post Creation

The system converts RSS items to blog posts with the following process:

```typescript
function createBlogPostFromGhlData(data: any, isPublished = true): any {
  // Generate unique ID
  const ghlId = data.guid || data.link?.split('/').pop() || `ghl-${Date.now()}`;
  
  // Generate slug from title
  const title = data.title || 'Untitled Post';
  const slug = title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
  
  // Get content from various sources
  const content = data.content || data['content:encoded'] || data.description || '';
  
  // Extract excerpt
  let excerpt = data.contentSnippet || '';
  if (!excerpt && content) {
    excerpt = content.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
  }
  
  // Extract image URL
  let imageUrl = '';
  if (data.imageUrl) {
    imageUrl = data.imageUrl;
  } else if (data['media:content'] && data['media:content'][0] && data['media:content'][0].$) {
    imageUrl = data['media:content'][0].$.url;
  } else if (content) {
    const imgMatch = /<img[^>]+src="([^"]+)"/.exec(content);
    if (imgMatch) {
      imageUrl = imgMatch[1];
    }
  }
  
  return {
    ghlId,
    title,
    slug,
    content: purify.sanitize(content),
    excerpt,
    author: data.creator || data['dc:creator'] || 'StrategixAI',
    publishedAt: new Date(data.pubDate || Date.now()),
    imageUrl,
    tags: Array.isArray(data.categories) ? data.categories : [],
    lastFetched: new Date(),
    isPublished
  };
}
```

## Content Processing

### GHL Content Processor (`lib/content-processor.ts`)

The content processor handles GoHighLevel's complex HTML/CSS content:

```typescript
export class GHLContentProcessor {
  static processContent(rawContent: string, options: ProcessingOptions = {}): ProcessedContent {
    const opts: ProcessingOptions = {
      removeCustomBlocks: true,
      extractImages: true,
      sanitizeHTML: true,
      preserveStyles: false,
      ...options
    };

    let content = rawContent || '';
    
    // Step 1: Decode HTML entities
    content = this.decodeHTMLEntities(content);
    
    // Step 2: Handle custom code blocks
    if (this.hasCustomCodeBlocks(content)) {
      content = this.processCustomCodeBlocks(content, opts);
    }
    
    // Step 3: Extract images
    const extractedImages = opts.extractImages ? this.extractImages(content) : [];
    
    // Step 4: Remove problematic elements
    content = this.removeProblemElements(content);
    
    // Step 5: Fix malformed HTML
    content = this.fixMalformedHTML(content);
    
    // Step 6: Sanitize HTML
    if (opts.sanitizeHTML) {
      content = this.sanitizeContent(content, opts.preserveStyles);
    }
    
    // Step 7: Post-processing cleanup
    content = this.postProcessCleanup(content);
    
    return {
      cleanContent: content,
      extractedImages,
      hasCustomCode: this.hasCustomCodeBlocks(rawContent),
      originalLength: rawContent.length,
      processedLength: content.length
    };
  }
}
```

### Custom Code Block Processing

GoHighLevel often includes custom HTML/CSS/JavaScript blocks that need special handling:

```typescript
private static processCustomCodeBlocks(content: string, options: ProcessingOptions): string {
  if (!options.removeCustomBlocks) {
    return content;
  }

  // Remove GoHighLevel custom code containers
  content = content.replace(
    /<div[^>]*data-code-embed-container[^>]*>[\s\S]*?<\/div>/gi,
    ''
  );

  // Remove placeholder divs
  content = content.replace(
    /<div[^>]*data-code-embed-placeholder[^>]*>[\s\S]*?<\/div>/gi,
    ''
  );

  // Remove elements with Custom HTML/CSS/JAVASCRIPT placeholder text
  content = content.replace(
    /<div[^>]*placeholdertext="Custom HTML\/CSS\/JAVASCRIPT"[^>]*>[\s\S]*?<\/div>/gi,
    ''
  );

  // Extract and preserve content from within custom blocks
  const customBlockRegex = /<div[^>]*data-content="([^"]*)"[^>]*>/gi;
  let match;
  
  while ((match = customBlockRegex.exec(content)) !== null) {
    const encodedContent = match[1];
    if (encodedContent && encodedContent.length > 100) {
      const decodedContent = this.decodeHTMLEntities(encodedContent);
      const cleanContent = this.extractMeaningfulContent(decodedContent);
      
      if (cleanContent.trim()) {
        content = content.replace(match[0], cleanContent);
      }
    }
  }

  return content;
}
```

### HTML Sanitization

The system uses DOMPurify to sanitize HTML while preserving safe elements:

```typescript
private static sanitizeContent(content: string, preserveStyles: boolean = false): string {
  const allowedTags = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'div', 'span',
    'ul', 'ol', 'li',
    'a', 'strong', 'b', 'em', 'i', 'u',
    'img', 'figure', 'figcaption',
    'blockquote', 'table', 'thead', 'tbody', 'tr', 'td', 'th'
  ];

  const allowedAttributes = [
    'src', 'alt', 'title', 'href', 'target', 'rel',
    'class', 'id', 'width', 'height', 'loading'
  ];

  if (preserveStyles) {
    allowedAttributes.push('style');
  }

  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false
  });
}
```

## Database Schema

### Blog Posts Table

```sql
CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  ghl_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  author TEXT,
  published_at TIMESTAMP,
  image_url TEXT,
  tags JSONB,
  last_fetched TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### TypeScript Schema (`shared/schema.ts`)

```typescript
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  ghlId: text("ghl_id").notNull().unique(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  author: text("author"),
  publishedAt: timestamp("published_at"),
  imageUrl: text("image_url"),
  tags: jsonb("tags"),
  lastFetched: timestamp("last_fetched").notNull().defaultNow(),
});
```

## API Endpoints

### 1. List All Blog Posts

**Endpoint:** `GET /api/blog`

**Response:**
```json
[
  {
    "id": 1,
    "ghlId": "ghl-123456",
    "title": "Your Blog Post Title",
    "slug": "your-blog-post-title",
    "content": "<p>Cleaned HTML content...</p>",
    "excerpt": "Brief excerpt of the post...",
    "author": "StrategixAI",
    "publishedAt": "2024-01-15T10:30:00Z",
    "imageUrl": "https://example.com/image.jpg",
    "tags": ["tag1", "tag2"],
    "lastFetched": "2024-01-15T11:00:00Z"
  }
]
```

### 2. Get Single Blog Post

**Endpoint:** `GET /api/blog/[slug]`

**Response:**
```json
{
  "id": 1,
  "ghlId": "ghl-123456",
  "title": "Your Blog Post Title",
  "slug": "your-blog-post-title",
  "content": "<p>Full cleaned HTML content...</p>",
  "excerpt": "Brief excerpt of the post...",
  "author": "StrategixAI",
  "publishedAt": "2024-01-15T10:30:00Z",
  "imageUrl": "https://example.com/image.jpg",
  "tags": ["tag1", "tag2"],
  "lastFetched": "2024-01-15T11:00:00Z"
}
```

### 3. Sync Blog Posts

**Endpoint:** `POST /api/sync-blog`

**Request Body:**
```json
{
  "forceUpdate": true
}
```

**Response:**
```json
{
  "imported": 5,
  "updated": 2,
  "total": 7
}
```

## Deployment

### 1. Environment Setup

1. **Set up your database** (PostgreSQL recommended)
2. **Configure environment variables** in your deployment platform
3. **Set up RSS_FEED_URL** with your GoHighLevel RSS feed

### 2. Vercel Deployment

1. **Connect your repository** to Vercel
2. **Add environment variables** in Vercel dashboard:
   - `RSS_FEED_URL`
   - `DATABASE_URL` (for production)
3. **Deploy** your application

### 3. Database Migration

Run database migrations to create the blog_posts table:

```sql
-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  ghl_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  author TEXT,
  published_at TIMESTAMP,
  image_url TEXT,
  tags JSONB,
  last_fetched TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_ghl_id ON blog_posts(ghl_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
```

## Troubleshooting

### Common Issues

1. **RSS_FEED_URL not configured**
   - Error: `RSS_FEED_URL is not defined in environment variables`
   - Solution: Add your GoHighLevel RSS feed URL to environment variables

2. **Content not loading**
   - Issue: RSS feed returns empty content
   - Solution: Add `&loadContent=true` to your RSS feed URL

3. **Custom code blocks not processing**
   - Issue: GHL custom HTML/CSS blocks appear in content
   - Solution: Ensure `removeCustomBlocks: true` is set in content processing options

4. **Images not extracting**
   - Issue: Blog posts don't have featured images
   - Solution: Check that images are properly embedded in GHL posts and not in custom code blocks

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
FORCE_REAL_FEED=true
```

This will show detailed logs of the RSS processing and content cleaning steps.

### Testing

Use the test endpoint to verify your setup:

```bash
curl http://localhost:3000/api/blog
```

This should return your blog posts if everything is configured correctly.

## Advanced Configuration

### Custom Content Processing

You can customize content processing by modifying the options:

```typescript
const processedContent = GHLContentProcessor.processContent(rawContent, {
  removeCustomBlocks: true,    // Remove GHL custom code blocks
  extractImages: true,         // Extract and preserve images
  sanitizeHTML: true,          // Sanitize HTML for security
  preserveStyles: false        // Don't preserve inline styles
});
```

### Custom RSS Parser Configuration

Modify the RSS parser to handle additional GHL fields:

```typescript
const parser = new Parser<{ items: GHLItem[] }>({
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['content:encoded', 'content:encoded'],
      ['dc:creator', 'dc:creator'],
      ['custom:field', 'customField'],  // Add custom fields
    ],
  },
});
```

### Scheduled Syncing

Set up automatic blog syncing using a cron job or Vercel Cron:

```typescript
// In your API route
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  if (secret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const result = await syncBlogPosts(true);
  return Response.json(result);
}
```

## Conclusion

This GHL Blog Integration system provides a robust foundation for displaying GoHighLevel blog content on your website. The content processing handles complex HTML/CSS from GHL while maintaining clean, secure output. The modular architecture makes it easy to customize and extend for your specific needs.

For additional support or customization, refer to the individual service files and modify the processing logic as needed for your use case. 
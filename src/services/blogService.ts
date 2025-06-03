import { BlogPost, BlogPostPreview } from '../types/BlogPost';
import axios from 'axios';

// Use the VITE_ prefixed environment variables
const GHL_BASE_URL = `https://rest.gohighlevel.com/v1/locations/${import.meta.env.VITE_LOCATION_ID}/custom-values`;

// Common headers for all requests
const getHeaders = () => ({
  Authorization: `Bearer ${import.meta.env.VITE_GHL_API_KEY}`,
  'Content-Type': 'application/json',
  Version: '2021-07-28'
});

export const blogService = {
  // Get all published blog posts
  async getAllPosts(): Promise<BlogPostPreview[]> {
    const response = await axios.get(`${GHL_BASE_URL}/blogs`, {
      headers: getHeaders()
    });
    
    return response.data.records
      .filter((record: any) => record.published)
      .map((record: any) => ({
        id: record.id,
        title: record.title,
        author: {
          id: record.authorId,
          name: record.authorName,
          avatar: record.authorAvatar
        },
        date: record.createdAt,
        category: record.category,
        image: record.featuredImage,
        excerpt: record.excerpt,
        readTime: record.readTime,
        tags: record.tags?.split(',').map((tag: string) => tag.trim()) || [],
        slug: record.slug,
        published: record.published,
        lastModified: record.updatedAt
      }));
  },

  // Get a single blog post by slug
  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const response = await axios.get(`${GHL_BASE_URL}/blogs`, {
      headers: getHeaders(),
      params: { slug }
    });
    
    if (!response.data.records.length) return null;
    
    const record = response.data.records[0];
    return {
      id: record.id,
      title: record.title,
      author: {
        id: record.authorId,
        name: record.authorName,
        avatar: record.authorAvatar
      },
      date: record.createdAt,
      category: record.category,
      image: record.featuredImage,
      excerpt: record.excerpt,
      content: record.content,
      readTime: record.readTime,
      tags: record.tags?.split(',').map((tag: string) => tag.trim()) || [],
      slug: record.slug,
      published: record.published,
      lastModified: record.updatedAt
    };
  },

  // Get posts by category
  async getPostsByCategory(category: string): Promise<BlogPostPreview[]> {
    const response = await axios.get(`${GHL_BASE_URL}/blogs`, {
      headers: getHeaders(),
      params: { category, published: true }
    });
    
    return response.data.records.map((record: any) => ({
      id: record.id,
      title: record.title,
      author: {
        id: record.authorId,
        name: record.authorName,
        avatar: record.authorAvatar
      },
      date: record.createdAt,
      category: record.category,
      image: record.featuredImage,
      excerpt: record.excerpt,
      readTime: record.readTime,
      tags: record.tags?.split(',').map((tag: string) => tag.trim()) || [],
      slug: record.slug,
      published: record.published,
      lastModified: record.updatedAt
    }));
  },

  // Create a new blog post
  async createPost(post: Omit<BlogPost, 'id'>): Promise<string> {
    const response = await axios.post(
      `${GHL_BASE_URL}/blogs`,
      {
        title: post.title,
        authorId: post.author.id,
        authorName: post.author.name,
        authorAvatar: post.author.avatar,
        category: post.category,
        featuredImage: post.image,
        excerpt: post.excerpt,
        content: post.content,
        tags: post.tags.join(', '),
        slug: this.generateSlug(post.title),
        readTime: this.calculateReadTime(post.content),
        published: post.published
      },
      { headers: getHeaders() }
    );

    return response.data.id;
  },

  // Update an existing blog post
  async updatePost(id: string, post: Partial<BlogPost>): Promise<void> {
    const updateData: any = { ...post };
    if (post.tags) {
      updateData.tags = post.tags.join(', ');
    }
    if (post.title) {
      updateData.slug = this.generateSlug(post.title);
    }
    if (post.content) {
      updateData.readTime = this.calculateReadTime(post.content);
    }

    await axios.put(
      `${GHL_BASE_URL}/blogs/${id}`,
      updateData,
      { headers: getHeaders() }
    );
  },

  // Delete a blog post
  async deletePost(id: string): Promise<void> {
    await axios.delete(
      `${GHL_BASE_URL}/blogs/${id}`,
      { headers: getHeaders() }
    );
  },

  // Upload a blog image (using GHL's file upload)
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(
      `https://rest.gohighlevel.com/v1/locations/${import.meta.env.VITE_LOCATION_ID}/files/upload`,
      formData,
      {
        headers: {
          ...getHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data.url;
  },

  // Generate a URL-friendly slug from a title
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  },

  // Calculate read time based on content length
  calculateReadTime(content: string): string {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  }
}; 
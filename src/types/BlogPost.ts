export interface BlogPost {
  id: string;
  title: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  date: string;
  category: string;
  image: string;
  excerpt: string;
  content: string;
  readTime: string;
  tags: string[];
  slug: string;
  published: boolean;
  lastModified?: string;
}

export type BlogPostPreview = Omit<BlogPost, 'content'>; 
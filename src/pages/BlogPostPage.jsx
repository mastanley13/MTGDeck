import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogService } from '../services/blogService';

const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const posts = await blogService.getAllPosts();
      const foundPost = posts.find(p => p.slug.includes(slug));
      
      if (!foundPost) {
        throw new Error('Blog post not found');
      }
      
      setPost(foundPost);
    } catch (err) {
      setError('Failed to load blog post. Please try again later.');
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-primary-600/6 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16">
        <Link 
          to="/blog" 
          className="inline-flex items-center text-primary-400 hover:text-primary-300 mb-8"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </Link>

        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading blog post...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <div className="mb-8">
              <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Error Loading Post</h3>
            <p className="text-red-400 mb-8">{error}</p>
            <button 
              onClick={fetchPost}
              className="btn-modern btn-modern-primary btn-modern-md"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && post && (
          <article className="card-modern p-8 md:p-12">
            {post.image && (
              <div className="relative h-96 -mx-12 -mt-12 mb-12 overflow-hidden rounded-t-3xl">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            )}
            
            <header className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <span className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm">
                  {post.category}
                </span>
                <span className="text-slate-400 text-sm">{formatDate(post.date)}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{post.title}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-slate-300">{post.author.name}</span>
                </div>
              </div>
            </header>

            <div 
              className="prose prose-invert prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-slate-800">
                {post.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  );
};

export default BlogPostPage; 
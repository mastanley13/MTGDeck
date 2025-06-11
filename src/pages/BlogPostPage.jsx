import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { blogService } from '../services/blogService';

const BlogPostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedPost = await blogService.getPostBySlug(slug);
      
      if (!fetchedPost) {
        setError('Blog post not found');
        return;
      }
      
      setPost(fetchedPost);
      
      // Fetch related posts in the same category
      try {
        const related = await blogService.getPostsByCategory(fetchedPost.category);
        setRelatedPosts(related.filter(p => p.id !== fetchedPost.id).slice(0, 3));
      } catch (relatedError) {
        console.warn('Could not fetch related posts:', relatedError);
      }
      
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to copying URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-8">
            <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Post Not Found</h3>
          <p className="text-red-400 mb-8">{error}</p>
          <div className="space-y-4">
            <button 
              onClick={fetchPost}
              className="btn-modern btn-modern-primary btn-modern-md w-full"
            >
              Try Again
            </button>
            <Link 
              to="/blog"
              className="btn-modern btn-modern-secondary btn-modern-md w-full inline-block text-center"
            >
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="max-w-4xl mx-auto px-4 pt-16 pb-8">
          <Link 
            to="/blog"
            className="inline-flex items-center text-primary-400 hover:text-primary-300 mb-8 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Blog
          </Link>

          {/* Post Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <span className="px-4 py-2 bg-primary-500/20 text-primary-300 rounded-full text-sm font-medium">
                {post.category}
              </span>
              <span className="text-slate-400">{post.readTime}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{formatDate(post.date)}</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
              {post.title}
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              {post.excerpt}
            </p>

            {/* Author & Share */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {post.author.avatar && (
                  <img 
                    src={post.author.avatar} 
                    alt={post.author.name}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <p className="text-white font-medium">{post.author.name}</p>
                  <p className="text-slate-400 text-sm">Author</p>
                </div>
              </div>
              
              <button 
                onClick={handleShare}
                className="btn-modern btn-modern-secondary btn-modern-sm"
              >
                Share
              </button>
            </div>
          </div>

          {/* Featured Image */}
          {post.image && (
            <div className="mb-12 rounded-3xl overflow-hidden">
              <img 
                src={post.image} 
                alt={post.title}
                className="w-full h-64 sm:h-96 object-cover"
              />
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="max-w-4xl mx-auto px-4 pb-16">
          <div className="prose prose-lg prose-invert max-w-none">
            <div 
              className="text-slate-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-800">
              <h3 className="text-white font-bold mb-4">Tags</h3>
              <div className="flex flex-wrap gap-3">
                {post.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-full text-sm hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-16 pt-8 border-t border-slate-800">
              <h3 className="text-2xl font-bold text-white mb-8">Related Posts</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link 
                    key={relatedPost.id}
                    to={`/blog/${relatedPost.slug}`}
                    className="card-modern hover-glow group"
                  >
                    <div className="overflow-hidden rounded-t-3xl">
                      <img 
                        src={relatedPost.image} 
                        alt={relatedPost.title}
                        className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="text-white font-bold mb-2 group-hover:text-primary-300 transition-colors line-clamp-2">
                        {relatedPost.title}
                      </h4>
                      <p className="text-slate-400 text-sm line-clamp-2">
                        {relatedPost.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage; 
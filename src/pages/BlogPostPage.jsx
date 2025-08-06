import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { blogService } from '../services/blogService';
import DOMPurify from 'dompurify';

const BlogPostPage = () => {
  const contentRef = useRef(null);
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
      
      const foundPost = await blogService.getPostBySlug(decodeURIComponent(slug));
      
      if (!foundPost) {
        throw new Error('Blog post not found');
      }
      
      // Additional sanitization for security
      const sanitizedContent = DOMPurify.sanitize(foundPost.content, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'div', 'span',
          'ul', 'ol', 'li',
          'a', 'strong', 'b', 'em', 'i', 'u',
          'img', 'figure', 'figcaption',
          'blockquote', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
          'pre', 'code'
        ],
        ALLOWED_ATTR: [
          'src', 'alt', 'title', 'href', 'target', 'rel',
          'class', 'id', 'width', 'height', 'loading'
        ],
        KEEP_CONTENT: true,
        ALLOW_DATA_ATTR: false
      });
      
      setPost({ ...foundPost, content: sanitizedContent });
      
      // Fetch related posts
      await fetchRelatedPosts(foundPost);
      
    } catch (err) {
      setError('Failed to load blog post. Please try again later.');
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async (currentPost) => {
    try {
      const allPosts = await blogService.getAllPosts();
      const related = allPosts
        .filter(p => p.id !== currentPost.id)
        .filter(p => 
          p.category === currentPost.category ||
          p.tags.some(tag => currentPost.tags.includes(tag))
        )
        .slice(0, 3);
      
      setRelatedPosts(related);
    } catch (err) {
      console.error('Error fetching related posts:', err);
    }
  };

  /* Execute any inline or external scripts that were part of the blog HTML */
  useEffect(() => {
    if (!post || !contentRef.current) return;
    const scripts = contentRef.current.querySelectorAll('script');
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      // Copy attributes
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.text = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }, [post]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Blog': 'bg-blue-500/20 text-blue-300',
      'Guides': 'bg-green-500/20 text-green-300',
      'Strategy': 'bg-purple-500/20 text-purple-300',
      'Deck Ideas': 'bg-orange-500/20 text-orange-300',
      'News': 'bg-red-500/20 text-red-300'
    };
    return colors[category] || 'bg-primary-500/20 text-primary-300';
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-primary-600/6 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading blog post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-primary-600/6 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16">
          <div className="text-center py-16">
            <div className="mb-8">
              <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Error Loading Post</h3>
            <p className="text-red-400 mb-8">{error}</p>
            <button 
              onClick={() => navigate('/blog')}
              className="btn-modern btn-modern-primary btn-modern-md"
            >
              Back to Blog
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-900 overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-primary-600/6 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16">
          <div className="text-center py-16">
            <div className="mb-8">
              <svg className="w-16 h-16 mx-auto text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Post Not Found</h3>
            <p className="text-slate-400 mb-8">The blog post you're looking for doesn't exist.</p>
            <button 
              onClick={() => navigate('/blog')}
              className="btn-modern btn-modern-primary btn-modern-md"
            >
              Back to Blog
            </button>
          </div>
        </div>
      </div>
    );
  }

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

        <article className="card-modern p-8 md:p-12">
          {post.image && (
            <div className="relative h-96 -mx-12 -mt-12 mb-12 overflow-hidden rounded-t-3xl">
              <img 
                src={post.image} 
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={handleImageError}
              />
            </div>
          )}
          {(!post.image || !post.image.trim()) && (
            <div className="relative h-96 -mx-12 -mt-12 mb-12 overflow-hidden rounded-t-3xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <img 
                src="/public/images/aitutoricon.png" 
                alt="AI Deck Tutor"
                className="w-24 h-24 object-contain opacity-60"
              />
            </div>
          )}
          
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm ${getCategoryColor(post.category)}`}>
                {post.category}
              </span>
              <span className="text-slate-400 text-sm">{formatDate(post.date)}</span>
              <span className="text-slate-400 text-sm">{post.readTime}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{post.title}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-slate-300">{post.author.name}</span>
              </div>
            </div>
          </header>

          <div 
            ref={contentRef}
            className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-p:text-slate-300 prose-strong:text-white prose-a:text-primary-400 prose-blockquote:border-primary-500 prose-blockquote:bg-slate-800/50"
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

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-8">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link 
                  key={relatedPost.id}
                  to={`/blog/${encodeURIComponent(relatedPost.slug)}`}
                  className="card-modern hover-glow group"
                >
                  <div className="overflow-hidden rounded-t-3xl">
                    {relatedPost.image && (
                      <img 
                        src={relatedPost.image} 
                        alt={relatedPost.title}
                        className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={handleImageError}
                      />
                    )}
                    {(!relatedPost.image || !relatedPost.image.trim()) && (
                      <div className="w-full h-32 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                        <img 
                          src="/public/images/aitutoricon.png" 
                          alt="AI Deck Tutor"
                          className="w-8 h-8 object-contain opacity-60"
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(relatedPost.category)}`}>
                        {relatedPost.category}
                      </span>
                      <span className="text-slate-400 text-xs">{relatedPost.readTime}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2 group-hover:text-primary-300 transition-colors line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-2">
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
  );
};

export default BlogPostPage; 
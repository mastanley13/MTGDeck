import DOMPurify from 'dompurify';

/**
 * GHL Content Processor for handling complex HTML/CSS content from GoHighLevel
 * Based on the GHL Blog Integration Guide
 */
export class GHLContentProcessor {
  /**
   * Process raw content from GHL RSS feed
   * @param {string} rawContent - Raw HTML content from RSS feed
   * @param {Object} options - Processing options
   * @returns {Object} Processed content with metadata
   */
  static processContent(rawContent, options = {}) {
    const opts = {
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

  /**
   * Decode HTML entities
   * @param {string} content - HTML content with entities
   * @returns {string} Decoded content
   */
  static decodeHTMLEntities(content) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = content;
    return textarea.value;
  }

  /**
   * Check if content has GHL custom code blocks
   * @param {string} content - HTML content
   * @returns {boolean} True if custom blocks found
   */
  static hasCustomCodeBlocks(content) {
    return /data-code-embed-container|data-code-embed-placeholder|placeholdertext="Custom HTML\/CSS\/JAVASCRIPT"/.test(content);
  }

  /**
   * Process GHL custom code blocks
   * @param {string} content - HTML content
   * @param {Object} options - Processing options
   * @returns {string} Processed content
   */
  static processCustomCodeBlocks(content, options) {
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

  /**
   * Extract meaningful content from custom blocks
   * @param {string} content - HTML content
   * @returns {string} Clean content
   */
  static extractMeaningfulContent(content) {
    // Remove script tags
    content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    
    // Remove style tags
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remove empty divs
    content = content.replace(/<div[^>]*>\s*<\/div>/gi, '');
    
    return content.trim();
  }

  /**
   * Extract image URLs from content
   * @param {string} content - HTML content
   * @returns {Array} Array of image URLs
   */
  static extractImages(content) {
    const images = [];
    const imgRegex = /<img[^>]+src="([^"]+)"/gi;
    let match;
    
    while ((match = imgRegex.exec(content)) !== null) {
      images.push(match[1]);
    }
    
    return images;
  }

  /**
   * Remove problematic elements that might break rendering
   * @param {string} content - HTML content
   * @returns {string} Cleaned content
   */
  static removeProblemElements(content) {
    // Remove problematic elements that might break rendering
    content = content.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
    content = content.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
    content = content.replace(/<embed[^>]*>/gi, '');
    
    return content;
  }

  /**
   * Fix common HTML issues
   * @param {string} content - HTML content
   * @returns {string} Fixed content
   */
  static fixMalformedHTML(content) {
    // Fix common HTML issues
    content = content.replace(/<br\s*\/?>/gi, '<br />');
    content = content.replace(/<hr\s*\/?>/gi, '<hr />');
    
    return content;
  }

  /**
   * Sanitize HTML content for security
   * @param {string} content - HTML content
   * @param {boolean} preserveStyles - Whether to preserve inline styles
   * @returns {string} Sanitized content
   */
  static sanitizeContent(content, preserveStyles = false) {
    const allowedTags = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'div', 'span',
      'ul', 'ol', 'li',
      'a', 'strong', 'b', 'em', 'i', 'u',
      'img', 'figure', 'figcaption',
      'blockquote', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'pre', 'code'
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

  /**
   * Post-processing cleanup
   * @param {string} content - HTML content
   * @returns {string} Cleaned content
   */
  static postProcessCleanup(content) {
    // Remove excessive whitespace
    content = content.replace(/\s+/g, ' ');
    
    // Remove empty paragraphs
    content = content.replace(/<p>\s*<\/p>/gi, '');
    
    // Fix spacing around headings
    content = content.replace(/>\s*</g, '>\n<');
    
    return content.trim();
  }

  /**
   * Generate excerpt from content
   * @param {string} content - HTML content
   * @param {number} maxLength - Maximum length of excerpt
   * @returns {string} Excerpt
   */
  static generateExcerpt(content, maxLength = 150) {
    // Remove HTML tags
    const textContent = content.replace(/<[^>]*>/g, '');
    
    // Truncate to max length
    if (textContent.length <= maxLength) {
      return textContent;
    }
    
    // Find the last complete word within the limit
    const truncated = textContent.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > 0) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * Calculate read time from content
   * @param {string} content - HTML content
   * @returns {string} Read time estimate
   */
  static calculateReadTime(content) {
    // Remove HTML tags and count words
    const textContent = content.replace(/<[^>]*>/g, '');
    const wordCount = textContent.split(/\s+/).length;
    
    // Average reading speed: 200 words per minute
    const minutes = Math.ceil(wordCount / 200);
    
    return `${minutes} min read`;
  }

  /**
   * Generate slug from title
   * @param {string} title - Post title
   * @returns {string} URL-friendly slug
   */
  static generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
}

export default GHLContentProcessor; 
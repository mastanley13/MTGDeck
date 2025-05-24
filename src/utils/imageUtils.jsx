/**
 * Centralized image utility functions for consistent card image handling
 */
import React, { useState } from 'react';

export const IMAGE_QUALITIES = {
  HIGH: ['png', 'large', 'normal', 'small'],
  MEDIUM: ['large', 'normal', 'small', 'png'], 
  LOW: ['normal', 'small', 'large', 'png'],
  THUMBNAIL: ['small', 'normal', 'large', 'png']
};

export const IMAGE_CONTEXTS = {
  DETAIL_MODAL: 'HIGH',
  GRID_VIEW: 'MEDIUM', 
  LIST_VIEW: 'LOW',
  THUMBNAIL: 'THUMBNAIL'
};

/**
 * Get the best image URL for a given context and card
 * @param {Object} card - Card object with image_uris or card_faces
 * @param {string} context - Context from IMAGE_CONTEXTS
 * @param {number} faceIndex - For double-faced cards, which face to show
 * @returns {string|null} Best image URL or null if none found
 */
export const getOptimalImageUrl = (card, context = 'MEDIUM', faceIndex = 0) => {
  if (!card) return null;

  const quality = IMAGE_QUALITIES[IMAGE_CONTEXTS[context]] || IMAGE_QUALITIES.MEDIUM;
  
  // Try direct image_uris first (single-faced cards)
  if (card.image_uris && !card.card_faces) {
    for (const size of quality) {
      if (card.image_uris[size]) {
        return card.image_uris[size];
      }
    }
  }
  
  // Try card faces (double-faced cards)
  if (card.card_faces && card.card_faces[faceIndex]?.image_uris) {
    const faceImageUris = card.card_faces[faceIndex].image_uris;
    for (const size of quality) {
      if (faceImageUris[size]) {
        return faceImageUris[size];
      }
    }
  }
  
  // Fallback to first available face
  if (card.card_faces) {
    for (const face of card.card_faces) {
      if (face?.image_uris) {
        for (const size of quality) {
          if (face.image_uris[size]) {
            return face.image_uris[size];
          }
        }
      }
    }
  }
  
  return null;
};

/**
 * Get all faces for a card with their optimal image URLs
 * @param {Object} card - Card object
 * @param {string} context - Image quality context
 * @returns {Array} Array of face objects with imageUrl
 */
export const getCardFaces = (card, context = 'MEDIUM') => {
  if (!card) return [];
  
  const faces = [];
  
  // Single-faced card
  if (card.image_uris && !card.card_faces) {
    const imageUrl = getOptimalImageUrl(card, context);
    if (imageUrl) {
      faces.push({
        name: card.name,
        imageUrl,
        faceIndex: 0,
        uris: card.image_uris
      });
    }
  }
  // Multi-faced card
  else if (card.card_faces && card.card_faces.length > 0) {
    card.card_faces.forEach((face, index) => {
      const imageUrl = getOptimalImageUrl(card, context, index);
      if (imageUrl) {
        faces.push({
          name: face.name || `${card.name} (Face ${index + 1})`,
          imageUrl,
          faceIndex: index,
          uris: face.image_uris,
          oracle_text: face.oracle_text,
          mana_cost: face.mana_cost,
          type_line: face.type_line,
          power: face.power,
          toughness: face.toughness,
          loyalty: face.loyalty
        });
      }
    });
  }
  
  return faces;
};

/**
 * Generate responsive image attributes for different screen sizes
 * @param {string} baseUrl - Base image URL
 * @returns {Object} Object with srcSet and sizes attributes
 */
export const getResponsiveImageProps = (baseUrl) => {
  if (!baseUrl) return {};
  
  // Convert Scryfall URLs to different sizes
  const small = baseUrl.replace(/(normal|large|png)/, 'small');
  const normal = baseUrl.replace(/(small|large|png)/, 'normal');
  const large = baseUrl.replace(/(small|normal|png)/, 'large');
  
  return {
    srcSet: `${small} 146w, ${normal} 488w, ${large} 672w`,
    sizes: '(max-width: 768px) 146px, (max-width: 1024px) 488px, 672px'
  };
};

/**
 * Preload critical images for better performance
 * @param {Array} imageUrls - Array of image URLs to preload
 */
export const preloadImages = (imageUrls) => {
  imageUrls.forEach(url => {
    if (url) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    }
  });
};

/**
 * Enhanced image component with lazy loading and error handling
 */
export const LazyCardImage = ({ 
  card, 
  context = 'MEDIUM',
  faceIndex = 0,
  className = '',
  alt,
  onLoad,
  onError,
  ...props 
}) => {
  const [imageState, setImageState] = useState('loading');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;
  
  const imageUrl = getOptimalImageUrl(card, context, faceIndex);
  const responsiveProps = getResponsiveImageProps(imageUrl);
  
  const handleLoad = () => {
    setImageState('loaded');
    onLoad && onLoad();
  };
  
  const handleError = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setImageState('retrying');
      setTimeout(() => setImageState('loading'), 1000);
    } else {
      setImageState('error');
      onError && onError();
    }
  };
  
  if (!imageUrl) {
    return (
      <div className={`bg-gray-700 flex items-center justify-center text-gray-400 text-sm ${className}`}>
        No Image Available
      </div>
    );
  }
  
  return (
    <img
      src={imageUrl}
      alt={alt || `${card.name} card image`}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      {...responsiveProps}
      {...props}
    />
  );
}; 
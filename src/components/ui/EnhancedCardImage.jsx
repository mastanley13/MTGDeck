/**
 * Enhanced Card Image Component with performance optimizations
 * Demonstrates best practices for card image display
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getOptimalImageUrl, getResponsiveImageProps, IMAGE_CONTEXTS } from '../../utils/imageUtils.jsx';

const EnhancedCardImage = ({ 
  card, 
  context = 'GRID_VIEW',
  faceIndex = 0,
  className = '',
  alt,
  onLoad,
  onError,
  showDoubleFaceToggle = true,
  aspectRatio = 'card', // 'card', 'square', 'wide'
  ...props 
}) => {
  const [imageState, setImageState] = useState('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [currentFace, setCurrentFace] = useState(faceIndex);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  
  const maxRetries = 2;

  // Set up intersection observer for lazy loading
  useEffect(() => {
    const currentImgRef = imgRef.current;
    
    if (currentImgRef && window.IntersectionObserver) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            observerRef.current?.unobserve(currentImgRef);
          }
        },
        { rootMargin: '50px' }
      );
      
      observerRef.current.observe(currentImgRef);
    } else {
      // Fallback for older browsers
      setIsIntersecting(true);
    }

    return () => {
      if (observerRef.current && currentImgRef) {
        observerRef.current.unobserve(currentImgRef);
      }
    };
  }, []);

  // Determine if card has multiple faces
  const isDoubleFaced = card?.card_faces && card.card_faces.length > 1;
  
  const imageUrl = getOptimalImageUrl(card, context, currentFace);
  const responsiveProps = getResponsiveImageProps(imageUrl);

  const handleLoad = useCallback(() => {
    setImageState('loaded');
    onLoad && onLoad();
  }, [onLoad]);
  
  const handleError = useCallback(() => {
    console.warn(`Image failed to load: ${imageUrl}`);
    
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setImageState('retrying');
      
      // Progressive retry with exponential backoff
      setTimeout(() => {
        setImageState('loading');
      }, Math.pow(2, retryCount) * 1000);
    } else {
      setImageState('error');
      onError && onError();
    }
  }, [imageUrl, retryCount, maxRetries, onError]);

  const toggleFace = useCallback(() => {
    if (isDoubleFaced) {
      setCurrentFace(prev => (prev + 1) % card.card_faces.length);
      setImageState('loading');
      setRetryCount(0);
    }
  }, [isDoubleFaced, card?.card_faces]);

  // Aspect ratio classes
  const aspectClasses = {
    card: 'aspect-[63/88]', // Standard MTG card ratio
    square: 'aspect-square',
    wide: 'aspect-[16/9]'
  };

  const containerClasses = `
    relative overflow-hidden rounded-lg 
    ${aspectClasses[aspectRatio]} 
    ${className}
  `.trim();

  // Loading skeleton
  if (!isIntersecting) {
    return (
      <div ref={imgRef} className={containerClasses}>
        <div className="w-full h-full bg-gray-700 animate-pulse flex items-center justify-center">
          <div className="text-gray-500 text-xs">Loading...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (imageState === 'error' || !imageUrl) {
    return (
      <div ref={imgRef} className={containerClasses}>
        <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center text-gray-400 p-2">
          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="text-xs text-center">
            {!imageUrl ? 'No Image' : 'Load Failed'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={imgRef} className={containerClasses}>
      {/* Loading state overlay */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 bg-gray-700 animate-pulse flex items-center justify-center z-10">
          <div className="text-gray-500 text-xs">
            {retryCount > 0 ? `Retry ${retryCount}/${maxRetries}` : 'Loading...'}
          </div>
        </div>
      )}

      {/* Main image */}
      <img
        src={imageUrl}
        alt={alt || `${card?.name} ${isDoubleFaced ? `(Face ${currentFace + 1})` : ''} card image`}
        className={`
          w-full h-full object-cover transition-opacity duration-300
          ${imageState === 'loaded' ? 'opacity-100' : 'opacity-0'}
        `}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        {...responsiveProps}
        {...props}
      />

      {/* Double-faced card indicator */}
      {isDoubleFaced && (
        <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
          {currentFace + 1}/{card.card_faces.length}
        </div>
      )}

      {/* Face toggle button for double-faced cards */}
      {isDoubleFaced && showDoubleFaceToggle && (
        <button
          onClick={toggleFace}
          className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded hover:bg-opacity-90 transition-colors"
          title={`Switch to ${card.card_faces[(currentFace + 1) % card.card_faces.length]?.name || 'other face'}`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}

      
    </div>
  );
};

export default EnhancedCardImage; 
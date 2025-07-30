import React from 'react';
import { Helmet } from 'react-helmet-async';

// Google AdSense Component
const GoogleAdSense = ({ 
  adSlot, 
  adFormat = 'auto', 
  fullWidthResponsive = true,
  style = { display: 'block' },
  className = ''
}) => {
  React.useEffect(() => {
    // Push the ad to Google AdSense
    if (window.adsbygoogle) {
      window.adsbygoogle.push({});
    }
  }, []);

  return (
    <>
      <Helmet>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3709734746252312"
          crossOrigin="anonymous"
        />
      </Helmet>
      
      <ins
        className={`adsbygoogle ${className}`}
        style={style}
        data-ad-client="ca-pub-3709734746252312"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive}
      />
    </>
  );
};

// AdSense Head Component - for global script injection
export const AdSenseHead = () => {
  return (
    <Helmet>
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3709734746252312"
        crossOrigin="anonymous"
      />
    </Helmet>
  );
};

// Predefined ad components for common use cases
export const AdBanner = ({ adSlot, className = '' }) => (
  <GoogleAdSense
    adSlot={adSlot}
    adFormat="auto"
    className={`w-full ${className}`}
    style={{ display: 'block', textAlign: 'center' }}
  />
);

export const AdRectangle = ({ adSlot, className = '' }) => (
  <GoogleAdSense
    adSlot={adSlot}
    adFormat="rectangle"
    className={`w-full ${className}`}
    style={{ display: 'block', textAlign: 'center' }}
  />
);

export const AdSidebar = ({ adSlot, className = '' }) => (
  <GoogleAdSense
    adSlot={adSlot}
    adFormat="auto"
    className={`w-full ${className}`}
    style={{ display: 'block', textAlign: 'center' }}
  />
);

export default GoogleAdSense; 
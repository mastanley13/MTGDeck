import React from 'react';
import { AdBanner, AdRectangle, AdSidebar } from './GoogleAdSense.jsx';

// Example component showing how to use AdSense ads
const AdSenseExample = () => {
  return (
    <div className="space-y-8">
      {/* Banner Ad Example */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <h3 className="text-white mb-4">Banner Advertisement</h3>
        <AdBanner 
          adSlot="1234567890" // Replace with your actual ad slot ID
          className="my-4"
        />
      </div>

      {/* Rectangle Ad Example */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <h3 className="text-white mb-4">Rectangle Advertisement</h3>
        <AdRectangle 
          adSlot="0987654321" // Replace with your actual ad slot ID
          className="my-4"
        />
      </div>

      {/* Sidebar Ad Example */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <h3 className="text-white mb-4">Sidebar Advertisement</h3>
        <AdSidebar 
          adSlot="1122334455" // Replace with your actual ad slot ID
          className="my-4"
        />
      </div>
    </div>
  );
};

export default AdSenseExample; 
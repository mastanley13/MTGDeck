# Google AdSense Setup Guide

This document explains how Google AdSense has been implemented in the MTG Commander Deck Builder application.

## Implementation Overview

Google AdSense has been implemented in two ways:

1. **Global Script Injection** - Added to the main `index.html` file
2. **React Components** - Reusable components for placing ads throughout the app

## Files Modified

### 1. `index.html`
- Added Google AdSense script to the `<head>` section
- This ensures the script loads globally for all pages

### 2. `src/App.jsx`
- Added `HelmetProvider` from `react-helmet-async`
- Added `AdSenseHead` component for additional script injection
- Wrapped the entire app with `HelmetProvider`

### 3. `src/components/ui/GoogleAdSense.jsx`
- Created reusable AdSense components
- Includes `AdBanner`, `AdRectangle`, and `AdSidebar` components
- Provides `AdSenseHead` component for global script injection

## Usage Examples

### Basic Ad Placement
```jsx
import { AdBanner } from './components/ui/GoogleAdSense.jsx';

function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
      <AdBanner adSlot="your-ad-slot-id" />
    </div>
  );
}
```

### Available Components

#### AdBanner
For banner-style advertisements:
```jsx
<AdBanner adSlot="your-banner-ad-slot" />
```

#### AdRectangle
For rectangular advertisements:
```jsx
<AdRectangle adSlot="your-rectangle-ad-slot" />
```

#### AdSidebar
For sidebar advertisements:
```jsx
<AdSidebar adSlot="your-sidebar-ad-slot" />
```

#### Custom AdSense Component
For custom ad configurations:
```jsx
import GoogleAdSense from './components/ui/GoogleAdSense.jsx';

<GoogleAdSense
  adSlot="your-ad-slot"
  adFormat="auto"
  fullWidthResponsive={true}
  className="custom-class"
  style={{ display: 'block', textAlign: 'center' }}
/>
```

## Ad Slot IDs

You'll need to replace the placeholder ad slot IDs with your actual Google AdSense ad slot IDs:

- `ca-pub-3709734746252312` - Your publisher ID (already configured)
- `1234567890` - Replace with your actual ad slot IDs
- `0987654321` - Replace with your actual ad slot IDs
- `1122334455` - Replace with your actual ad slot IDs

## Getting Ad Slot IDs

1. Log into your Google AdSense account
2. Go to "Ads" → "By ad unit"
3. Create new ad units or use existing ones
4. Copy the ad slot IDs (format: `1234567890`)

## Best Practices

### Ad Placement
- Place ads in high-visibility areas
- Avoid placing too many ads close together
- Ensure ads don't interfere with user experience
- Test on different screen sizes

### Performance
- Ads are loaded asynchronously to avoid blocking page load
- Use the `async` attribute for better performance
- Consider lazy loading for ads below the fold

### User Experience
- Clearly label ad areas
- Ensure ads are responsive
- Don't place ads in critical user flow areas
- Test with ad blockers disabled

## Troubleshooting

### Common Issues

1. **Ads not showing**
   - Check if ad blockers are enabled
   - Verify ad slot IDs are correct
   - Ensure the page is live (not localhost)

2. **Script loading errors**
   - Check browser console for errors
   - Verify internet connection
   - Ensure no CSP blocking the script

3. **AdSense account issues**
   - Verify account is approved
   - Check for policy violations
   - Ensure site is approved for AdSense

### Debug Mode
To debug AdSense implementation:
```jsx
// Add this to see if adsbygoogle is loaded
console.log('AdSense loaded:', !!window.adsbygoogle);
```

## Next Steps

1. Replace placeholder ad slot IDs with your actual IDs
2. Test ad placement on different pages
3. Monitor AdSense performance in Google AdSense dashboard
4. Optimize ad placement based on user engagement

## Files Created/Modified

- ✅ `index.html` - Added global AdSense script
- ✅ `src/App.jsx` - Added HelmetProvider and AdSenseHead
- ✅ `src/components/ui/GoogleAdSense.jsx` - Created AdSense components
- ✅ `src/components/ui/AdSenseExample.jsx` - Created usage examples
- ✅ `docs/GOOGLE_ADSENSE_SETUP.md` - This documentation

## Dependencies Added

- `react-helmet-async` - For managing document head in React 
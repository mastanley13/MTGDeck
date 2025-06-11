// Blog Automation Configuration
// Add these to your .env file

export const blogAutomationConfig = {
  // OpenAI Configuration
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS) || 3000,
    temperature: parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE) || 0.7
  },

  // GoHighLevel Configuration
  ghl: {
    apiKey: import.meta.env.VITE_GHL_API_KEY,
    locationId: import.meta.env.VITE_LOCATION_ID,
    baseUrl: `https://rest.gohighlevel.com/v1/locations/${import.meta.env.VITE_LOCATION_ID}`,
    webhookSecret: import.meta.env.VITE_GHL_WEBHOOK_SECRET
  },

  // Content Generation Settings
  contentGeneration: {
    defaultCategory: 'Guides',
    defaultAuthor: {
      id: 'mtg-team',
      name: 'MTG Strategy Team',
      avatar: null
    },
    wordCountRange: {
      min: 1000,
      max: 1500
    },
    seoOptimization: {
      titleMaxLength: 60,
      metaDescriptionMaxLength: 155,
      maxTags: 8
    }
  },

  // Automation Schedules (Cron expressions)
  schedules: {
    weeklyContentGeneration: '0 9 * * 1', // Mondays at 9 AM
    dailySEOOptimization: '0 10 * * *',   // Daily at 10 AM
    dailySocialGeneration: '0 14 * * *',  // Daily at 2 PM
    weeklyAnalytics: '0 8 * * 0'          // Sundays at 8 AM
  },

  // Social Media Configuration
  socialMedia: {
    platforms: ['twitter', 'facebook', 'linkedin', 'reddit', 'instagram'],
    schedulingDelays: {
      twitter: 30,      // 30 minutes after publish
      facebook: 120,    // 2 hours after publish
      linkedin: 240,    // 4 hours after publish
      reddit: 360,      // 6 hours after publish
      instagram: 480    // 8 hours after publish
    }
  },

  // Topic Categories and Templates
  topicGeneration: {
    maxTopicsPerWeek: 5,
    categoryDistribution: {
      deckGuides: 0.3,    // 30%
      strategy: 0.25,     // 25%
      cardAnalysis: 0.2,  // 20%
      metaShifts: 0.15,   // 15%
      budget: 0.1         // 10%
    }
  },

  // Quality Control
  qualityControl: {
    enableManualReview: import.meta.env.VITE_ENABLE_MANUAL_REVIEW === 'true',
    enableAutoPublish: import.meta.env.VITE_ENABLE_AUTO_PUBLISH === 'true',
    enableSocialAutomation: import.meta.env.VITE_ENABLE_SOCIAL_AUTOMATION === 'true',
    minReadTime: '3 min read',
    maxReadTime: '15 min read'
  },

  // Analytics and Monitoring
  analytics: {
    trackingEnabled: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
    googleAnalyticsId: import.meta.env.VITE_GA_ID,
    performanceThresholds: {
      minViews: 100,
      minReadTime: 120, // seconds
      maxBounceRate: 70 // percentage
    }
  }
};

// Validation function to check required environment variables
export function validateBlogAutomationConfig() {
  const requiredVars = [
    'VITE_OPENAI_API_KEY',
    'VITE_GHL_API_KEY', 
    'VITE_LOCATION_ID'
  ];

  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate OpenAI API key format
  if (!blogAutomationConfig.openai.apiKey?.startsWith('sk-')) {
    console.warn('OpenAI API key format may be incorrect');
  }

  // Validate GHL configuration
  if (!blogAutomationConfig.ghl.locationId) {
    throw new Error('GoHighLevel Location ID is required');
  }

  console.log('✅ Blog automation configuration validated successfully');
  return true;
}

// Helper function to get MTG-specific variables for topic generation
export function getMTGVariables() {
  return {
    commanders: [
      'Atraxa', 'Edgar Markov', 'Korvold', 'Meren', 'Zur', 'Prossh', 
      'Nekusar', 'Krenko', 'Kaalia', 'Rafiq', 'Omnath', 'Chulane'
    ],
    archetypes: [
      'Aggro', 'Control', 'Combo', 'Midrange', 'Tribal', 'Voltron',
      'Stax', 'Group Hug', 'Superfriends', 'Aristocrats', 'Spellslinger'
    ],
    mechanics: [
      'Cascade', 'Storm', 'Dredge', 'Reanimator', 'Tokens', 'Counters',
      'Mill', 'Burn', 'Ramp', 'Draw', 'Tutor', 'Recursion'
    ],
    colors: [
      'White', 'Blue', 'Black', 'Red', 'Green', 'Azorius', 'Dimir',
      'Rakdos', 'Gruul', 'Selesnya', 'Orzhov', 'Izzet', 'Golgari',
      'Boros', 'Simic', 'Esper', 'Grixis', 'Jund', 'Naya', 'Bant',
      'Mardu', 'Temur', 'Abzan', 'Jeskai', 'Sultai', 'WUBRG'
    ],
    cardTypes: [
      'Creatures', 'Instants', 'Sorceries', 'Artifacts', 'Enchantments',
      'Planeswalkers', 'Lands', 'Equipment', 'Auras'
    ],
    manaValues: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    budgetAmounts: [25, 50, 75, 100, 150, 200, 300, 500],
    recentSets: [
      'Murders at Karlov Manor', 'Lost Caverns of Ixalan', 
      'Wilds of Eldraine', 'Lord of the Rings', 'March of the Machine'
    ]
  };
}

// Environment variable template for .env file
export const envTemplate = `
# Blog Automation Configuration

# OpenAI Settings
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
VITE_OPENAI_MODEL=gpt-4
VITE_OPENAI_MAX_TOKENS=3000
VITE_OPENAI_TEMPERATURE=0.7

# GoHighLevel Settings
VITE_GHL_API_KEY=your-ghl-api-key-here
VITE_LOCATION_ID=your-ghl-location-id-here
VITE_GHL_WEBHOOK_SECRET=your-webhook-secret-here

# Automation Settings
VITE_ENABLE_MANUAL_REVIEW=false
VITE_ENABLE_AUTO_PUBLISH=true
VITE_ENABLE_SOCIAL_AUTOMATION=true

# Analytics Settings
VITE_ANALYTICS_ENABLED=true
VITE_GA_ID=your-google-analytics-id

# Social Media APIs (optional)
VITE_TWITTER_API_KEY=your-twitter-api-key
VITE_FACEBOOK_ACCESS_TOKEN=your-facebook-token
VITE_BUFFER_ACCESS_TOKEN=your-buffer-token
VITE_ZAPIER_WEBHOOK_URL=your-zapier-webhook-url
`;

export default blogAutomationConfig; 
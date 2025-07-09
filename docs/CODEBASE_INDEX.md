# 🏗️ **AIDeckTutor - Codebase Index**

*Last Updated: January 2, 2025*

## **📋 Project Overview**
- **Name**: MTG Deck Tutor AI  
- **Type**: React + Vite MTG Commander deck building application
- **Tech Stack**: React 18, TypeScript, Node.js, Express, Tailwind CSS
- **Key Features**: AI-powered deck generation, deck import/export, analytics, subscription management

---

## **🎯 Core Architecture**

### **📁 Project Structure**
```
MTGAPP.3/
├── 📦 Frontend (React/Vite)
├── 🔧 Backend Services (Express)
├── 🤖 AI Integration (OpenAI)
├── 💳 Payment System (Stripe)
├── ☁️ Cloud Storage (GHL API)
└── 📊 Analytics & Validation
```

---

## **🔥 Key Components & Services**

### **🎮 Core Deck Management**
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `src/context/DeckContext.jsx` | Global state management | Deck CRUD, card management, GHL sync |
| `src/components/deck/DeckBuilder.jsx` | Main deck building interface | Card categories, drag-drop, commander display |
| `src/pages/DeckViewer.jsx` | Deck viewing/editing | Edit mode, analytics, export/import |
| `src/components/ai/AutoDeckBuilder.jsx` | AI deck generation UI | 3-stage AI pipeline, progress tracking |

### **🤖 AI & Intelligence**
| Service | Purpose | Technology |
|---------|---------|------------|
| `src/hooks/useAutoDeckBuilder.js` | AI deck generation hook | OpenAI o3 model, 3-stage pipeline |
| `src/services/commanderLegalityService.js` | Format validation | Commander rules, banned cards, color identity |
| `src/services/deckValidationService.js` | AI-powered validation | Rule compliance, suggestions |
| `src/services/smartReplacementService.js` | Intelligent card replacement | Context-aware substitutions |

### **📥 Import/Export System**
| Component | Formats Supported | Features |
|-----------|------------------|----------|
| `src/services/deckImportService.js` | MTGA, MTGO, Moxfield, Archidekt, EDHREC | Auto-format detection, fuzzy matching |
| `src/components/deck/DeckImporter.jsx` | Text-based imports | Commander detection, validation |
| `src/components/deck/DeckExporter.jsx` | Multiple export formats | MTGA, text lists, sharing |

### **📊 Analytics & Insights**
| Component | Purpose | Metrics |
|-----------|---------|---------|
| `src/utils/deckAnalytics.js` | Deck analysis | Mana curve, color distribution, type breakdown |
| `src/components/deck/DeckAnalytics.jsx` | Visual analytics | Charts, statistics, recommendations |
| `src/components/deckstats/analyzers/bracketAnalyzer.js` | Power level assessment | Game-changer detection, bracket classification |

---

## **🔌 External Integrations**

### **🃏 Card Data**
- **Scryfall API**: Primary card database (`src/utils/scryfallAPI.js`)
- **Card Cache**: Local caching system (`src/utils/cardCache.js`)
- **Image Handling**: Optimized card image display (`src/utils/imageUtils.jsx`)

### **🤖 AI Services**
- **OpenAI Integration**: Deck generation and validation (`src/utils/openaiAPI.js`)
- **Three-Stage Pipeline**: 
  1. High-quality generation (o3)
  2. AI validation scan (o3) 
  3. Smart replacements (o3)

### **💳 Payment & Subscriptions**
- **Stripe Integration**: Payment processing (`src/utils/stripeIntegration.js`)
- **Subscription Management**: Usage tracking, premium features (`src/context/SubscriptionContext.jsx`)
- **GHL API**: Customer relationship management (`src/utils/ghlSubscriptionAPI.js`)

---

## **🎨 UI/UX Components**

### **🎯 Specialized Components**
| Component | Purpose | Features |
|-----------|---------|----------|
| `src/components/search/CommanderSearch.jsx` | Commander selection | Search, filters, legality check |
| `src/components/ui/CardDetailModal.jsx` | Card information display | Full card details, legalities |
| `src/utils/manaSymbols.tsx` | Mana cost rendering | SVG icons, color coding |
| `src/components/ui/GameChangerTooltip.jsx` | Power level indicators | Game-changing card warnings |

### **✨ Modern UI Elements**
- **Glassmorphism**: Modern card designs with transparency effects
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Theme**: Consistent dark mode throughout
- **Loading States**: Skeleton screens and progress indicators

---

## **📱 Page Structure**

### **🏠 Main Pages**
| Page | Route | Purpose |
|------|-------|---------|
| `src/pages/HomePage.jsx` | `/` | Landing page, feature overview |
| `src/pages/DeckBuilder.jsx` | `/builder` | Main deck building interface |
| `src/pages/DeckViewer.jsx` | `/decks/:id` | View/edit saved decks |
| `src/pages/CardSearchPage.jsx` | `/card-search` | Advanced card search |
| `src/pages/CommanderAiPage.jsx` | `/commander-ai` | AI commander recommendations |

### **👤 User Management**
| Page | Route | Purpose |
|------|-------|---------|
| `src/pages/LoginPage.jsx` | `/login` | User authentication |
| `src/pages/RegisterPage.jsx` | `/register` | Account creation |
| `src/pages/UserProfilePage.jsx` | `/profile` | User settings, deck management |
| `src/pages/SubscriptionPage.jsx` | `/subscription` | Premium features, billing |

---

## **🛠️ Development & Build**

### **⚙️ Configuration**
- **Vite Config**: Modern build tool with React plugin (`vite.config.ts`)
- **TypeScript**: Gradual migration to TypeScript (`tsconfig.json`)
- **ESLint**: Code quality and consistency (`eslint.config.js`)
- **Tailwind CSS**: Utility-first styling (`tailwind.config.js`)

### **🧪 Testing & Validation**
- **Service Tests**: Legality validation, import functionality
- **Integration Tests**: Payment flow, webhook handling (`src/scripts/test*.js`)
- **Error Handling**: Comprehensive error boundaries and logging

---

## **🔧 Backend Services**

### **🌐 API Routes**
| Service | Purpose | Technology |
|---------|---------|------------|
| `src/server.js` | Main Express server | REST API, middleware |
| `src/api/webhookRoutes.js` | External webhooks | Stripe, GHL integration |
| `src/api/blogAutomationRoutes.js` | Content management | Automated blog generation |

### **💾 Data Management**
- **GHL Cloud Storage**: Primary deck storage
- **Local Storage**: Caching and offline support
- **Card Cache**: Optimized Scryfall data caching

---

## **🚀 Key Features Implemented**

### ✅ **Completed Features**
- 🤖 **AI Deck Generation**: 3-stage pipeline with o3 model
- 📥 **Multi-Format Import**: MTGA, MTGO, Moxfield, Archidekt support
- 🎯 **Commander Validation**: Comprehensive legality checking
- 📊 **Deck Analytics**: Mana curve, color distribution, power level
- 💳 **Subscription System**: Stripe integration, usage tracking
- ☁️ **Cloud Storage**: GHL API integration for deck persistence
- 🔍 **Advanced Search**: Card search with filters and suggestions

### 🔄 **User Feedback Items** (from `docs/development/User-Feedback-Improvement-Task-List.md`)
- ⚠️ **Color Identity Issues**: AI-generated decks include wrong dual lands
- 🔧 **Commander Detection**: Import sometimes fails to detect commander
- 🎨 **UI Improvements**: Action button placement, deck builder initialization
- 📈 **Analytics Fixes**: Colorless mana counting issues
- 💰 **Budget Integration**: AI deck generation with budget constraints

---

## **📈 Performance & Optimization**

### **⚡ Performance Features**
- **Card Caching**: Intelligent Scryfall API caching
- **Lazy Loading**: Component-based code splitting
- **Virtualization**: Large deck list rendering optimization
- **Progressive Loading**: Staged UI updates during AI generation

### **🔒 Security & Reliability**
- **Input Validation**: Comprehensive deck and card validation
- **Error Recovery**: Graceful fallbacks for API failures
- **Rate Limiting**: API usage management
- **Data Persistence**: Multiple backup strategies

---

## **🔍 Key File Locations**

### **📂 Core Application Files**
```
src/
├── App.jsx                     # Main app component with routing
├── main.jsx                    # Application entry point
├── context/
│   ├── DeckContext.jsx         # Global deck state management
│   ├── AuthContext.jsx         # User authentication
│   └── SubscriptionContext.jsx # Premium features
├── components/
│   ├── deck/                   # Deck-related components
│   ├── ai/                     # AI integration components
│   ├── ui/                     # Reusable UI components
│   └── auth/                   # Authentication components
├── services/                   # Business logic services
├── utils/                      # Utility functions
├── hooks/                      # Custom React hooks
└── pages/                      # Route components
```

### **📋 Configuration Files**
```
├── package.json                # Dependencies and scripts
├── vite.config.ts             # Build configuration
├── tailwind.config.js         # CSS framework config
├── tsconfig.json              # TypeScript configuration
└── vercel.json                # Deployment configuration
```

---

## **🎯 Development Priorities**

### **🔥 High Priority**
1. Fix color identity filtering for AI-generated decks
2. Improve action button placement in UI
3. Complete manual commander selection post-import
4. Integrate budget slider with AI generation

### **🚨 Medium Priority**
1. Fix deck builder initialization behavior
2. Enhance import error handling
3. Add combo explanation tooltips
4. Fix analytics colorless mana counting

### **🔍 Investigation Needed**
1. Verify Archidekt import functionality
2. Implement comprehensive error logging
3. Test mobile responsiveness
4. Optimize performance for large decks

---

*This index serves as a comprehensive reference for the AIDeckTutor codebase structure and can be updated as the project evolves.* 
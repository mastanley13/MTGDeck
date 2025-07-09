# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

# MTG Card Search Application

A modern Magic: The Gathering card search application built with React and Vite.

## Features

- **Advanced Card Search**: Search through the entire MTG database using Scryfall API
- **Commander Search**: Specialized search for commander-legal cards
- **Card Details Modal**: View detailed card information including legalities, prices, and multiple art versions
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Infinite Scroll**: Efficient loading of search results
- **Card Image Display**: Robust image handling with fallbacks and retry mechanisms

## Recent Improvements

### Enhanced Card Image Loading (Latest Update)

We've significantly improved the card image loading system to handle problematic cards, especially double-faced cards (DFCs) and cards with special layouts:

#### **What was fixed:**
- **Double-faced cards** (transform, modal DFC, reversible cards) now display properly
- **Image format prioritization** - now supports PNG, large, normal, small, border_crop, and art_crop formats
- **Comprehensive fallback handling** - tries multiple faces and image formats before giving up
- **Error handling and retry logic** - automatic retry on failed image loads
- **Better user feedback** - loading states and "Image unavailable" messages for problematic cards

#### **Cards that should now work:**
- A-Gutter Skulker // A-Gutter Shortcut
- Arlinn, the Pack's Hope // Arlinn, the Moon's Rage  
- Arcee, Sharpshooter // Arcee, Acrobatic Coupe
- All other double-faced, transform, and modal DFC cards

#### **Technical improvements:**
- Enhanced `getCardImageUris()` function with comprehensive layout support
- New `CardImage` component with retry logic and loading states
- Better error logging for debugging image issues
- Improved fallback UI for cards without images

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Use the search bar to find Magic cards
2. Click on cards to view detailed information
3. Use the commander search for deck building
4. Navigate through different art versions in the detail modal

## Technologies Used

- React 18
- Vite
- Tailwind CSS
- Scryfall API
- Axios for API requests

## Contributing

Feel free to submit issues and pull requests to improve the application.

## License

This project is open source and available under the MIT License.

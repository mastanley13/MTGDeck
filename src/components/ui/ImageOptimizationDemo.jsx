/**
 * Demo component showcasing image optimization improvements
 * This can be used for testing and demonstrating the enhanced features
 */
import React, { useState } from 'react';
import EnhancedCardImage from './EnhancedCardImage';
import { IMAGE_CONTEXTS } from '../../utils/imageUtils.jsx';

const ImageOptimizationDemo = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedContext, setSelectedContext] = useState('GRID_VIEW');

  // Sample cards for testing different scenarios
  const sampleCards = [
    {
      id: 'test-single',
      name: 'Lightning Bolt',
      image_uris: {
        small: 'https://cards.scryfall.io/small/front/c/e/ce711943-c1a1-43a0-8b89-8d169cfb8e06.jpg',
        normal: 'https://cards.scryfall.io/normal/front/c/e/ce711943-c1a1-43a0-8b89-8d169cfb8e06.jpg',
        large: 'https://cards.scryfall.io/large/front/c/e/ce711943-c1a1-43a0-8b89-8d169cfb8e06.jpg',
        png: 'https://cards.scryfall.io/png/front/c/e/ce711943-c1a1-43a0-8b89-8d169cfb8e06.png'
      },
      type_line: 'Instant',
      oracle_id: 'test-oracle-1'
    },
    {
      id: 'test-double',
      name: 'Delver of Secrets // Insectile Aberration',
      card_faces: [
        {
          name: 'Delver of Secrets',
          image_uris: {
            small: 'https://cards.scryfall.io/small/front/1/1/11bf83bb-c95b-4b4f-9a56-ce7a1816307a.jpg',
            normal: 'https://cards.scryfall.io/normal/front/1/1/11bf83bb-c95b-4b4f-9a56-ce7a1816307a.jpg',
            large: 'https://cards.scryfall.io/large/front/1/1/11bf83bb-c95b-4b4f-9a56-ce7a1816307a.jpg',
            png: 'https://cards.scryfall.io/png/front/1/1/11bf83bb-c95b-4b4f-9a56-ce7a1816307a.png'
          },
          mana_cost: '{U}',
          type_line: 'Creature — Human Wizard',
          oracle_text: 'At the beginning of your upkeep, look at the top card of your library. You may reveal that card. If an instant or sorcery card is revealed this way, transform Delver of Secrets.',
          power: '1',
          toughness: '1'
        },
        {
          name: 'Insectile Aberration',
          image_uris: {
            small: 'https://cards.scryfall.io/small/back/1/1/11bf83bb-c95b-4b4f-9a56-ce7a1816307a.jpg',
            normal: 'https://cards.scryfall.io/normal/back/1/1/11bf83bb-c95b-4b4f-9a56-ce7a1816307a.jpg',
            large: 'https://cards.scryfall.io/large/back/1/1/11bf83bb-c95b-4b4f-9a56-ce7a1816307a.jpg',
            png: 'https://cards.scryfall.io/png/back/1/1/11bf83bb-c95b-4b4f-9a56-ce7a1816307a.png'
          },
          type_line: 'Creature — Human Insect',
          oracle_text: 'Flying',
          power: '3',
          toughness: '2'
        }
      ],
      oracle_id: 'test-oracle-2'
    }
  ];

  const features = [
    { icon: '⚡', title: 'Lazy Loading', description: 'Images load only when visible' },
    { icon: '📱', title: 'Responsive Images', description: 'Optimal size for each device' },
    { icon: '🔄', title: 'Smart Retry', description: 'Progressive retry with backoff' },
    { icon: '🎨', title: 'Quality Contexts', description: 'Different quality for different uses' },
    { icon: '🔀', title: 'Double-Face Support', description: 'Seamless face switching' },
    { icon: '💾', title: 'Error Handling', description: 'Graceful fallbacks' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">🚀 Image Optimization Demo</h1>
        <p className="text-slate-400">Enhanced card image handling with performance optimizations</p>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <div key={index} className="glassmorphism-card p-4 text-center">
            <div className="text-2xl mb-2">{feature.icon}</div>
            <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
            <p className="text-xs text-slate-400 mt-1">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="glassmorphism-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Test Different Contexts</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Context Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Image Quality Context:</label>
            <select 
              value={selectedContext}
              onChange={(e) => setSelectedContext(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              {Object.keys(IMAGE_CONTEXTS).map(context => (
                <option key={context} value={context}>
                  {context.replace('_', ' ')} - {IMAGE_CONTEXTS[context]} Quality
                </option>
              ))}
            </select>
          </div>

          {/* Card Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Test Card:</label>
            <select 
              value={selectedCard ? selectedCard.id : ''}
              onChange={(e) => setSelectedCard(sampleCards.find(c => c.id === e.target.value) || null)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="">Select a card to test...</option>
              {sampleCards.map(card => (
                <option key={card.id} value={card.id}>
                  {card.name} ({card.card_faces ? 'Double-Faced' : 'Single-Faced'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Image Preview */}
      {selectedCard && (
        <div className="glassmorphism-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Enhanced Card Image Preview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Small Preview */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">Small (List View)</h3>
              <div className="w-32 mx-auto">
                <EnhancedCardImage
                  card={selectedCard}
                  context="LIST_VIEW"
                  aspectRatio="card"
                  className="w-full"
                  showDoubleFaceToggle={true}
                />
              </div>
            </div>

            {/* Medium Preview */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">Medium (Grid View)</h3>
              <div className="w-48 mx-auto">
                <EnhancedCardImage
                  card={selectedCard}
                  context="GRID_VIEW"
                  aspectRatio="card"
                  className="w-full"
                  showDoubleFaceToggle={true}
                />
              </div>
            </div>

            {/* Large Preview */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">Large (Detail Modal)</h3>
              <div className="w-64 mx-auto">
                <EnhancedCardImage
                  card={selectedCard}
                  context="DETAIL_MODAL"
                  aspectRatio="card"
                  className="w-full"
                  showDoubleFaceToggle={true}
                />
              </div>
            </div>
          </div>

          {/* Debug Info */}
          <div className="mt-6 bg-slate-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Debug Information:</h4>
            <div className="text-xs text-slate-400 space-y-1">
              <div>Selected Context: <span className="text-primary-400">{selectedContext}</span></div>
              <div>Card Type: <span className="text-primary-400">
                {selectedCard.card_faces ? 'Double-Faced' : 'Single-Faced'}
              </span></div>
              <div>Available Sizes: <span className="text-primary-400">
                {selectedCard.image_uris 
                  ? Object.keys(selectedCard.image_uris).join(', ')
                  : selectedCard.card_faces 
                    ? Object.keys(selectedCard.card_faces[0]?.image_uris || {}).join(', ')
                    : 'None'
                }
              </span></div>
            </div>
          </div>
        </div>
      )}

      {/* Improvement Summary */}
      <div className="glassmorphism-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">🎯 What's Been Improved</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before */}
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-3">❌ Before</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• Inconsistent image quality across components</li>
              <li>• No lazy loading - all images load immediately</li>
              <li>• Basic error handling with no retry</li>
              <li>• Different face-switching logic in each component</li>
              <li>• No responsive image support</li>
              <li>• Duplicate code across multiple files</li>
            </ul>
          </div>

          {/* After */}
          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-3">✅ After</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• Standardized quality contexts (DETAIL_MODAL, GRID_VIEW, etc.)</li>
              <li>• True lazy loading with Intersection Observer</li>
              <li>• Progressive retry with exponential backoff</li>
              <li>• Unified face-switching with consistent UI</li>
              <li>• Responsive images with srcSet and sizes</li>
              <li>• Single EnhancedCardImage component used everywhere</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Developer Notes */}
      <div className="glassmorphism-card p-6 border-blue-500/30">
        <h2 className="text-xl font-bold text-blue-400 mb-4">📚 Developer Notes</h2>
        <div className="prose prose-slate prose-sm">
          <p className="text-slate-300 mb-4">
            This optimization implements a centralized image handling system that's now used across 
            SearchResults, CardCategory, and CardSearchPage components.
          </p>
          
          <div className="bg-slate-800/50 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-medium text-slate-200 mb-2">Usage Example:</h4>
            <pre className="text-xs text-green-400 overflow-x-auto">
{`<EnhancedCardImage
  card={card}
  context="GRID_VIEW"
  aspectRatio="card"
  showDoubleFaceToggle={true}
  alt="Card description"
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageOptimizationDemo; 
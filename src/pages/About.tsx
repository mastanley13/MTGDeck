import React from 'react';

const About: React.FC = () => {
  return (
    <div className="container mx-auto p-4 text-gray-300">
      <h1 className="text-3xl font-bold mb-6 text-logoScheme-gold">About MTG Commander Deck Builder</h1>
      
      <div className="bg-logoScheme-darkGray p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-logoScheme-gold">Our Mission</h2>
        <p className="mb-4">
          MTG Commander Deck Builder combines the power of AI with comprehensive Magic: The Gathering card data 
          to help players create optimized Commander decks. Our tool makes deck building easier, more intuitive, 
          and more exciting by suggesting synergistic cards based on your commander and theme.
        </p>
        <p>
          Whether you're a seasoned Commander player looking to refine your strategies or a newcomer trying to 
          build your first deck, our platform provides valuable insights and recommendations to enhance your 
          Magic: The Gathering experience.
        </p>
      </div>
      
      <div className="bg-logoScheme-darkGray p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-logoScheme-gold">Features</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Intelligent card suggestions powered by AI</li>
          <li>Commander-specific synergy analysis</li>
          <li>Comprehensive search capabilities</li>
          <li>Deck validation against Commander format rules</li>
          <li>Mana curve and color distribution visualization</li>
          <li>Export options for popular platforms</li>
          <li>Deck sharing capabilities</li>
        </ul>
      </div>
      
      <div className="bg-logoScheme-darkGray p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-logoScheme-gold">How It Works</h2>
        <ol className="list-decimal pl-6 space-y-4">
          <li>
            <p className="font-semibold">Choose Your Commander</p>
            <p>Select from thousands of legendary creatures to lead your deck.</p>
          </li>
          <li>
            <p className="font-semibold">Define Your Theme</p>
            <p>Tell us what strategy or theme you're going for with your deck.</p>
          </li>
          <li>
            <p className="font-semibold">Get AI Suggestions</p>
            <p>Our AI will analyze your commander and theme to suggest synergistic cards.</p>
          </li>
          <li>
            <p className="font-semibold">Build & Refine</p>
            <p>Add cards to your deck and use our tools to refine and optimize it.</p>
          </li>
          <li>
            <p className="font-semibold">Export & Share</p>
            <p>Export your deck to your preferred format or share it with friends.</p>
          </li>
        </ol>
      </div>
      
      <div className="bg-logoScheme-darkGray p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-logoScheme-gold">Credits</h2>
        <p className="mb-4">
          MTG Commander Deck Builder is powered by the following technologies and data sources:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Card data provided by <a href="https://scryfall.com/docs/api" className="text-logoScheme-blue hover:text-blue-400 underline">Scryfall API</a></li>
          <li>AI suggestions powered by <a href="https://openai.com" className="text-logoScheme-blue hover:text-blue-400 underline">OpenAI</a></li>
          <li>Built with React, TailwindCSS, and Node.js</li>
        </ul>
        <p className="mt-4 text-sm text-gray-400">
          Magic: The Gathering and all related properties are owned by Wizards of the Coast. 
          This application is not affiliated with, endorsed, sponsored, or specifically approved by Wizards of the Coast.
        </p>
      </div>
    </div>
  );
};

export default About; 
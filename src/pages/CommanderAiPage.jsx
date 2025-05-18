import React, { useState } from 'react';
import CardDetailModal from '../components/ui/CardDetailModal';

const CommanderAiPage = () => {
  const [preferences, setPreferences] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);

  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY; // Ensure your API key is in .env as VITE_OPENAI_API_KEY

  const handleInputChange = (event) => {
    setPreferences(event.target.value);
  };

  const fetchScryfallCardData = async (cardName) => {
    try {
      const response = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`);
      if (!response.ok) {
        console.warn(`Scryfall API error for ${cardName}: ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (scryfallError) {
      console.error(`Failed to fetch card data from Scryfall for ${cardName}:`, scryfallError);
      return null;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!preferences.trim()) return;
    if (!OPENAI_API_KEY) {
      setError('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
      return;
    }

    setIsLoading(true);
    setSuggestions([]);
    setError(null);

    const prompt = `
      You are an expert Magic: The Gathering Commander suggestion AI.
      A user is looking for commander suggestions based on the following preferences: "${preferences}"
      Please suggest 15 commanders that fit these preferences.
      For each commander, provide:
      1. name: The full name of the commander card.
      2. colors: An array of strings representing the commander's color identity (e.g., ["W", "U", "B", "R", "G"]).
      3. description: A brief explanation (1-2 sentences) of why this commander fits the preferences or its general strategy. This description will be shown on the card tile.

      Return your response as a valid JSON array of objects, like this example:
      [
        {
          "name": "Atraxa, Praetors\' Voice",
          "colors": ["W", "U", "B", "G"],
          "description": "Atraxa excels with +1/+1 counters, proliferate mechanics, and can support various strategies like Superfriends or Infect."
        }
        // ... more commanders
      ]
      Ensure the JSON is well-formed and contains only the JSON array.
    `;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API Error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to fetch suggestions from OpenAI.');
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (aiResponse) {
        let parsedAiSuggestions = [];
        try {
          const cleanedJsonResponse = aiResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
          parsedAiSuggestions = JSON.parse(cleanedJsonResponse);
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError, "Raw response:", aiResponse);
          setError('Received an invalid format from AI. Please try again.');
          setIsLoading(false);
          return;
        }

        const suggestionsWithFullData = await Promise.all(
          parsedAiSuggestions.map(async (aiSuggestion) => {
            const scryfallData = await fetchScryfallCardData(aiSuggestion.name);
            if (scryfallData) {
              return {
                ...scryfallData,
                aiDescription: aiSuggestion.description,
                colors: aiSuggestion.colors,
                imageUrl: scryfallData.image_uris?.art_crop || scryfallData.image_uris?.normal || null,
              };
            }
            return { 
                ...aiSuggestion, 
                name: aiSuggestion.name,
                description: aiSuggestion.description,
                imageUrl: null 
            };
          })
        );
        setSuggestions(suggestionsWithFullData);
      } else {
        setError('Received no response content from AI.');
      }
    } catch (apiError) {
      console.error('API call failed:', apiError);
      setError(apiError.message || 'An unexpected error occurred.');
    }
    setIsLoading(false);
  };

  const handleOpenModal = (card) => {
    setSelectedCardForModal(card);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCardForModal(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Commander AI</h1>
      <p className="text-lg text-center mb-10 text-gray-600">
        Describe your preferred playstyle, colors, or mechanics, and let the AI suggest some commanders for you!
      </p>
      
      {!OPENAI_API_KEY && (
        <div className="max-w-xl mx-auto bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-md" role="alert">
          <p className="font-bold">API Key Missing</p>
          <p>Your OpenAI API key (VITE_OPENAI_API_KEY) is not configured in your <code>.env</code> file. Please add it to enable AI suggestions.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-xl mb-12">
        <div className="mb-6">
          <label htmlFor="preferences" className="block text-sm font-medium text-gray-700 mb-2">
            What are you looking for in a Commander?
          </label>
          <textarea
            id="preferences"
            name="preferences"
            rows="4"
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition duration-150 ease-in-out"
            placeholder="e.g., I love drawing cards and controlling the board, maybe in Blue and White. Or, I want an aggressive Red commander that deals a lot of damage quickly."
            value={preferences}
            onChange={handleInputChange}
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !preferences.trim() || !OPENAI_API_KEY}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {isLoading ? 'Thinking...' : 'Get Suggestions'}
        </button>
      </form>

      {isLoading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finding commanders and images for you...</p>
        </div>
      )}

      {error && (
        <div className="max-w-xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-6 shadow-md" role="alert">
          <strong className="font-bold">Oops! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {suggestions.length > 0 && !isLoading && (
        <div>
          <h2 className="text-3xl font-semibold text-center mb-8 text-gray-700">Commander Suggestions:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {suggestions.map((commander, index) => (
              <div 
                key={`${commander.name}-${index}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 ease-in-out cursor-pointer"
                onClick={() => handleOpenModal(commander)}
              >
                {commander.imageUrl ? (
                  <img src={commander.imageUrl} alt={`Art for ${commander.name}`} className="w-full h-60 object-cover object-top" />
                ) : (
                  <div className="w-full h-60 bg-gray-200 flex items-center justify-center text-gray-400 relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="absolute text-xs bottom-2 left-2 p-1 bg-gray-700 bg-opacity-50 text-white rounded">Image not found</span>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 h-12 overflow-hidden">{commander.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">Colors: {Array.isArray(commander.colors) ? commander.colors.join(', ') : 'N/A'}</p>
                  <p className="text-xs text-gray-600 leading-relaxed h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">{commander.aiDescription || commander.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isModalOpen && selectedCardForModal && (
        <CardDetailModal card={selectedCardForModal} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default CommanderAiPage; 
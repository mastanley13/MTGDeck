import React, { useState, useRef, useEffect } from 'react';
import { useDeck } from '../../context/DeckContext';
import { getOpenAIApiKey } from '../../utils/openaiAPI';

/**
 * AI Chatbot component for Magic deck building assistance
 */
const AIChatbot = () => {
  const { commander, cards, totalCardCount } = useDeck();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'I\'m your Magic: The Gathering deck-building assistant. How can I help with your deck?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to the bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Create context about the current deck
      let deckContext = "I don't have a deck yet.";
      if (commander) {
        deckContext = `My commander is ${commander.name} (${commander.type_line}). `;
        if (cards.length > 0) {
          deckContext += `I have ${totalCardCount} cards in my deck so far. `;
          
          // Add some card examples if available
          const sampleCards = cards.slice(0, 5).map(card => card.name).join(', ');
          if (sampleCards) {
            deckContext += `Some cards in my deck include: ${sampleCards}, and more.`;
          }
        } else {
          deckContext += "I haven't added any other cards yet.";
        }
      }
      
      // Call OpenAI API
      const API_URL = 'https://api.openai.com/v1/chat/completions';
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getOpenAIApiKey()}`
        },
        body: JSON.stringify({
          model: 'o3-2025-04-16',
          messages: [
            { 
              role: 'system', 
              content: `You are a helpful Magic: The Gathering deck building assistant. 
              You specialize in the Commander format and give concise, helpful advice.
              Current deck information: ${deckContext}`
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            userMessage
          ],
          max_completion_tokens: 1024
        })
      });
      
      const data = await response.json();
      let aiMessage = data.choices[0]?.message?.content;
      if (!aiMessage && data.choices[0]?.text) {
        aiMessage = data.choices[0].text;
      }
      if (aiMessage) {
        setMessages(prev => [...prev, { role: 'assistant', content: aiMessage }]);
      } else {
        console.error('No AI response found. Full choices:', data.choices);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Sorry, I had trouble processing that. Please try again.' 
        }]);
      }
    } catch (error) {
      console.error('Error with chatbot:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-logoScheme-darkGray rounded-lg border border-logoScheme-brown shadow-sm overflow-hidden flex flex-col h-full text-gray-300">
      <div className="p-3 bg-logoScheme-darkGray text-logoScheme-gold font-medium flex items-center border-b border-logoScheme-brown">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
        </svg>
        MTG Deck Assistant
      </div>
      
      {/* Messages Container */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-800" style={{ maxHeight: '350px' }}>
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`mb-3 ${message.role === 'user' ? 'ml-auto max-w-[75%]' : 'mr-auto max-w-[75%]'}`}
          >
            <div 
              className={`p-3 rounded-lg shadow ${
                message.role === 'user' 
                  ? 'bg-logoScheme-blue text-white' 
                  : 'bg-gray-700 border border-gray-600 text-gray-100'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center text-gray-500 mb-3">
            <div className="w-2 h-2 bg-gray-500 rounded-full mr-1 animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full mr-1 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-logoScheme-brown flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about deck building..."
          className="flex-1 px-3 py-2 border border-gray-500 rounded-l-md text-sm focus:ring-logoScheme-gold focus:border-logoScheme-gold bg-gray-700 text-gray-100 placeholder-gray-400"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={`px-4 py-2 rounded-r-md transition-colors ${
            isLoading || !input.trim() 
              ? 'bg-gray-600 text-gray-400' 
              : 'bg-logoScheme-gold hover:bg-yellow-400 text-logoScheme-darkGray'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default AIChatbot; 
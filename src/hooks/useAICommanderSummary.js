import { useState, useEffect } from 'react';

// Mock AI Summary Hook
const useAICommanderSummary = (commander) => {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  useEffect(() => {
    if (!commander || !commander.name) {
      setSummary('');
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!apiKey) {
      setError('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY.');
      setIsLoading(false);
      setSummary('AI features disabled: API key missing.');
      return;
    }

    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);
      setSummary('');

      const prompt = `Provide a concise strategic overview for the Magic: The Gathering commander named '${commander.name}'. \
Its abilities are: '${commander.oracle_text || 'No oracle text available.'}'. \
Focus on its typical play style, strengths, and common strategies in the Commander (EDH) format. \
Keep the summary to 2-4 sentences, focusing on actionable strategic insights.`;

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini', // You can change to gpt-4 or other models
            messages: [
              { role: 'system', content: 'You are an expert Magic: The Gathering strategist providing concise commander overviews for an EDH deck-building application.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.6,
            max_tokens: 150, // Adjust as needed
            n: 1,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('OpenAI API Error:', errorData);
          throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          setSummary(data.choices[0].message.content.trim());
        } else {
          throw new Error('No summary returned from AI.');
        }
      } catch (e) {
        console.error("AI Summary Fetch Error:", e);
        setError(e.message || 'Failed to generate AI strategic overview. The Oracle is silent.');
      }
      setIsLoading(false);
    };

    fetchSummary();
  }, [commander, apiKey]); // Rerun when commander or apiKey (though apiKey should be constant) changes

  return { summary, isLoading, error };
};

export default useAICommanderSummary; 
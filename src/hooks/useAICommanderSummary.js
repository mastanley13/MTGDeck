import { useState, useEffect } from 'react';

// Enhanced AI Summary Hook with o3 optimization and fallback
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

      const prompt = `Provide a very brief Commander summary for ${commander.name}:

${commander.name}: ${commander.oracle_text || 'No abilities listed.'}

Write a 2-3 sentence overview covering:
- What this commander does
- Basic strategy/deck theme
- Power level (casual/focused/competitive)

Keep it under 50 words total. Be direct and simple.`;

      try {
        // Try o3 first with optimized parameters
        let summaryContent = await fetchWithO3(prompt);
        
        // If o3 fails, fallback to gpt-4.1-2025-04-14
        if (!summaryContent) {
          console.warn('o3 failed for summary, falling back to gpt-4.1-2025-04-14');
          summaryContent = await fetchWithFallback(prompt);
        }

        if (summaryContent) {
          setSummary(summaryContent.trim());
        } else {
          throw new Error('All AI models failed to generate summary.');
        }
      } catch (e) {
        console.error("AI Summary Fetch Error:", e);
        setError(e.message || 'Failed to generate AI strategic overview.');
        // Set a basic fallback summary
        setSummary(`${commander.name} is a versatile commander with unique abilities. Consider building around its color identity and core mechanics for optimal synergy.`);
      }
      setIsLoading(false);
    };

    const fetchWithO3 = async (prompt) => {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'o3-2025-04-16',
            messages: [
              { role: 'system', content: 'You are a Magic: The Gathering expert. Provide extremely brief, concise summaries. Be direct and avoid detailed explanations.' },
              { role: 'user', content: prompt },
            ],
            max_completion_tokens: 8000, // Higher limit for o3 reasoning overhead
            // Remove temperature - not supported by o3
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('o3 API Error:', errorData);
          return null;
        }

        const data = await response.json();
        
        // Enhanced response extraction for o3
        let content = null;
        
        // Check for finish_reason issues
        if (data.choices?.[0]?.finish_reason === 'length') {
          console.warn('o3 response truncated due to length limit');
          return null;
        }
        
        // Method 1: Standard message content
        if (data.choices?.[0]?.message?.content) {
          content = data.choices[0].message.content;
        }
        // Method 2: Direct text field
        else if (data.choices?.[0]?.text) {
          content = data.choices[0].text;
        }
        // Method 3: Check for reasoning response format
        else if (data.choices?.[0]?.message?.reasoning) {
          content = data.choices[0].message.reasoning;
        }
        
        if (!content || content.trim() === '') {
          console.error('o3 Response Debug:', {
            choices: data.choices,
            usage: data.usage,
            finish_reason: data.choices?.[0]?.finish_reason,
            reasoning_tokens: data.usage?.completion_tokens_details?.reasoning_tokens
          });
          
          // Check if reasoning consumed all tokens
          if (data.usage?.completion_tokens_details?.reasoning_tokens > 10000) {
            console.warn('o3 used all tokens for reasoning, no content returned');
          }
          
          return null;
        }
        
        return content;
      } catch (error) {
        console.error('o3 fetch error:', error);
        return null;
      }
    };

    const fetchWithFallback = async (prompt) => {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-2024-11-20',
            messages: [
              { role: 'system', content: 'You are a Magic: The Gathering expert. Provide extremely brief, concise summaries. Be direct and avoid detailed explanations.' },
              { role: 'user', content: prompt },
            ],
            max_completion_tokens: 800,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Fallback API Error:', errorData);
          return null;
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
      } catch (error) {
        console.error('Fallback fetch error:', error);
        return null;
      }
    };

    fetchSummary();
  }, [commander, apiKey]);

  return { summary, isLoading, error };
};

export default useAICommanderSummary; 
class LLMParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LLMParseError';
  }
}

/**
 * Strips markdown code fences from the LLM output.
 */
const stripMarkdownFences = (text) => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
};

/**
 * Calls Groq API to compute an AI compatibility score.
 * 
 * @param {Object} tenantProfile 
 * @param {Object} listing 
 * @returns {Promise<{score: number, explanation: string}>}
 */
const scoreCompatibility = async (tenantProfile, listing) => {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error('LLM_API_KEY is not defined in the environment.');
  }

  const prompt = `
You are an expert real estate AI assistant matching a tenant profile with a room listing.
Evaluate the compatibility between the tenant and the listing and provide a compatibility score between 0 and 100.

Tenant Profile:
- Preferred Location: ${tenantProfile.preferredLocation?.city || 'N/A'}, Area: ${tenantProfile.preferredLocation?.area || 'N/A'}
- Budget Range: ${tenantProfile.budgetRange?.min || 'N/A'} to ${tenantProfile.budgetRange?.max || 'N/A'}
- Move-in Date: ${tenantProfile.moveInDate ? new Date(tenantProfile.moveInDate).toDateString() : 'N/A'}
- Preferences: ${tenantProfile.preferences || 'N/A'}

Listing Details:
- Location: ${listing.location?.city || 'N/A'}, Area: ${listing.location?.area || 'N/A'}
- Rent: ${listing.rent || 'N/A'}
- Available From: ${listing.availableFrom ? new Date(listing.availableFrom).toDateString() : 'N/A'}
- Room Type: ${listing.roomType || 'N/A'}
- Furnishing Status: ${listing.furnishingStatus || 'N/A'}
- Description: ${listing.description || 'N/A'}

INSTRUCTIONS:
Return STRICTLY valid JSON, with exactly two keys: "score" (an integer from 0 to 100) and "explanation" (a one or two sentence string explaining the score). 
Do NOT wrap the output in markdown code blocks. Do not add any extra commentary or text outside the JSON object.
Example: {"score": 85, "explanation": "The listing is within the budget and matches the preferred city, though the area differs slightly."}
`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2, // low temperature for more deterministic/consistent output
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LLM API Error: ${response.status} ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';
    
    // Parse response
    const cleanedContent = stripMarkdownFences(rawContent);
    let result;
    try {
      result = JSON.parse(cleanedContent);
    } catch (parseError) {
      throw new LLMParseError(`Failed to parse LLM response as JSON. Raw output: ${rawContent}`);
    }

    // Validate structure
    if (typeof result.score !== 'number' || result.score < 0 || result.score > 100) {
      throw new LLMParseError(`Invalid score value: ${result.score}`);
    }
    if (typeof result.explanation !== 'string' || result.explanation.trim() === '') {
      throw new LLMParseError('Invalid or empty explanation string in LLM response.');
    }

    return {
      score: Math.round(result.score),
      explanation: result.explanation.trim()
    };
  } finally {
    clearTimeout(timeoutId);
  }
};

module.exports = {
  scoreCompatibility,
  LLMParseError
};

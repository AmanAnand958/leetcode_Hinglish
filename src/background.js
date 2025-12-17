// Background service worker for handling API calls and caching

const CACHE_KEY = 'translation_cache';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const DEFAULT_API_KEY = 'sk-2031I32IIgdlJwESeEUz21Ns3FN136DMwjyP1rZxts0YdRry';
const OPENROUTER_API_KEY = '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';

// Set default API key if not already set
chrome.storage.sync.get('geminiApiKey', (result) => {
  if (!result.geminiApiKey) {
    chrome.storage.sync.set({ 'geminiApiKey': DEFAULT_API_KEY }, () => {
      console.log('Default API key set');
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'TRANSLATE') {
    // Wrap in async IIFE to ensure service worker doesn't terminate
    (async () => {
      try {
        const result = await handleTranslation(request.text, request.problemId);
        sendResponse(result);
      } catch (error) {
        console.error('Background message handler error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep the channel open for async response
  }
});

// Main translation handler
async function handleTranslation(text, problemId) {
  try {
    // Check cache first
    const cachedResult = await getFromCache(problemId);
    if (cachedResult) {
      return { success: true, translation: cachedResult, fromCache: true };
    }
    
    // Get API key using promise-based approach
    const apiKey = await new Promise((resolve) => {
      chrome.storage.sync.get('geminiApiKey', (result) => {
        resolve(result.geminiApiKey);
      });
    });
    
    if (!apiKey) {
      throw new Error('API key not configured. Please set it in extension settings.');
    }
    
    // Retry logic: Try parallel API race up to 3 times
    let translation;
    let lastError;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`\n🔄 Translation attempt ${attempt}/3`);
        console.log('Starting parallel API race: Routeway vs OpenRouter');
        
        const routewayPromise = callRoutewayAPI(text, apiKey)
          .then(result => ({ source: 'Routeway', result }))
          .catch(error => ({ source: 'Routeway', error }));
        
        const openRouterPromise = callOpenRouterAPI(text)
          .then(result => ({ source: 'OpenRouter', result }))
          .catch(error => ({ source: 'OpenRouter', error }));
        
        // Wait for both to complete
        const results = await Promise.all([routewayPromise, openRouterPromise]);
        
        // Find first successful result
        const successResult = results.find(r => r.result && !r.error);
        
        if (successResult) {
          console.log(`✅ ${successResult.source} won the race on attempt ${attempt}!`);
          translation = successResult.result;
          break; // Success! Exit retry loop
        } else {
          // Both failed this attempt
          const errors = results.map(r => `${r.source}: ${r.error?.message || 'Unknown error'}`).join('; ');
          lastError = new Error(`All APIs failed: ${errors}`);
          console.warn(`❌ Attempt ${attempt} failed: ${errors}`);
          
          if (attempt < 3) {
            // Wait before retry (exponential backoff: 2s, 4s)
            const waitTime = attempt * 2000;
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} error:`, error);
        
        if (attempt < 3) {
          const waitTime = attempt * 2000;
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // If all retries failed, throw the last error
    if (!translation) {
      throw lastError || new Error('Translation failed after 3 attempts');
    }
    
    // Cache the result
    await saveToCache(problemId, translation);
    
    return { success: true, translation: translation, fromCache: false };
  } catch (error) {
    console.error('Translation error:', error);
    return { success: false, error: error.message };
  }
}



// Call Routeway/OpenAI-compatible API (for free DeepSeek)
async function callRoutewayAPI(text, apiKey) {
  const apiUrl = 'https://api.routeway.ai/v1/chat/completions';
  
  console.log('Calling Routeway API...');
  
  const payload = {
    model: "deepseek-v3.1-terminus:free",
    messages: [
      {
        role: "user",
        content: `Translate this text to Hinglish (Hindi + English mix). 

IMPORTANT RULES:
- PRESERVE ALL HTML structure exactly (lists, bullets, paragraphs, formatting)
- Keep code, numbers, variable names, and technical terms unchanged
- Only translate human-readable English words to Hindi/Hinglish
- Use HTML tags: <ul>, <ol>, <li> for lists, <strong> for bold, <code> for code
- Do NOT use Markdown syntax
- Maintain the exact same structure and formatting as the input

Text to translate:
${text}`
      }
    ],
    temperature: 0.3,
    max_tokens: 8000
  };
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Routeway API response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        console.error('Routeway API error:', response.status, errorData);
        errorMessage = errorData.error?.message || errorData.message || JSON.stringify(errorData);
      } catch (e) {
        // If JSON parsing fails, try to get text
        try {
          const errorText = await response.text();
          console.error('Routeway API error (text):', response.status, errorText);
          errorMessage = errorText || response.statusText;
        } catch (e2) {
          console.error('Could not parse error response');
        }
      }
      throw new Error(`Routeway API error (${response.status}): ${errorMessage}`);
    }
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid API response format');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Routeway API fetch error:', error);
    throw error;
  }
}
async function getFromCache(problemId) {
  return new Promise((resolve) => {
    chrome.storage.local.get(CACHE_KEY, (items) => {
      const cache = items[CACHE_KEY] || {};
      const cached = cache[problemId];
      
      if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
        resolve(cached.translation);
      } else {
        resolve(null);
      }
    });
  });
}

async function saveToCache(problemId, translation) {
  return new Promise((resolve) => {
    chrome.storage.local.get(CACHE_KEY, (items) => {
      const cache = items[CACHE_KEY] || {};
      cache[problemId] = {
        translation: translation,
        timestamp: Date.now()
      };
      chrome.storage.local.set({ [CACHE_KEY]: cache }, resolve);
    });
  });
}

// Call OpenRouter API (fallback)
async function callOpenRouterAPI(text) {
  const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  
  console.log('Calling OpenRouter API (fallback)...');
  
  const payload = {
    model: "deepseek/deepseek-r1-0528:free",
    messages: [
      {
        role: "user",
        content: `Translate this text to Hinglish (Hindi + English mix). 

IMPORTANT RULES:
- PRESERVE ALL HTML structure exactly (lists, bullets, paragraphs, formatting)
- Keep code, numbers, variable names, and technical terms unchanged
- Only translate human-readable English words to Hindi/Hinglish  
- Use HTML tags: <ul>, <ol>, <li> for lists, <strong> for bold, <code> for code
- Do NOT use Markdown syntax
- Maintain the exact same structure and formatting as the input

Text to translate:
${text}`
      }
    ],
    temperature: 0.3,
    max_tokens: 8000
  };
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://leetcode.com',
        'X-Title': 'LeetCode Hinglish Translator'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('OpenRouter API response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        console.error('OpenRouter API error:', response.status, errorData);
        errorMessage = errorData.error?.message || errorData.message || JSON.stringify(errorData);
      } catch (e) {
        try {
          const errorText = await response.text();
          console.error('OpenRouter API error (text):', response.status, errorText);
          errorMessage = errorText || response.statusText;
        } catch (e2) {
          console.error('Could not parse error response');
        }
      }
      throw new Error(`OpenRouter API error (${response.status}): ${errorMessage}`);
    }
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenRouter API response:', data);
      throw new Error('Invalid API response format');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API fetch error:', error);
    throw error;
  }
}

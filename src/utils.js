// Utility functions for translation

// Extract text from problem description on LeetCode
function extractProblemContent() {
  const content = {
    description: null,
    examples: null
  };
  
  // Try multiple selectors to find problem description
  const descriptionSelectors = [
    '[data-testid="description-content"]',
    '.description-content',
    '.prose',
    '[class*="description"]'
  ];
  
  for (const selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      content.description = element.innerText;
      break;
    }
  }
  
  // Try to find examples
  const exampleSelectors = [
    '[data-testid="examples"]',
    '.examples',
    '[class*="example"]'
  ];
  
  for (const selector of exampleSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      content.examples = element.innerText;
      break;
    }
  }
  
  return content;
}

// Replace problem content with translated version
function replaceProblemContent(originalContent, translatedContent) {
  const descriptionSelectors = [
    '[data-testid="description-content"]',
    '.description-content',
    '.prose',
    '[class*="description"]'
  ];
  
  for (const selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element && originalContent.description) {
      // Create a wrapper to preserve HTML structure but replace text
      element.innerHTML = element.innerHTML.replace(
        originalContent.description,
        translatedContent.description
      );
      break;
    }
  }
}

// Sanitize text for API (remove excessive whitespace)
function sanitizeText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 3000); // Limit to 3000 chars to stay within API limits
}

// Format content for translation request
function formatTranslationRequest(description, examples) {
  let content = 'Translate the following LeetCode problem to Hinglish (Hindi written in Roman script). Keep code, variable names, and technical terms unchanged:\n\n';
  
  if (description) {
    content += 'PROBLEM DESCRIPTION:\n' + description + '\n\n';
  }
  
  if (examples) {
    content += 'EXAMPLES:\n' + examples;
  }
  
  return content;
}

// Parse translated content
function parseTranslatedContent(translatedText) {
  // Try to extract the translated content from the API response
  // Remove any preamble or explanations
  let cleanedText = translatedText
    .replace(/^[\s\S]*?PROBLEM DESCRIPTION:?\s*/i, '')
    .trim();
  
  return cleanedText;
}

export { extractProblemContent, replaceProblemContent, sanitizeText, formatTranslationRequest, parseTranslatedContent };

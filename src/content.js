// Content script injected into LeetCode pages

let extensionEnabled = true;
let translationInProgress = false;
let translatedProblems = new Set(); // Track which problems have been translated
let originalContent = null; // Store original English content
let translateButton = null; // Reference to translate button

// Check if extension is enabled
chrome.storage.local.get('extensionEnabled', (result) => {
  if (result.extensionEnabled !== undefined) {
    extensionEnabled = result.extensionEnabled;
  }
  // Initialize button after checking state
  initializeTranslateButton();
});

// Listen for extension toggle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXTENSION_TOGGLED') {
    extensionEnabled = request.enabled;
    
    if (!extensionEnabled) {
      // Restore original content when disabled
      restoreOriginalContent();
      if (translateButton) {
        translateButton.style.display = 'none';
      }
    } else {
      // Show button when enabled
      if (translateButton) {
        translateButton.style.display = 'block';
      }
    }
    
    sendResponse({ success: true });
  }
});

// Create and inject translate button
function initializeTranslateButton() {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createTranslateButton);
  } else {
    createTranslateButton();
  }
}

function createTranslateButton() {
  // Remove existing button if any
  const existing = document.getElementById('hinglish-translate-btn');
  if (existing) existing.remove();
  
  // Create button
  translateButton = document.createElement('button');
  translateButton.id = 'hinglish-translate-btn';
  translateButton.innerHTML = '🔤 Translate to Hinglish';
  // Liquid Glass Effect Styling
  translateButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px) saturate(180%);
    -webkit-backdrop-filter: blur(10px) saturate(180%);
    color: #1a1a1a;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: move;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    transition: all 0.3s ease;
    display: ${extensionEnabled ? 'block' : 'none'};
    user-select: none;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
  `;
  
  // Dragging state
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;
  
  // Hover effect
  translateButton.onmouseenter = () => {
    if (!isDragging) {
      translateButton.style.transform = `translate(${xOffset}px, ${yOffset}px) scale(1.02)`;
      translateButton.style.boxShadow = '0 12px 40px 0 rgba(31, 38, 135, 0.5)';
      translateButton.style.background = 'rgba(255, 255, 255, 0.2)';
    }
  };
  translateButton.onmouseleave = () => {
    if (!isDragging) {
      translateButton.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
      translateButton.style.boxShadow = '0 8px 32px 0 rgba(31, 38, 135, 0.37)';
      translateButton.style.background = 'rgba(255, 255, 255, 0.15)';
    }
  };
  
  // Drag start
  translateButton.onmousedown = (e) => {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    
    if (e.target === translateButton) {
      isDragging = true;
      translateButton.style.cursor = 'grabbing';
      translateButton.style.transition = 'none'; // Disable transition during drag
    }
  };
  
  // Dragging
  document.onmousemove = (e) => {
    if (isDragging) {
      e.preventDefault();
      
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      
      xOffset = currentX;
      yOffset = currentY;
      
      translateButton.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
  };
  
  // Drag end
  document.onmouseup = (e) => {
    if (isDragging) {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      translateButton.style.cursor = 'move';
      translateButton.style.transition = 'all 0.3s ease'; // Re-enable transition
    }
  };
  
  // Click handler (only trigger if not dragging)
  let mouseDownTime;
  let clickHandler = function() {
    if (!translationInProgress && extensionEnabled) {
      attemptTranslation();
    }
  };
  
  translateButton.addEventListener('mousedown', () => {
    mouseDownTime = Date.now();
  });
  
  translateButton.addEventListener('mouseup', (e) => {
    const mouseUpTime = Date.now();
    const timeDiff = mouseUpTime - mouseDownTime;
    
    // Only trigger click if it was a quick click (not a drag)
    if (timeDiff < 200) {
      clickHandler();
    }
  });
  
  // Store reference to update click handler later
  translateButton.updateClickHandler = function(newHandler) {
    clickHandler = newHandler;
  };
  
  document.body.appendChild(translateButton);
}

// Listen for URL changes (for SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    translatedProblems.clear(); // Clear cache when navigating to new problem
    originalContent = null; // Clear original content
    createTranslateButton(); // Recreate button for new page
  }
}).observe(document, { subtree: true, childList: true });

function restoreOriginalContent() {
  if (!originalContent) return;
  
  const descriptionSelectors = [
    '[data-testid="description-content"]',
    '.description-content',
    '.prose',
    '[class*="description"]',
    '.elfjS'
  ];
  
  for (const selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element && originalContent) {
      element.innerHTML = originalContent;
      console.log('✅ Original content restored');
      break;
    }
  }
  
  // Reset translated state
  const problemId = getProblemId();
  translatedProblems.delete(problemId);
  
  // Update button
  if (translateButton) {
    translateButton.innerHTML = '🔤 Translate to Hinglish';
    translateButton.disabled = false;
  }
}

async function attemptTranslation() {
  try {
    if (translationInProgress) {
      return; // Skip if already translating
    }
    
    // Get problem ID from URL for caching
    const problemId = getProblemId();
    
    // Skip if already translated
    if (translatedProblems.has(problemId)) {
      console.log(`Problem ${problemId} already translated, skipping`);
      if (translateButton) {
        translateButton.innerHTML = '✅ Translated';
        translateButton.disabled = true;
        translateButton.style.opacity = '0.7';
      }
      return;
    }
    
    const problemContent = extractProblemContent();
    
    if (!problemContent.description) {
      console.log('No problem description found');
      return; // No problem content found
    }
    
    // Store original content before translating
    if (!originalContent && problemContent.originalElement) {
      originalContent = problemContent.originalElement.innerHTML;
      console.log('📝 Original content stored');
    }
    
    translationInProgress = true;
    
    // Update button to show loading state
    if (translateButton) {
      translateButton.innerHTML = '⏳ Converting...';
      translateButton.disabled = true;
      translateButton.style.cursor = 'wait';
    }
    
    console.log(`Starting translation for problem: ${problemId}`);
    
    // Request translation from background script with timeout
    try {
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          translationInProgress = false;
          reject(new Error('Translation request timeout'));
        }, 60000); // 60 second timeout for parallel API race
        
        chrome.runtime.sendMessage(
          {
            type: 'TRANSLATE',
            text: problemContent.description + (problemContent.examples ? '\n\n' + problemContent.examples : ''),
            problemId: problemId
          },
          (response) => {
            clearTimeout(timeout);
            translationInProgress = false;
            
            if (chrome.runtime.lastError) {
              console.error('Chrome runtime error:', chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
            } else if (!response) {
              reject(new Error('No response from background script'));
            } else {
              resolve(response);
            }
          }
        );
      });
      
      if (response && response.success) {
        console.log('Translation received:', response.fromCache ? '(cached)' : '(fresh)');
        console.log('Translation text:', response.translation.substring(0, 100) + '...');
        
        
        replaceProblemContent(response.translation);
        
        // Mark as translated
        translatedProblems.add(problemId);
        
        console.log('Translation applied:', response.fromCache ? '(cached)' : '(fresh)');
        
        
        // Update button to show toggle option
        if (translateButton) {
          translateButton.innerHTML = '🔙 Translate back to English';
          translateButton.style.cursor = 'pointer';
          translateButton.style.opacity = '1';
          translateButton.disabled = false;
          
          // Update click handler to restore original
          translateButton.updateClickHandler(() => {
            restoreOriginalContent();
            translateButton.innerHTML = '🔤 Translate to Hinglish';
            translateButton.updateClickHandler(() => {
              if (!translationInProgress && extensionEnabled) {
                attemptTranslation();
              }
            });
          });
        }
      } else if (response && response.error) {
        console.warn('Translation failed:', response.error);
        
        // Update button to show error
        if (translateButton) {
          translateButton.innerHTML = '❌ Translation Failed';
          translateButton.disabled = false;
          translateButton.style.cursor = 'pointer';
          
          // Reset button after 3 seconds
          setTimeout(() => {
            translateButton.innerHTML = '🔤 Translate to Hinglish';
          }, 3000);
        }
      }
    } catch (error) {
      translationInProgress = false;
      console.error('Translation request error:', error);
      
      // Update button to show error
      if (translateButton) {
        translateButton.innerHTML = '❌ Error - Click to Retry';
        translateButton.disabled = false;
        translateButton.style.cursor = 'pointer';
      }
    }
  } catch (error) {
    translationInProgress = false;
    console.error('Translation attempt error:', error);
    
    // Update button to show error
    if (translateButton) {
      translateButton.innerHTML = '❌ Error - Click to Retry';
      translateButton.disabled = false;
      translateButton.style.cursor = 'pointer';
    }
  }
}

// Extract problem content from DOM
function extractProblemContent() {
  const content = {
    description: null,
    examples: null,
    originalElement: null
  };
  
  // Try multiple selectors to find problem description
  const descriptionSelectors = [
    '[data-testid="description-content"]',
    '.description-content',
    '.prose',
    '[class*="description"]',
    '.elfjS'
  ];
  
  for (const selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      content.originalElement = element;
      // Get all text including nested elements but preserve structure
      content.description = extractTextWithStructure(element);
      break;
    }
  }
  
  // Try to find examples separately
  const exampleSelectors = [
    '[data-testid="examples"]',
    '.examples',
    '[class*="example"]'
  ];
  
  for (const selector of exampleSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      content.examples = extractTextWithStructure(element);
      break;
    }
  }
  
  return content;
}

// Extract HTML while preserving structure
function extractTextWithStructure(element) {
  // Clone the element to avoid modifying the original
  const clone = element.cloneNode(true);
  
  // Remove script, style, and noscript tags
  const unwantedTags = clone.querySelectorAll('script, style, noscript');
  unwantedTags.forEach(tag => tag.remove());
  
  // Get the innerHTML which preserves all HTML structure
  return clone.innerHTML.trim();
}

// Replace problem content with translated version
function replaceProblemContent(translatedText) {
  const descriptionSelectors = [
    '[data-testid="description-content"]',
    '.description-content',
    '.prose',
    '[class*="description"]',
    '.elfjS'
  ];
  
  for (const selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      // Simple approach: replace the text content directly while keeping structure
      simpleTextReplace(element, translatedText);
      console.log('✅ Translation replaced in DOM');
      break;
    }
  }
}

// Convert Markdown to HTML
function markdownToHtml(markdown) {
  let html = markdown;
  
  // If the content already has HTML tags, use it as-is but still process Markdown
  const hasHtmlTags = /<(p|div|strong|em|code|pre|h[1-6]|ul|ol|li)[\s>]/.test(html);
  
  // Convert code blocks with language (```language\ncode\n```)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // Convert inline code (`code`) - but not if already in <code> tags
  if (!hasHtmlTags) {
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert bold (**text** or __text__)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Convert italic (*text* or _text_)
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Convert headers (# Header)
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  }
  
  // If already has HTML structure, return as-is
  if (hasHtmlTags) {
    return html;
  }
  
  // Convert line breaks to <br> and wrap paragraphs
  const lines = html.split('\n');
  let result = '';
  let inList = false;
  let inParagraph = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      if (inParagraph) {
        result += '</p>';
        inParagraph = false;
      }
      continue;
    }
    
    // Check if line is already wrapped in HTML tags
    if (line.match(/^<(h[1-6]|pre|ul|ol|li)/)) {
      if (inParagraph) {
        result += '</p>';
        inParagraph = false;
      }
      result += line + '\n';
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // List item
      if (!inList) {
        if (inParagraph) {
          result += '</p>';
          inParagraph = false;
        }
        result += '<ul>';
        inList = true;
      }
      result += '<li>' + line.substring(2) + '</li>';
    } else if (line.match(/^\d+\. /)) {
      // Numbered list
      if (!inList) {
        if (inParagraph) {
          result += '</p>';
          inParagraph = false;
        }
        result += '<ol>';
        inList = true;
      }
      result += '<li>' + line.replace(/^\d+\. /, '') + '</li>';
    } else {
      // Regular paragraph
      if (inList) {
        result += inList === 'ul' ? '</ul>' : '</ol>';
        inList = false;
      }
      if (!inParagraph) {
        result += '<p>';
        inParagraph = true;
      } else {
        result += ' ';
      }
      result += line;
    }
  }
  
  if (inParagraph) result += '</p>';
  if (inList) result += '</ul>';
  
  return result;
}

// Escape HTML special characters
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Replace element content with translated text while preserving structure
function simpleTextReplace(element, translatedText) {
  // Parse the translated HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = translatedText;
  
  // Simply replace the innerHTML but preserve images
  const images = Array.from(element.querySelectorAll('img'));
  const imageData = images.map(img => ({
    outerHTML: img.outerHTML,
    alt: img.alt
  }));
  
  // Replace content
  element.innerHTML = translatedText;
  
  // Re-insert images
  if (imageData.length > 0) {
    const allElements = element.querySelectorAll('p, div, li');
    imageData.forEach((imgData, index) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = imgData.outerHTML;
      const img = tempDiv.firstChild;
      
      const insertIndex = Math.min(index * 2, allElements.length - 1);
      if (allElements[insertIndex]) {
        allElements[insertIndex].after(img);
      } else {
        element.appendChild(img);
      }
    });
  }
}


// Get problem ID from URL or page content
function getProblemId() {
  const match = window.location.pathname.match(/\/problems\/([^\/]+)\//);
  if (match) {
    return match[1];
  }
  
  // Fallback: try to get from page title
  return document.title.split(' - ')[0] || 'unknown';
}

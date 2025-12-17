# LeetCode to Hinglish Translator

A Chrome extension that automatically translates LeetCode problem descriptions and examples from English to Hinglish (Hindi written in Roman/Latin script) using Google's Gemini API.

## Features

- 🔤 Converts LeetCode problem descriptions to Hinglish
- 📚 Translates problem examples automatically
- ⚡ Caches translations for faster loading on revisits (7-day expiry)
- 🎛️ Toggle extension on/off from popup
- 🔒 Securely stores your Gemini API key
- 🚀 Uses free Gemini API tier

## Installation

### Prerequisites

1. A Google account with access to [Google AI Studio](https://makersuite.google.com/)
2. A free Gemini API key

### Steps

1. **Get your Gemini API Key**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Click "Create API Key"
   - Copy your API key

2. **Load the Extension**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select this folder (`/Users/amananand/Desktop/hinglish extension`)

3. **Configure the Extension**
   - Click the extension icon in your Chrome toolbar
   - Click "⚙️ API Key Settings"
   - Paste your Gemini API key
   - Click "Save Settings"

4. **Start Using**
   - Navigate to any LeetCode problem
   - The extension will automatically translate the problem description and examples to Hinglish
   - Use the popup toggle to enable/disable translations

## How It Works

1. **Content Script** (`src/content.js`): Monitors LeetCode pages for problem content
2. **Translation Request**: Sends problem text to the background service worker
3. **API Call** (`src/background.js`): Calls Gemini API with translation prompt
4. **Caching**: Results are cached locally for 7 days
5. **DOM Update**: Translated text replaces original content while preserving HTML structure

## File Structure

```
hinglish extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── options.html          # Settings page
├── options.js            # Settings functionality
├── src/
│   ├── background.js     # Service worker (API calls, caching)
│   ├── content.js        # Content script (DOM manipulation)
│   └── utils.js          # Utility functions
└── assets/               # Icons directory
```

## API Usage

- **Free Tier Limits**: ~60 requests/minute
- **Cache Duration**: 7 days
- **Text Limit**: 3000 characters per request

## Troubleshooting

### Extension not translating?
- Ensure "Developer mode" is enabled in `chrome://extensions/`
- Verify your Gemini API key is correct in settings
- Try refreshing the LeetCode page
- Check that you have internet connection

### "API key not set" error
- Click the extension icon → "⚙️ API Key Settings"
- Enter your Gemini API key from Google AI Studio
- Click "Save Settings"

### Translation not appearing?
- The translation may take 5-10 seconds to appear
- Check your API key is valid
- Verify rate limits haven't been exceeded (max ~60 requests/minute)
- Try disabling and re-enabling the extension

## API Key Security

- Your API key is stored in `chrome.storage.sync` (encrypted by Chrome)
- The key is never shared or logged
- Only sent to Google's Gemini API for translation
- You can clear it anytime from settings

## Performance Notes

- First translation of a problem: 5-10 seconds
- Cached translations: Instant
- Translations are cached per problem for 7 days
- Large problems may take longer to translate

## Development

To modify the extension:

1. Edit files in the extension folder
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension
4. Reload LeetCode page to see changes

## Future Enhancements

- [ ] Support for other languages
- [ ] Custom translation prompts/styles
- [ ] Batch translation for multiple problems
- [ ] Statistics dashboard
- [ ] Translation quality feedback
- [ ] Keyboard shortcuts for quick toggle

## Support

For issues or feature requests, please check:
- Gemini API quota in [Google AI Studio](https://makersuite.google.com/)
- Chrome console (right-click → Inspect → Console tab) for errors
- Verify LeetCode page is fully loaded before triggering translation

## License

This extension is provided as-is for personal use.

---

**Note**: This extension requires an active internet connection and valid Gemini API key to function.

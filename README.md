# LeetCode Hinglish Translator 🔤

A Chrome extension that translates LeetCode problem descriptions from English to Hinglish (Hindi + English mix) with a single click!

## ✨ Features

- 🎯 **One-Click Translation**: Draggable translate button on every problem
- ⚡ **Parallel API Racing**: Uses both Routeway and OpenRouter simultaneously for fastest response
- � **Toggle Languages**: Switch between English and Hinglish instantly
- 💾 **Smart Caching**: Translations cached for 7 days (instant on revisit)
- 🖼️ **Preserves Everything**: Images, code blocks, lists, and formatting stay intact
- 🎨 **Native Look**: Maintains LeetCode's original styling
- 🔁 **Auto-Retry**: 3 automatic retries with exponential backoff
- 🆓 **Completely Free**: Uses free API tiers

## 🚀 Quick Start

### Installation

1. **Download the Extension**

   ```bash
   git clone https://github.com/AmanAnand958/leetcode_Hinglish.git
   cd leetcode_Hinglish
   ```

2. **Load in Chrome**

   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)
   - Click "Load unpacked"
   - Select the extension folder

3. **Start Using**
   - Visit any LeetCode problem
   - Click the "🔤 Translate to Hinglish" button
   - Click "🔙 Translate back to English" to restore

**That's it!** No API key setup needed - it works out of the box! 🎉

## 🎮 Usage

### Basic Usage

1. Navigate to any LeetCode problem
2. Look for the floating translate button (bottom-right)
3. Click to translate to Hinglish
4. Click again to restore English

### Advanced Features

- **Drag the Button**: Click and drag to reposition anywhere on screen
- **Toggle Extension**: Use the popup to enable/disable
- **Clear Cache**: Click "Clear Cache" in popup to get fresh translations

## 🏗️ How It Works

```
User clicks "Translate"
         ↓
    ┌────┴────┐
    ↓         ↓
Routeway   OpenRouter
(DeepSeek) (DeepSeek R1)
    ↓         ↓
    └────┬────┘
         ↓
   First to respond wins!
         ↓
   Cache for 7 days
         ↓
   Display translation
```

### Technical Details

- **Parallel API Racing**: Both APIs called simultaneously
- **Automatic Retry**: 3 attempts with 2s, 4s delays
- **Smart Caching**: Stores translations in `chrome.storage.local`
- **HTML Preservation**: Extracts and preserves full HTML structure
- **Image Handling**: Saves and re-inserts images after translation

## 📁 File Structure

```
leetcode_Hinglish/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
├── options.html          # Settings page
├── options.js            # Settings logic
├── src/
│   ├── background.js     # API calls, caching, retry logic
│   ├── content.js        # DOM manipulation, button, translation
│   └── utils.js          # Helper functions
└── assets/
    ├── icon16.png        # Extension icons
    ├── icon48.png
    └── icon128.png
```

## 🔧 Configuration

### API Keys (Pre-configured)

The extension comes with default API keys:

- **Routeway**: DeepSeek V3.1 (free tier)
- **OpenRouter**: DeepSeek R1 (free tier)

### Custom API Keys (Optional)

To use your own keys:

1. Click extension icon → "⚙️ API Key Settings"
2. Enter your Routeway API key
3. Click "Save Settings"

Get free API keys:

- Routeway: https://api.routeway.ai
- OpenRouter: https://openrouter.ai

## ⚙️ Settings

### Cache Management

- **Duration**: 7 days
- **Clear Cache**: Popup → "Clear Cache" button
- **Auto-Clear**: On URL change (new problem)

### Translation Control

- **Enable/Disable**: Toggle in popup
- **Manual Trigger**: Click translate button
- **Restore Original**: Click "Translate back to English"

## 🐛 Troubleshooting

### Translation not working?

1. Check internet connection
2. Reload the extension at `chrome://extensions/`
3. Clear cache and try again
4. Check console for errors (F12 → Console)

### Button not appearing?

1. Refresh the LeetCode page
2. Ensure extension is enabled in popup
3. Check if you're on a problem page (not problem list)

### Translation cut off?

- Increased token limit to 8000 (handles longest problems)
- If still cut off, clear cache and retry

### Images missing?

- Should be preserved automatically
- If missing, report as bug with problem URL

## 🎯 Performance

| Metric             | Value       |
| ------------------ | ----------- |
| First Translation  | 2-5 seconds |
| Cached Translation | Instant     |
| Cache Duration     | 7 days      |
| Max Token Limit    | 8000 tokens |
| Retry Attempts     | 3 times     |
| API Timeout        | 60 seconds  |

## 🔒 Privacy & Security

- ✅ No data collection
- ✅ No tracking
- ✅ API keys stored locally (encrypted by Chrome)
- ✅ Translations cached locally
- ✅ No external servers (except translation APIs)

## 🛠️ Development

### Making Changes

1. Edit files in the extension folder
2. Go to `chrome://extensions/`
3. Click refresh icon on the extension
4. Reload LeetCode page

### Testing

```bash
# Test Routeway API
node test-deepseek-free.js

# Test OpenRouter API
node test-openrouter.js
```

### Key Functions

- `attemptTranslation()`: Main translation logic
- `extractTextWithStructure()`: Extracts HTML from problem
- `simpleTextReplace()`: Replaces content with translation
- `restoreOriginalContent()`: Restores English version

## 📊 API Details

### Routeway (Primary)

- **Model**: DeepSeek V3.1 Terminus
- **Endpoint**: `api.routeway.ai/v1/chat/completions`
- **Rate Limit**: Free tier
- **Max Tokens**: 8000

### OpenRouter (Fallback)

- **Model**: DeepSeek R1 0528
- **Endpoint**: `openrouter.ai/api/v1/chat/completions`
- **Rate Limit**: Free tier
- **Max Tokens**: 8000

## 🚧 Known Issues

- None currently! 🎉

## 🔮 Future Enhancements

- [ ] Support for other languages (Spanish, French, etc.)
- [ ] Keyboard shortcuts (Ctrl+T to translate)
- [ ] Translation quality rating
- [ ] Custom translation styles
- [ ] Batch translation for multiple problems
- [ ] Statistics dashboard

## 📝 License

MIT License - Free to use and modify

## 🤝 Contributing

Contributions welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

## 📧 Support

For issues or questions:

- Open an issue on GitHub
- Check Chrome console for errors
- Ensure you're on latest version

---

**Made with ❤️ for LeetCode learners who prefer Hinglish**

**Note**: This extension requires an active internet connection to translate new problems.

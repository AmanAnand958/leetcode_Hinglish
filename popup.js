document.addEventListener('DOMContentLoaded', async () => {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusDiv = document.getElementById('status');
  
  // Load current state
  const extensionEnabled = await new Promise((resolve) => {
    chrome.storage.local.get('extensionEnabled', (result) => {
      resolve(result.extensionEnabled !== undefined ? result.extensionEnabled : true);
    });
  });
  toggleSwitch.checked = extensionEnabled;
  
  // Toggle handler
  toggleSwitch.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await new Promise((resolve) => {
      chrome.storage.local.set({ extensionEnabled: enabled }, resolve);
    });
    
    // Notify content script
    const tabs = await chrome.tabs.query({ url: ['https://*.leetcode.com/*'] });
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { 
        type: 'EXTENSION_TOGGLED', 
        enabled: enabled 
      }).catch(() => {}); // Ignore errors if content script not loaded
    });
    
    showStatus(enabled ? 'Translation enabled' : 'Translation disabled', 'success');
  });
  
  // Check if API key is set
  const apiKey = await new Promise((resolve) => {
    chrome.storage.sync.get('geminiApiKey', (result) => {
      resolve(result.geminiApiKey);
    });
  });
  
  if (!apiKey) {
    showStatus('⚠️ API key not set. Click settings to configure.', 'error');
  }
  
  // Clear cache button handler
  document.getElementById('clearCache').addEventListener('click', async () => {
    await new Promise((resolve) => {
      chrome.storage.local.remove('translation_cache', resolve);
    });
    showStatus('✅ Translation cache cleared!', 'success');
  });
});

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  if (type !== 'error') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

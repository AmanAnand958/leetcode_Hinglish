document.addEventListener('DOMContentLoaded', async () => {
  // Load stored API key
  const apiKey = await new Promise((resolve) => {
    chrome.storage.sync.get('geminiApiKey', (result) => {
      resolve(result.geminiApiKey);
    });
  });
  
  if (apiKey) {
    document.getElementById('apiKey').value = apiKey;
  }
  
  // Add event listeners
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  document.getElementById('clearBtn').addEventListener('click', clearSettings);
});

async function saveSettings() {
  const apiKey = document.getElementById('apiKey').value.trim();
  
  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return;
  }
  
  await chrome.storage.sync.set({ geminiApiKey: apiKey });
  showStatus('✓ Settings saved successfully', 'success');
}

function clearSettings() {
  if (confirm('Are you sure you want to clear your API key?')) {
    document.getElementById('apiKey').value = '';
    chrome.storage.sync.remove('geminiApiKey');
    showStatus('API key cleared', 'success');
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}

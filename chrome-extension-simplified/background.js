// Minimal backend API relay background script
console.log('🚀 Background script starting...');

const SERVER_URL = 'https://ai-assistant-hub-app.azurewebsites.net';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (request.action === 'summarizePage') {
        const summary = await summarizeText(request.text);
        sendResponse({ success: true, summary });
      } else if (request.action === 'fillField') {
        const value = await fillField(request.context, request.instruction);
        sendResponse({ success: true, value });
      } else {
        sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  })();
  return true; // Keep message channel open for async
});

async function summarizeText(text) {
  // Limit text to 3000 characters to reduce token usage
  text = text.slice(0, 3000);
  
  const response = await fetch(`${SERVER_URL}/api/ai/summarize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to summarize');
  }
  
  const data = await response.json();
  return data.summary;
}

async function fillField(context, instruction) {
  const response = await fetch(`${SERVER_URL}/api/ai/fill-form`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      formData: { context },
      userContext: instruction 
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fill field');
  }
  
  const data = await response.json();
  return data.suggestions.context || 'Sample text';
}

console.log('✅ Background script loaded');
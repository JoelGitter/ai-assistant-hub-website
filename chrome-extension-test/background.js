// Minimal OpenAI API relay background script
console.log('🚀 Background script starting...');

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (request.action === 'summarizePage') {
        const summary = await summarizeText(request.apiKey, request.text);
        sendResponse({ success: true, summary });
      } else if (request.action === 'fillField') {
        const value = await fillField(request.apiKey, request.context, request.instruction);
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

async function summarizeText(apiKey, text) {
  // Limit text to 3000 characters to reduce token usage
  text = text.slice(0, 3000);
  const prompt = `You are a friendly, modern AI assistant. Summarize the following web page content as a numbered list of exactly 5 of the most important points. Each item should be concise, clear, and capture a key idea. Skip navigation/ads, use a conversational tone.\n\n${text}`;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful, modern AI assistant that summarizes web pages for users.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.5,
    }),
  });
  if (response.status === 429) {
    throw new Error('You have hit the OpenAI rate limit (error 429). Please wait a minute and try again, or check your API usage at https://platform.openai.com/account/usage.');
  }
  if (!response.ok) throw new Error('OpenAI API error: ' + response.status);
  const data = await response.json();
  let summary = data.choices[0].message.content.trim();
  // Post-process: bold numbers and put each on its own row
  summary = summary.replace(/^(\d+)\./gm, '<b>$1.</b>');
  summary = summary.replace(/\n/g, '<br>');
  return summary;
}

async function fillField(apiKey, context, instruction) {
  let prompt = `You are a smart, modern AI assistant. Given the following context for a form field, write a realistic, human-like value a user might enter. Be context-aware, natural, and helpful. Be specific, detailed, and creative. Provide a response that is advanced, nuanced, and context-rich.`;
  if (instruction && instruction.trim()) {
    prompt += `\nInstruction: ${instruction}`;
  }
  prompt += `\n\nContext:\n${context}\n\nValue:`;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful, modern AI assistant that fills out web forms for users.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 250,
      temperature: 0.85,
    }),
  });
  if (!response.ok) throw new Error('OpenAI API error: ' + response.status);
  const data = await response.json();
  let result = data.choices[0].message.content.trim();
  return result;
}

console.log('✅ Background script loaded');
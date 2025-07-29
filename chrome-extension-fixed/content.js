// Fresh AI Assistant Content Script with Smart Form Filling
console.log("🚀 Fresh content script starting...");

// Server configuration
const SERVER_URL = 'https://ai-assistant-hub-app.azurewebsites.net';

// --- Last Eligible Field Tracker (global scope) ---
let lastEligibleField = null;

// --- Eligible Field Helper (global scope) ---
function isEligibleField(el) {
  if (!el) return false;
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName === 'INPUT') {
    const badTypes = ['hidden','button','submit','reset','image','file','checkbox','radio'];
    return !badTypes.includes(el.type);
  }
  return false;
}

// --- Readability.js integration (global scope) ---
function getReadabilityText() {
  if (window.Readability) {
    try {
      const article = new window.Readability(document.cloneNode(true)).parse();
      if (article && article.textContent && article.textContent.length > 200) {
        return article.textContent;
      }
    } catch (e) {
      // fallback below
    }
  }
  return null;
}

// --- Smart Summarization Notification System (Global) ---
let summarizeNotification = null;
let notificationTimeout = null;

// Check if page is article-like with substantial content
function hasSubstantialText() {
  // First, check for feed-like patterns that should be excluded
  const url = window.location.href.toLowerCase();
  const domain = window.location.hostname.toLowerCase();
  
  // Exclude common feed and social media patterns
  const excludePatterns = [
    '/feed',
    '/home',
    '/dashboard',
    '/profile',
    '/jobs',
    '/search',
    '/browse',
    '/list',
    '/directory',
    '/marketplace',
    '/network',
    '/connections',
    '/messages',
    '/notifications',
    '/settings',
    '/account',
    '/login',
    '/signup',
    '/register',
    '/checkout',
    '/cart',
    '/product',
    '/shop',
    '/store',
    '/pricing',
    '/about',
    '/contact',
    '/help',
    '/support',
    '/faq',
    '/terms',
    '/privacy',
    '/legal'
  ];
  
  // Check if URL contains excluded patterns
  for (const pattern of excludePatterns) {
    if (url.includes(pattern)) {
      return false;
    }
  }
  
  // Exclude specific domains that are typically feeds
  const excludeDomains = [
    'linkedin.com',
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'tiktok.com',
    'youtube.com',
    'reddit.com',
    'pinterest.com',
    'indeed.com',
    'glassdoor.com',
    'monster.com',
    'careerbuilder.com',
    'ziprecruiter.com',
    'simplyhired.com',
    'dice.com',
    'stackoverflow.com',
    'github.com',
    'gitlab.com',
    'bitbucket.org',
    'trello.com',
    'asana.com',
    'slack.com',
    'discord.com',
    'teams.microsoft.com'
  ];
  
  for (const excludeDomain of excludeDomains) {
    if (domain.includes(excludeDomain)) {
      return false;
    }
  }
  
  // Check for feed-like page structure
  const feedIndicators = [
    '.feed',
    '.timeline',
    '.stream',
    '.wall',
    '.dashboard',
    '.home-feed',
    '.news-feed',
    '.activity-feed',
    '.job-list',
    '.job-board',
    '.job-search',
    '.search-results',
    '.browse-results',
    '.directory-list',
    '.marketplace-list',
    '.product-list',
    '.shop-list',
    '.store-list'
  ];
  
  for (const indicator of feedIndicators) {
    if (document.querySelector(indicator)) {
      return false;
    }
  }
  
  // Check for multiple similar elements (indicating a feed/list)
  const listSelectors = [
    'article',
    '.post',
    '.item',
    '.card',
    '.tile',
    '.job',
    '.listing',
    '.product',
    '.result'
  ];
  
  let listItemCount = 0;
  for (const selector of listSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 3) {
      listItemCount += elements.length;
    }
  }
  
  // If there are many similar elements, it's likely a feed
  if (listItemCount > 5) {
    return false;
  }
  
  // Now check for actual article content
  const articleSelectors = [
    'article[data-type="article"]',
    'article[data-post-type="post"]',
    'article[data-post-type="article"]',
    '.article-content',
    '.post-content',
    '.entry-content',
    '.story-content',
    '.blog-content',
    '.news-content',
    '.content-article'
  ];
  
  // Check for article-like elements with substantial content
  for (const selector of articleSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.innerText.replace(/\s+/g, ' ').trim();
      if (text.length > 500) {
        return true;
      }
    }
  }
  
  // Check for article-like URL patterns (more specific)
  const articlePatterns = [
    '/article/',
    '/post/',
    '/blog/',
    '/story/',
    '/news/',
    '/read/',
    '/content/',
    '/entry/',
    '/article-',
    '/post-',
    '/blog-',
    '/news-',
    '/story-'
  ];
  
  for (const pattern of articlePatterns) {
    if (url.includes(pattern)) {
      const readableText = getReadabilityText();
      if (readableText && readableText.length > 300) {
        return true;
      }
    }
  }
  
  // Check for article-like meta tags
  const metaArticle = document.querySelector('meta[property="og:type"][content="article"]');
  const metaNews = document.querySelector('meta[property="og:type"][content="news"]');
  const metaBlog = document.querySelector('meta[property="og:type"][content="blog"]');
  
  if (metaArticle || metaNews || metaBlog) {
    const readableText = getReadabilityText();
    if (readableText && readableText.length > 300) {
      return true;
    }
  }
  
  // Check for structured data indicating article content
  const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of structuredData) {
    try {
      const data = JSON.parse(script.textContent);
      if (data['@type'] === 'Article' || data['@type'] === 'NewsArticle' || data['@type'] === 'BlogPosting') {
        const readableText = getReadabilityText();
        if (readableText && readableText.length > 300) {
          return true;
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }
  
  // Final check: Use Readability.js but with higher threshold
  const readableText = getReadabilityText();
  if (readableText && readableText.length > 800) {
    // Additional check: make sure it's not just a list of items
    const sentences = readableText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 3) {
      return true;
    }
  }
  
  return false;
}

// Show summarization notification
function showSummarizeNotification() {
  if (summarizeNotification) return; // Already showing
  
  // Check if notifications are enabled
  chrome.storage.sync.get(['assistant_notifications'], (result) => {
    if (result.assistant_notifications === false) return;
    
    summarizeNotification = document.createElement('div');
    summarizeNotification.id = 'ai-summarize-notification';
    summarizeNotification.innerHTML = `
      <div class="ai-summarize-notification-content">
        <span>📄 Summarize this page</span>
        <button class="ai-summarize-btn">Summarize</button>
        <button class="ai-summarize-close">×</button>
      </div>
    `;
    
    // Add event listeners
    const summarizeBtn = summarizeNotification.querySelector('.ai-summarize-btn');
    const closeBtn = summarizeNotification.querySelector('.ai-summarize-close');
    
    summarizeBtn.addEventListener('click', () => {
      removeSummarizeNotification();
      summarizePageAction();
    });
    
    closeBtn.addEventListener('click', removeSummarizeNotification);
    
    // Auto-hide after 20 seconds
    notificationTimeout = setTimeout(removeSummarizeNotification, 20000);
    
    document.body.appendChild(summarizeNotification);
    
    // Animate in
    setTimeout(() => {
      summarizeNotification.classList.add('show');
    }, 100);
  });
}

// Remove summarization notification
function removeSummarizeNotification() {
  if (summarizeNotification) {
    summarizeNotification.classList.remove('show');
    setTimeout(() => {
      if (summarizeNotification && summarizeNotification.parentNode) {
        summarizeNotification.parentNode.removeChild(summarizeNotification);
      }
      summarizeNotification = null;
    }, 300);
  }
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
    notificationTimeout = null;
  }
}

// Check and show notification if appropriate
function checkAndShowSummarizeNotification() {
  chrome.storage.sync.get(['assistant_notifications'], (result) => {
    if (result.assistant_notifications !== false && hasSubstantialText()) {
      // Delay to let page load completely
      setTimeout(showSummarizeNotification, 2000);
    }
  });
}

// --- Global storage change listener ---
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.assistant_notifications) {
    if (changes.assistant_notifications.newValue === true) {
      checkAndShowSummarizeNotification();
    } else {
      removeSummarizeNotification();
    }
  }
});



// --- Helper Functions (Global) ---
async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['token'], (result) => {
      if (result.token) {
        resolve(result.token);
      } else {
        // Prompt for authentication
        let modal = showModal(`
          <div style="text-align: center; padding: 20px;">
            <h3 style="font-size:18px; font-weight:600; margin-bottom:10px;">Authentication Required</h3>
            <p style="margin-bottom:15px;">Please <b>click the extension icon</b> in your browser toolbar to log in or create an account.</p>
            <div style="margin-top:12px; font-size:13px; color:#555;">
              The login and registration hub will appear as a popup.<br>
              <span style='font-size:32px; margin-top:8px;'>🧩</span>
            </div>
          </div>
        `);
        resolve(null);
      }
    });
  });
}

function showModal(content, opts = {}) {
  let modal = document.getElementById('ai-assistant-modal');
  if (modal) modal.remove();
  modal = document.createElement('div');
  modal.id = 'ai-assistant-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div id="ai-assistant-modal-content">
      <button id="ai-assistant-modal-close" aria-label="Close">×</button>
      <div id="ai-assistant-modal-body">${content}</div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('ai-assistant-modal-close').onclick = () => modal.remove();
  if (opts.onClose) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) { modal.remove(); opts.onClose(); }
    });
  }
  // ESC to close
  modal.tabIndex = -1;
  modal.focus();
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modal.remove();
  });
  return modal;
}

function showSpinnerModal(text) {
  return showModal(`<div style="text-align:center;">${text}<div class="ai-assistant-modal-spinner"><svg class="ai-assistant-svg-spinner" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#7f53ac" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.4 31.4" transform="rotate(-90 25 25)"/></svg></div></div>`);
}

function showSuccessModal(text, value) {
  // Split summary into points (by <br> and bold number)
  let points = [];
  if (value) {
    // Remove empty lines, split by <br>, and group by bold numbers
    const raw = value.split(/<br>/g).map(s => s.trim()).filter(Boolean);
    let current = '';
    for (let line of raw) {
      if (/<b>\d+\.<\/b>/.test(line)) {
        if (current) points.push(current);
        current = line;
      } else {
        current += ' ' + line;
      }
    }
    if (current) points.push(current);
  }
  if (!points.length) points = [value];

  let currentIdx = 0;
  let modal;

  function render() {
    let breadcrumbs = points.map((_, i) =>
      `<span class="ai-breadcrumb${i === currentIdx ? ' active' : ''}" data-idx="${i}" tabindex="0" aria-label="Go to point ${i+1}">${i+1}</span>`
    ).join('');
    let nav = '';
    if (currentIdx > 0) nav += `<button class="ai-nav-btn" id="ai-prev-btn" aria-label="Previous">◀</button>`;
    if (currentIdx < points.length - 1) nav += `<button class="ai-nav-btn" id="ai-next-btn" aria-label="Next">Next ▶</button>`;
    else nav += `<div class="ai-assistant-success-check" style="margin: 24px auto 0 auto;"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M9.5 16.2l-4.2-4.2 1.4-1.4 2.8 2.8 6.8-6.8 1.4 1.4z"/></svg></div><button class='ai-nav-btn' id='ai-done-btn' style='margin-top:18px;'>Done</button>`;
    modal = showModal(`
      <div class="ai-breadcrumbs">${breadcrumbs}</div>
      <div class='ai-assistant-summary-scroll' style='margin-top:18px; max-height:260px; overflow-y:auto; text-align:left; padding:0 4px;'>${points[currentIdx]}</div>
      <div class="ai-summary-nav">${nav}</div>
    `);
    // Breadcrumb click
    modal.querySelectorAll('.ai-breadcrumb').forEach(el => {
      el.onclick = () => { currentIdx = parseInt(el.dataset.idx); render(); };
      el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { currentIdx = parseInt(el.dataset.idx); render(); } };
    });
    // Prev/Next
    const prevBtn = modal.querySelector('#ai-prev-btn');
    if (prevBtn) prevBtn.onclick = () => { currentIdx--; render(); };
    const nextBtn = modal.querySelector('#ai-next-btn');
    if (nextBtn) nextBtn.onclick = () => { currentIdx++; render(); };
    const doneBtn = modal.querySelector('#ai-done-btn');
    if (doneBtn) {
      doneBtn.onclick = () => { modal.remove(); };
      doneBtn.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { modal.remove(); } };
    }
  }

  // Add styles for breadcrumbs and nav
  const style = document.createElement('style');
  style.textContent = `
    .ai-breadcrumbs {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 10px;
      margin-top: 2px;
    }
    .ai-breadcrumb {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      font-weight: 600;
    }
    .ai-breadcrumb.active {
      background: #7f53ac;
      color: white;
    }
    .ai-breadcrumb:hover:not(.active) {
      background: rgba(255,255,255,0.5);
    }
    .ai-summary-nav {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 16px;
    }
    .ai-nav-btn {
      background: linear-gradient(135deg, #7f53ac 0%, #647dee 100%);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .ai-nav-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(127, 83, 172, 0.3);
    }
    .ai-assistant-success-check {
      width: 48px;
      height: 48px;
      background: #10b981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
    }
    .ai-assistant-modal-spinner {
      margin-top: 16px;
    }
    .ai-svg-spinner {
      width: 40px;
      height: 40px;
      animation: ai-spin 1s linear infinite;
    }
    @keyframes ai-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  render();
}

function showErrorModal(msg) {
  return showModal(`<div class="ai-assistant-error" style="margin-top:38px;">${msg}</div>`);
}

function showUpgradeModal(msg) {
  const modal = showModal(`
    <div style='text-align:center; padding:20px;'>
      <div style='font-size:24px; margin-bottom:10px;'>🚀</div>
      <div style='font-size:18px; font-weight:600; margin-bottom:8px; color:#4b3fa7;'>Upgrade to Pro</div>
      <div style='font-size:14px; color:#666; margin-bottom:20px;'>${msg}</div>
      <div style='display:flex; gap:12px; justify-content:center;'>
        <button id='upgrade-now-btn' style='background:linear-gradient(135deg,#7f53ac 0%,#647dee 100%); color:#fff; border:none; border-radius:8px; padding:10px 20px; font-size:14px; font-weight:600; cursor:pointer;'>Upgrade Now</button>
        <button id='upgrade-cancel-btn' style='background:#f3f4f6; color:#666; border:none; border-radius:8px; padding:10px 20px; font-size:14px; cursor:pointer;'>Cancel</button>
      </div>
    </div>
  `);
  
  // Add event listeners for the upgrade buttons
  document.getElementById('upgrade-now-btn').onclick = () => {
    window.open('https://myassistanthub.com/#pricing', '_blank');
    modal.remove();
  };
  
  document.getElementById('upgrade-cancel-btn').onclick = () => {
    modal.remove();
  };
  
  return modal;
}

// --- Summarize Page Action (Global) ---
async function summarizePageAction() {
  const token = await getAuthToken();
  if (!token) return;
  
  const spinner = showSpinnerModal('AI is reading the page...');
  
  try {
    // Use Readability.js for best extraction
    let text = getReadabilityText();
    if (!text) {
      // Fallback to previous logic
      const main = document.querySelector('main, article, section');
      if (main) {
        text = main.innerText;
      } else {
        text = document.body.innerText;
      }
    }
    text = text.replace(/\s+/g, ' ').trim().slice(0, 3000);
    
    const response = await fetch(`${SERVER_URL}/api/ai/summarize`, {
      method: 'POST',
      headers: {
        // 'Authorization': `Bearer ${token}`, // Temporarily disabled for testing
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, url: window.location.href })
    });
    
    const data = await response.json();
    spinner.remove();
    
    if (response.ok && data.success) {
      showSuccessModal('Summary', data.summary);
    } else {
      if (data.upgradeRequired) {
        showUpgradeModal('Free tier limit reached. Please upgrade to continue using the service.');
      } else {
        showErrorModal(data.error || 'Failed to summarize.');
      }
    }
  } catch (error) {
    spinner.remove();
    console.error('Summarize error:', error);
    showErrorModal('Connection error. Please try again.');
  }
}

// --- Initial notification check ---
checkAndShowSummarizeNotification();

(function() {
  if (window.__ai_assistant_robot_injected) return;

  // Check assistant visibility setting
  chrome.storage.sync.get(['assistant_visible'], (result) => {
    if (result.assistant_visible === false) return;
    injectAssistant();
  });

  // Listen for changes to assistant_visible
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.assistant_visible) {
      if (changes.assistant_visible.newValue === false) {
        removeAssistant();
      } else {
        injectAssistant();
      }
    }
  });





  // --- Fill Field Action (refactored) ---
  async function fillFieldAction() {
    const active = document.activeElement;
    let field = null;
    console.log('[AI Assistant] active:', active, 'lastEligibleField:', lastEligibleField);
    if (isEligibleField(active)) {
      field = active;
    } else if (isEligibleField(lastEligibleField)) {
      field = lastEligibleField;
    }
    if (!field) {
      showErrorModal('Please click into a text box or textarea first.');
      return;
    }
    // Extract context: label, placeholder, nearby text
    let label = '';
    if (field.id) {
      const lbl = document.querySelector(`label[for="${field.id}"]`);
      if (lbl) label = lbl.innerText;
    }
    if (!label && field.closest('label')) {
      label = field.closest('label').innerText;
    }
    const placeholder = field.placeholder || '';
    let nearby = '';
    if (field.parentElement) {
      nearby = field.parentElement.innerText;
    }
    const context = `Label: ${label}\nPlaceholder: ${placeholder}\nNearby: ${nearby}\nPage: ${document.title}`;
    // Get user prefs
    const prefs = await new Promise((resolve) => {
      chrome.storage.sync.get(['ai_formality', 'ai_remove_emdash'], (result) => {
        resolve({
          formality: result.ai_formality || 'Professional',
          removeEmDash: result.ai_remove_emdash === undefined ? true : result.ai_remove_emdash
        });
      });
    });
    let defaultInstruction = label || placeholder || '';
    let showFillModal = (instruction = defaultInstruction, formality = prefs.formality, removeEmDash = prefs.removeEmDash) => {
      let modal = showModal(`
        <div style='display:flex; flex-direction:column; align-items:center; gap:18px;'>
          <div style='font-size:38px; margin-bottom:0;'>✍️</div>
          <div style='font-size:20px; font-weight:700; margin-bottom:2px; letter-spacing:0.01em;'>How should I fill this field?</div>
          <div style='font-size:14px; color:#666; margin-bottom:8px;'>Describe what you want the AI to write</div>
          <textarea id='ai-fill-instruction' placeholder='e.g. Write a polite inquiry about pricing' style='margin-bottom:10px; width:100%; min-height:110px; font-size:17px; padding:16px 14px; border-radius:18px; border:1.5px solid #d1d5db; background:rgba(255,255,255,0.55); box-shadow:0 2px 12px rgba(80,60,180,0.07); resize:vertical; outline:none; transition:border 0.2s;'></textarea>
          <div style='width:100%; display:flex; flex-wrap:wrap; gap:16px; align-items:center; justify-content:space-between; margin-bottom:6px;'>
            <div style='display:flex; align-items:center; gap:8px;'>
              <label for='ai-fill-formality' style='font-size:15px; font-weight:500;'>Formality:</label>
              <select id='ai-fill-formality' style='font-size:15px; border-radius:8px; padding:6px 12px; border:1.2px solid #bdbdbd; background:rgba(255,255,255,0.7);'>
                <option${formality==='Professional'?' selected':''}>Professional</option>
                <option${formality==='Casual'?' selected':''}>Casual</option>
                <option${formality==='Friendly'?' selected':''}>Friendly</option>
                <option${formality==='Formal'?' selected':''}>Formal</option>
                <option${formality==='Short'?' selected':''}>Short</option>
                <option${formality==='Long'?' selected':''}>Long</option>
              </select>
            </div>
            <label style='font-size:15px; display:flex; align-items:center; gap:6px;'><input type='checkbox' id='ai-fill-emdash'${removeEmDash?' checked':''} style='accent-color:#7f53ac; margin-right:4px;'/> Remove em dashes (—)</label>
          </div>
          <div style='width:100%; display:flex; gap:14px; justify-content:center; margin-top:8px;'>
            <button id='ai-fill-instruction-submit' style='flex:1; background:linear-gradient(135deg,#7f53ac 0%,#647dee 100%); color:#fff; border:none; border-radius:12px; padding:13px 0; font-size:17px; font-weight:600; box-shadow:0 2px 8px rgba(80,60,180,0.10); transition:background 0.2s;'>Fill</button>
            <button id='ai-fill-instruction-cancel' style='flex:1; background:rgba(230,234,255,0.85); color:#4b3fa7; border:none; border-radius:12px; padding:13px 0; font-size:17px; font-weight:600; box-shadow:0 2px 8px rgba(80,60,180,0.06); transition:background 0.2s;'>Cancel</button>
          </div>
        </div>
      `);
      document.getElementById('ai-fill-instruction').value = instruction.replace(/</g,'&lt;').replace(/>/g,'&gt;');
      document.getElementById('ai-fill-instruction').focus();
      document.getElementById('ai-fill-instruction').select();
      document.getElementById('ai-fill-instruction-submit').onclick = async () => {
        const instruction = document.getElementById('ai-fill-instruction').value.trim();
        const formality = document.getElementById('ai-fill-formality').value;
        const removeEmDash = document.getElementById('ai-fill-emdash').checked;
        chrome.storage.sync.set({ai_formality: formality, ai_remove_emdash: removeEmDash});
        if (!instruction) return;
        modal.remove();
        const token = await getAuthToken();
        if (!token) return;
        
        const spinner = showSpinnerModal('AI is thinking...');
        
        try {
          const response = await fetch(`${SERVER_URL}/api/ai/fill`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              context,
              instruction,
              formality,
              removeEmDash,
              url: window.location.href,
              fieldType: field.type || field.tagName.toLowerCase()
            })
          });
          
          const data = await response.json();
          spinner.remove();
          
          if (response.ok && data.success) {
            let result = data.result;
            if (removeEmDash) result = result.replace(/—/g, '');
            // Remove leading/trailing quotes (straight and curly)
            result = result.replace(/^['"“"'']+|['"“"'']+$/g, '');
            showPreviewModal(result, instruction, formality, removeEmDash);
            // Fill the field with the result
            field.value = result;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            if (data.upgradeRequired) {
              showUpgradeModal('Free tier limit reached. Please upgrade to continue using the service.');
            } else {
              showErrorModal(data.error || 'Failed to fill field.');
            }
          }
        } catch (error) {
          spinner.remove();
          console.error('Fill field error:', error);
          showErrorModal('Connection error. Please try again.');
        }
      };
      document.getElementById('ai-fill-instruction-cancel').onclick = () => {
        modal.remove();
      };
      document.getElementById('ai-fill-instruction').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) document.getElementById('ai-fill-instruction-submit').click();
        if (e.key === 'Escape') modal.remove();
      });
    };
    showFillModal();
  }

  // --- Keyboard Shortcuts ---
  document.addEventListener('keydown', (e) => {
    console.log('[AI Assistant] Keydown event:', e.key, 'ctrl:', e.ctrlKey, 'shift:', e.shiftKey, 'meta:', e.metaKey, 'target:', e.target);
    
    // Ctrl+Shift+F for fill field (all platforms)
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
      console.log('[AI Assistant] Ctrl+Shift+F detected');
        e.preventDefault();
      chrome.storage.sync.get(['assistant_visible'], (result) => {
        if (result.assistant_visible === false) {
          // Assistant hidden: just run fillFieldAction
          fillFieldAction();
        return;
      }
        if (!window.__ai_assistant_robot_injected) {
          injectAssistant();
        }
        setTimeout(() => {
          const fillMenuItem = document.getElementById('ai-assistant-menu-fill');
          if (fillMenuItem) {
            fillMenuItem.click();
          }
        }, 10);
      });
    }
    
    // Ctrl+Shift+S for summarize page (all platforms)
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      console.log('[AI Assistant] Ctrl+Shift+S detected');
        e.preventDefault();
      chrome.storage.sync.get(['assistant_visible'], (result) => {
        if (result.assistant_visible === false) {
          // Assistant hidden: just run summarizePageAction
          summarizePageAction();
        return;
      }
        if (!window.__ai_assistant_robot_injected) {
          injectAssistant();
        }
        setTimeout(() => {
          const summarizeMenuItem = document.getElementById('ai-assistant-menu-summarize');
          if (summarizeMenuItem) {
            summarizeMenuItem.click();
          }
        }, 10);
      });
    }
  });

  document.addEventListener('focusin', (e) => {
    if (isEligibleField(e.target)) {
      lastEligibleField = e.target;
      console.log('[AI Assistant] lastEligibleField set:', lastEligibleField);
    }
  });

  // --- Modal ---
  function showModal(content, opts = {}) {
    let modal = document.getElementById('ai-assistant-modal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'ai-assistant-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div id="ai-assistant-modal-content">
        <button id="ai-assistant-modal-close" aria-label="Close">×</button>
        <div id="ai-assistant-modal-body">${content}</div>
                </div>
            `;
    document.body.appendChild(modal);
    document.getElementById('ai-assistant-modal-close').onclick = () => modal.remove();
    if (opts.onClose) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) { modal.remove(); opts.onClose(); }
      });
    }
    // ESC to close
    modal.tabIndex = -1;
    modal.focus();
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') modal.remove();
    });
    return modal;
  }



  // Listen for postMessage from injected modal to open the extension popup
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'AI_ASSISTANT_OPEN_LOGIN') {
      // Open the extension popup.html in a new tab
      window.open(chrome.runtime.getURL('popup.html'), '_blank');
    }
  });


  function showSuccessModal(text, value) {
    // Split summary into points (by <br> and bold number)
    let points = [];
    if (value) {
      // Remove empty lines, split by <br>, and group by bold numbers
      const raw = value.split(/<br>/g).map(s => s.trim()).filter(Boolean);
      let current = '';
      for (let line of raw) {
        if (/<b>\d+\.<\/b>/.test(line)) {
          if (current) points.push(current);
          current = line;
        } else {
          current += ' ' + line;
        }
      }
      if (current) points.push(current);
    }
    if (!points.length) points = [value];

    let currentIdx = 0;
    let modal;

    function render() {
      let breadcrumbs = points.map((_, i) =>
        `<span class="ai-breadcrumb${i === currentIdx ? ' active' : ''}" data-idx="${i}" tabindex="0" aria-label="Go to point ${i+1}">${i+1}</span>`
      ).join('');
      let nav = '';
      if (currentIdx > 0) nav += `<button class="ai-nav-btn" id="ai-prev-btn" aria-label="Previous">◀</button>`;
      if (currentIdx < points.length - 1) nav += `<button class="ai-nav-btn" id="ai-next-btn" aria-label="Next">Next ▶</button>`;
      else nav += `<div class="ai-assistant-success-check" style="margin: 24px auto 0 auto;"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M9.5 16.2l-4.2-4.2 1.4-1.4 2.8 2.8 6.8-6.8 1.4 1.4z"/></svg></div><button class='ai-nav-btn' id='ai-done-btn' style='margin-top:18px;'>Done</button>`;
      modal = showModal(`
        <div class="ai-breadcrumbs">${breadcrumbs}</div>
        <div class='ai-assistant-summary-scroll' style='margin-top:18px; max-height:260px; overflow-y:auto; text-align:left; padding:0 4px;'>${points[currentIdx]}</div>
        <div class="ai-summary-nav">${nav}</div>
      `);
      // Breadcrumb click
      modal.querySelectorAll('.ai-breadcrumb').forEach(el => {
        el.onclick = () => { currentIdx = parseInt(el.dataset.idx); render(); };
        el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { currentIdx = parseInt(el.dataset.idx); render(); } };
      });
      // Prev/Next
      const prevBtn = modal.querySelector('#ai-prev-btn');
      if (prevBtn) prevBtn.onclick = () => { currentIdx--; render(); };
      const nextBtn = modal.querySelector('#ai-next-btn');
      if (nextBtn) nextBtn.onclick = () => { currentIdx++; render(); };
      const doneBtn = modal.querySelector('#ai-done-btn');
      if (doneBtn) {
        doneBtn.onclick = () => { modal.remove(); };
        doneBtn.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { modal.remove(); } };
      }
    }

    // Add styles for breadcrumbs and nav
    const style = document.createElement('style');
    style.textContent = `
      .ai-breadcrumbs {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 10px;
        margin-top: 2px;
      }
      .ai-breadcrumb {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #e6eaff;
        color: #4b3fa7;
        font-weight: 600;
        font-size: 17px;
        cursor: pointer;
        outline: none;
        border: 2px solid transparent;
        transition: background 0.18s, border 0.18s;
      }
      .ai-breadcrumb.active {
        background: linear-gradient(135deg, #7f53ac 0%, #647dee 100%);
        color: #fff;
        border: 2px solid #4b3fa7;
      }
      .ai-breadcrumb:focus {
        border: 2px solid #7f53ac;
      }
      .ai-summary-nav {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 18px;
        margin-top: 18px;
      }
      .ai-nav-btn {
        background: linear-gradient(135deg, #7f53ac 0%, #647dee 100%);
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 8px 18px;
        font-size: 16px;
        cursor: pointer;
        font-weight: 600;
        transition: background 0.2s;
      }
      .ai-nav-btn:hover {
        background: linear-gradient(135deg, #647dee 0%, #7f53ac 100%);
      }
    `;
    document.head.appendChild(style);

    render();
  }
  function showErrorModal(msg) {
    return showModal(`<div class="ai-assistant-error" style="margin-top:38px;">${msg}</div>`);
  }

  function showUpgradeModal(msg) {
    const modal = showModal(`
      <div style='text-align:center; padding:20px;'>
        <div style='font-size:24px; margin-bottom:10px;'>🚀</div>
        <div style='font-size:18px; font-weight:600; margin-bottom:8px; color:#4b3fa7;'>Upgrade to Pro</div>
        <div style='font-size:14px; color:#666; margin-bottom:20px;'>${msg}</div>
        <div style='display:flex; gap:12px; justify-content:center;'>
          <button id='upgrade-now-btn' style='background:linear-gradient(135deg,#7f53ac 0%,#647dee 100%); color:#fff; border:none; border-radius:8px; padding:10px 20px; font-size:14px; font-weight:600; cursor:pointer;'>Upgrade Now</button>
          <button id='upgrade-cancel-btn' style='background:#f3f4f6; color:#666; border:none; border-radius:8px; padding:10px 20px; font-size:14px; cursor:pointer;'>Cancel</button>
        </div>
      </div>
    `);
    
    // Add event listeners for the upgrade buttons
    document.getElementById('upgrade-now-btn').onclick = () => {
      window.open('https://myassistanthub.com/#pricing', '_blank');
      modal.remove();
    };
    
    document.getElementById('upgrade-cancel-btn').onclick = () => {
      modal.remove();
    };
    
    return modal;
  }
  
  // Preview modal for fill field results
  function showPreviewModal(result, instruction, formality, removeEmDash) {
    // Remove leading/trailing quotes (straight and curly)
    result = result.replace(/^['"“”‘’]+|['"“”‘’]+$/g, '');
    let modal = showModal(`
      <div style='font-size:17px; font-weight:500; margin-bottom:10px;'>Preview</div>
      <div class='ai-assistant-summary-scroll' style='margin-top:0; max-height:180px; overflow-y:auto; text-align:left; padding:0 4px; font-size:18px;'>${result.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
      <div style='margin-top:18px; display:flex; justify-content:center; gap:12px;'>
        <button id='ai-preview-regenerate' class='ai-nav-btn'>Regenerate</button>
        <button id='ai-preview-done' class='ai-nav-btn' style='background:#eee; color:#333;'>Done</button>
      </div>
    `);
    document.getElementById('ai-preview-regenerate').onclick = () => {
      modal.remove();
      fillFieldAction();
    };
    document.getElementById('ai-preview-done').onclick = () => {
      modal.remove();
    };
  }

  // --- Menu Logic (global scope) ---
  function openMenu() {
    const menu = document.getElementById('ai-assistant-robot-menu');
    if (menu) {
      menu.classList.add('open');
      setTimeout(() => {
        const first = menu.querySelector('.ai-assistant-robot-menu-item');
        if (first) first.focus();
      }, 0);
    }
  }
  function closeMenu() {
    const menu = document.getElementById('ai-assistant-robot-menu');
    if (menu) menu.classList.remove('open');
  }

  // --- Global Styles (always applied) ---
  const globalStyle = document.createElement('style');
  globalStyle.textContent = `
    #ai-assistant-modal {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 2147483647;
      background: rgba(40,40,60,0.18);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: ai-assistant-fadein 0.25s;
    }

    #ai-summarize-notification {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      z-index: 2147483646;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border-radius: 12px;
      padding: 12px 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #333;
    }

    #ai-summarize-notification.show {
      transform: translateX(-50%) translateY(0);
    }

    .ai-summarize-notification-content {
      display: flex;
      align-items: center;
      gap: 12px;
      white-space: nowrap;
    }

    .ai-summarize-btn {
      background: linear-gradient(135deg, #7f53ac 0%, #647dee 100%);
      color: white;
      border: none;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .ai-summarize-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(127, 83, 172, 0.3);
    }

    .ai-summarize-close {
      background: none;
      border: none;
      color: #999;
      font-size: 16px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
    }

    .ai-summarize-close:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #666;
    }
    @keyframes ai-assistant-fadein {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    #ai-assistant-modal-content {
      background: rgba(255,255,255,0.85);
      color: #222;
      border-radius: 18px;
      padding: 36px 36px 28px 36px;
      max-width: 520px;
      min-width: 320px;
      box-shadow: 0 8px 48px rgba(80,60,180,0.18);
      font-size: 17px;
      line-height: 1.7;
      position: relative;
      backdrop-filter: blur(12px);
      animation: ai-assistant-modal-in 0.3s cubic-bezier(.4,1.6,.6,1);
    }
    @keyframes ai-assistant-modal-in {
      from { transform: scale(0.95) translateY(40px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }
    #ai-assistant-modal-close {
      position: absolute;
      top: 14px;
      right: 18px;
      font-size: 22px;
      color: #888;
      cursor: pointer;
      background: none;
      border: none;
      transition: color 0.2s;
    }
    #ai-assistant-modal-close:hover {
      color: #4b3fa7;
    }
    #ai-assistant-modal input[type="text"] {
      width: 100%;
      padding: 10px;
      font-size: 16px;
      border-radius: 8px;
      border: 1.5px solid #bdbdbd;
      margin-top: 14px;
      margin-bottom: 8px;
      background: #f7f7fa;
    }
    #ai-assistant-modal button {
      margin-top: 18px;
      background: linear-gradient(135deg, #7f53ac 0%, #647dee 100%);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px 22px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s;
    }
    #ai-assistant-modal button:hover {
      background: linear-gradient(135deg, #647dee 0%, #7f53ac 100%);
    }
    #ai-assistant-modal .ai-assistant-modal-spinner {
      margin: 32px auto 0 auto;
      display: flex;
      justify-content: center;
    }
    .ai-assistant-svg-spinner {
      width: 38px;
      height: 38px;
      animation: ai-assistant-spin 1s linear infinite;
      display: block;
    }
    @keyframes ai-assistant-spin {
      100% { transform: rotate(360deg); }
    }
    .ai-assistant-success-check {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 32px auto 0 auto;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7f53ac 0%, #647dee 100%);
      box-shadow: 0 2px 8px rgba(80,60,180,0.10);
      animation: ai-assistant-pop 0.4s;
    }
    @keyframes ai-assistant-pop {
      0% { transform: scale(0.7); opacity: 0; }
      80% { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    .ai-assistant-success-check svg {
      width: 28px;
      height: 28px;
      color: #fff;
      display: block;
    }
    .ai-assistant-error {
      color: #c00;
      font-weight: 500;
      margin-top: 18px;
      text-align: center;
    }
    .ai-assistant-summary-scroll {
      max-height: 260px;
      overflow-y: auto;
      text-align: left;
      padding: 0 4px;
      margin-top: 18px;
      font-size: 19px;
      line-height: 1.85;
      word-break: break-word;
    }
    @media (max-width: 600px) {
      #ai-assistant-modal-content {
        min-width: 90vw;
        max-width: 98vw;
        padding: 18px 6vw 18px 6vw;
      }
    }
  `;
  document.head.appendChild(globalStyle);

  function injectAssistant() {
    if (window.__ai_assistant_robot_injected) return;
    window.__ai_assistant_robot_injected = true;

    // --- Styles ---
    const style = document.createElement('style');
    style.textContent = `
      #ai-assistant-robot-btn {
        position: fixed;
        bottom: 32px;
        right: 32px;
        z-index: 2147483647;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #7f53ac 0%, #647dee 100%);
        border-radius: 50%;
        box-shadow: 0 6px 24px rgba(80,60,180,0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: box-shadow 0.2s, transform 0.2s;
        animation: ai-assistant-pulse 2s infinite;
      }
      #ai-assistant-robot-btn:hover {
        box-shadow: 0 12px 36px rgba(80,60,180,0.28);
        transform: scale(1.07);
      }
      @keyframes ai-assistant-pulse {
        0% { box-shadow: 0 0 0 0 rgba(127,83,172,0.18); }
        70% { box-shadow: 0 0 0 12px rgba(127,83,172,0.08); }
        100% { box-shadow: 0 0 0 0 rgba(127,83,172,0.18); }
      }
      #ai-assistant-robot-btn[aria-label]::after {
        content: attr(aria-label);
        position: absolute;
        bottom: 70px;
        right: 0;
        background: #222;
        color: #fff;
        font-size: 13px;
        padding: 5px 12px;
        border-radius: 6px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
        white-space: nowrap;
      }
      #ai-assistant-robot-btn:focus::after,
      #ai-assistant-robot-btn:hover::after {
        opacity: 1;
      }
      #ai-assistant-robot-menu {
        position: fixed;
        bottom: 104px;
        right: 32px;
        z-index: 2147483647;
        background: rgba(255,255,255,0.98);
        color: #222;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(80,60,180,0.18);
        padding: 10px 0;
        min-width: 240px;
        display: none;
        flex-direction: column;
        font-family: inherit;
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.25s, transform 0.25s;
      }
      #ai-assistant-robot-menu.open {
        display: flex;
        opacity: 1;
        transform: translateY(0);
      }
      .ai-assistant-robot-menu-item {
        padding: 14px 28px 14px 48px;
        cursor: pointer;
        font-size: 16px;
        border: none;
        background: none;
        text-align: left;
        transition: background 0.15s, color 0.15s;
        position: relative;
        outline: none;
      }
      .ai-assistant-robot-menu-item:focus {
        background: #e6eaff;
        color: #4b3fa7;
      }
      .ai-assistant-robot-menu-item:hover {
        background: #f0f4ff;
        color: #4b3fa7;
      }
      .ai-assistant-robot-menu-item .ai-menu-icon {
        position: absolute;
        left: 18px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 20px;
        opacity: 0.8;
      }
    `;
    document.head.appendChild(style);

    // --- Robot Button ---
    const robotBtn = document.createElement('div');
    robotBtn.id = 'ai-assistant-robot-btn';
    robotBtn.setAttribute('aria-label', 'Open AI Assistant');
    robotBtn.setAttribute('tabindex', '0');
    robotBtn.title = 'AI Assistant';
    robotBtn.innerHTML = '<svg width="32" height="32" viewBox="0 0 64 64" style="width: 32px; height: 32px;"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#6366f1;stop-opacity:1"/><stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="url(#bg)" stroke="#4f46e5" stroke-width="3"/><circle cx="32" cy="32" r="8" fill="white"/><circle cx="32" cy="16" r="4" fill="white"/><circle cx="32" cy="48" r="4" fill="white"/><circle cx="16" cy="32" r="4" fill="white"/><circle cx="48" cy="32" r="4" fill="white"/><path d="M32 24 L32 16 M32 40 L32 48 M24 32 L16 32 M40 32 L48 32" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>';
    document.body.appendChild(robotBtn);

    // --- Menu ---
    const menu = document.createElement('div');
    menu.id = 'ai-assistant-robot-menu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = `
      <div class="ai-assistant-robot-menu-item" id="ai-assistant-menu-summarize" tabindex="0" role="menuitem"><span class="ai-menu-icon">📝</span>Summarize this page</div>
      <div class="ai-assistant-robot-menu-item" id="ai-assistant-menu-fill" tabindex="0" role="menuitem"><span class="ai-menu-icon">✍️</span>Fill selected field</div>
    `;
    document.body.appendChild(menu);

    // --- Robot Button Click Handler ---
    robotBtn.onclick = (e) => {
      e.stopPropagation();
      if (menu.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    };
    robotBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
    });
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && e.target !== robotBtn) {
        closeMenu();
      }
    });

    // --- Summarize Page ---
    document.getElementById('ai-assistant-menu-summarize').onclick = () => {
      closeMenu();
      summarizePageAction();
    };

    // --- Fill Selected Field ---
    document.getElementById('ai-assistant-menu-fill').onclick = () => {
      closeMenu();
      fillFieldAction();
    };

    // --- Message handling from popup ---
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'assistantVisibilityChanged') {
        if (message.visible) {
          injectAssistant();
        } else {
          removeAssistant();
        }
      } else if (message.action === 'notificationsChanged') {
        if (message.enabled) {
          checkAndShowSummarizeNotification();
        } else {
          removeSummarizeNotification();
        }
      }
    });
  }

  // --- Config Menu (API Key Only) ---
  window.showAIConfig = function() {
    chrome.storage.sync.get(['openai_api_key'], (result) => {
      let connected = !!result.openai_api_key;
      let modal = showModal(`
        <div style='font-size:17px; font-weight:500; margin-bottom:10px;'>ChatGPT: <span style='color:${connected ? '#4caf50' : '#c00'}; font-weight:600;'>${connected ? 'Connected' : 'Not Connected'}</span></div>
        <input type='text' id='ai-api-key-input' placeholder='sk-...' value='${connected ? result.openai_api_key : ''}' style='margin-bottom:10px; width:100%;'/>
        <button id='ai-api-key-save'>${connected ? 'Change' : 'Connect'}</button>
      `);
      document.getElementById('ai-api-key-save').onclick = () => {
        const key = document.getElementById('ai-api-key-input').value.trim();
        if (key.startsWith('sk-')) {
          chrome.storage.sync.set({ openai_api_key: key }, () => {
            modal.remove();
          });
} else {
          alert('Please enter a valid OpenAI API key.');
        }
      };
    });
  };

  function removeAssistant() {
    if (!window.__ai_assistant_robot_injected) return;
    window.__ai_assistant_robot_injected = false;
    
    const robotBtn = document.getElementById('ai-assistant-robot-btn');
    const menu = document.getElementById('ai-assistant-robot-menu');
    const modal = document.getElementById('ai-assistant-modal');
    
    if (robotBtn) robotBtn.remove();
    if (menu) menu.remove();
    if (modal) modal.remove();
  }
})();
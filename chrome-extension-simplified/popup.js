// Server configuration
const SERVER_URL = 'https://ai-assistant-hub-app.azurewebsites.net';

// DOM elements
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');
const usageInfo = document.getElementById('usage-info');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const authToggle = document.getElementById('auth-toggle');
const messageContainer = document.getElementById('message-container');
const assistantToggle = document.getElementById('assistant-toggle');
const notificationsToggle = document.getElementById('notifications-toggle');

let isLoginMode = true;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    await checkConnection();
    await loadUserStatus();
    await loadAssistantVisibility();
    setupEventListeners();
});

// Check server connection
async function checkConnection() {
    try {
        const response = await fetch(`${SERVER_URL}/health`);
        if (response.ok) {
            updateStatus(true, 'Connected to server');
        } else {
            updateStatus(false, 'Server error');
        }
    } catch (error) {
        updateStatus(false, 'Cannot connect to server');
    }
}

// Update connection status
function updateStatus(connected, message) {
    statusDot.className = `status-dot ${connected ? '' : 'disconnected'}`;
    statusText.textContent = message;
}

// Load user authentication status
async function loadUserStatus() {
    try {
        const { token } = await chrome.storage.sync.get(['token']);
        
        if (token) {
            const response = await fetch(`${SERVER_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                showUserInfo(data.user);
                updateStatus(true, 'Connected to server'); // Only show connected if authenticated
            } else {
                // Token is invalid, remove it
                await chrome.storage.sync.remove(['token']);
                showAuthForm();
                updateStatus(false, 'Please log in');
            }
        } else {
            showAuthForm();
            updateStatus(false, 'Please log in');
        }
    } catch (error) {
        console.error('Error loading user status:', error);
        showAuthForm();
        updateStatus(false, 'Cannot connect to server');
    }
}

// Show user information
function showUserInfo(user) {
    userInfo.classList.add('show');
    authForm.classList.remove('show');
    
    userEmail.textContent = user.email;
    
    const remaining = user.plan === 'pro' ? 'unlimited' : Math.max(0, 10 - user.usage.totalRequests);
    usageInfo.textContent = `${user.usage.totalRequests}/10 requests used (${remaining} remaining)`;
    
    // Show upgrade link if free plan and usage limit reached
    const upgradeLink = document.getElementById('upgrade-link');
    if (user.plan === 'free' && user.usage.totalRequests >= 10) {
        upgradeLink.style.display = 'block';
    } else {
        upgradeLink.style.display = 'none';
    }
    
    // Show verify message if not verified
    if (!user.isEmailVerified) {
        showMessage('Please verify your email to use the service. Check your inbox.', 'error');
        // Optionally, show a resend button here
    }
}

// Show authentication form
function showAuthForm() {
    userInfo.classList.remove('show');
    authForm.classList.add('show');
    updateAuthForm();
}

// Update authentication form based on mode
function updateAuthForm() {
    if (isLoginMode) {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        authToggle.textContent = "Don't have an account? Register";
    } else {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'block';
        authToggle.textContent = 'Already have an account? Login';
    }
}

// Load assistant visibility setting
async function loadAssistantVisibility() {
    const { assistant_visible = true, assistant_notifications = true } = await chrome.storage.sync.get(['assistant_visible', 'assistant_notifications']);
    assistantToggle.classList.toggle('active', assistant_visible);
    notificationsToggle.classList.toggle('active', assistant_notifications);
}

// Setup event listeners
function setupEventListeners() {
    loginBtn.addEventListener('click', handleLogin);
    registerBtn.addEventListener('click', handleRegister);
    authToggle.addEventListener('click', toggleAuthMode);
    assistantToggle.addEventListener('click', toggleAssistantVisibility);
    notificationsToggle.addEventListener('click', toggleNotifications);
    
    // Enter key support
    emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (isLoginMode) handleLogin();
            else handleRegister();
        }
    });
    
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (isLoginMode) handleLogin();
            else handleRegister();
        }
      });
    }

// Handle login
async function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    try {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';

        console.log('[Popup] Attempting login for:', email);

        const response = await fetch(`${SERVER_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('[Popup] Login response:', response.status, data);

        if (response.ok) {
            console.log('[Popup] Login successful, storing token...');
            await chrome.storage.sync.set({ token: data.token });
            
            // Verify token was stored
            const stored = await chrome.storage.sync.get(['token']);
            console.log('[Popup] Token stored successfully:', !!stored.token);
            
            showMessage('Login successful!', 'success');
            await loadUserStatus();
            // If not verified, show verify message
            if (data.user && data.user.isEmailVerified === false) {
                showMessage('Please verify your email to use the service. Check your inbox.', 'error');
            }
        } else {
            console.log('[Popup] Login failed:', data.error);
            showMessage(data.error || 'Login failed', 'error');
      }
    } catch (error) {
        console.error('[Popup] Login error:', error);
        showMessage('Connection error. Please try again.', 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
}

// Handle registration
async function handleRegister() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const username = email.split('@')[0]; // Use email prefix as username

    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        registerBtn.disabled = true;
        registerBtn.textContent = 'Creating account...';

        const response = await fetch(`${SERVER_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, username })
        });

        const data = await response.json();

        if (response.ok) {
            await chrome.storage.sync.set({ token: data.token });
            showMessage('Account created successfully! Please verify your email to use the service.', 'success');
            await loadUserStatus();
        } else {
            showMessage(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Connection error. Please try again.', 'error');
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Create Account';
    }
}

// Toggle between login and register modes
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    updateAuthForm();
    clearMessage();
}

// Toggle assistant visibility
async function toggleAssistantVisibility() {
    const isActive = assistantToggle.classList.contains('active');
    const newState = !isActive;
    
    assistantToggle.classList.toggle('active', newState);
    await chrome.storage.sync.set({ assistant_visible: newState });
    
    // Notify content script about the change
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
        chrome.tabs.sendMessage(tab.id, { 
            action: 'assistantVisibilityChanged', 
            visible: newState 
        });
    }
}

// Toggle notifications
async function toggleNotifications() {
    const isActive = notificationsToggle.classList.contains('active');
    const newState = !isActive;
    
    notificationsToggle.classList.toggle('active', newState);
    await chrome.storage.sync.set({ assistant_notifications: newState });
    
    // Notify content script about the change
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
        chrome.tabs.sendMessage(tab.id, { 
            action: 'notificationsChanged', 
            enabled: newState 
        });
    }
}

// Show message
function showMessage(message, type) {
    clearMessage();
    
    const messageEl = document.createElement('div');
    messageEl.className = `${type}-message`;
    messageEl.textContent = message;
    messageContainer.appendChild(messageEl);
    
    // Auto-remove after 5 seconds
        setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
          }
        }, 5000);
      }

// Clear message
function clearMessage() {
    messageContainer.innerHTML = '';
}

// Logout function (can be called from content script)
async function logout() {
    await chrome.storage.sync.remove(['token']);
    showAuthForm();
    showMessage('Logged out successfully', 'success');
}

// Expose logout function globally
window.logout = logout;

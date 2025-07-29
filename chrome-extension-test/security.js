// Security and Authentication Module for AI Assistant Hub
class SecurityManager {
    constructor() {
        this.encryptionKey = null;
        this.sessionToken = null;
        this.rateLimits = new Map();
        
        this.init();
    }
    
    async init() {
        await this.generateEncryptionKey();
        this.setupSecurityHeaders();
        this.initializeRateLimiting();
    }
    
    // Generate or retrieve encryption key for local storage
    async generateEncryptionKey() {
        try {
            // Try to get existing key
            const stored = await chrome.storage.local.get(['encryptionKey']);
            
            if (stored.encryptionKey) {
                this.encryptionKey = await crypto.subtle.importKey(
                    'jwk',
                    stored.encryptionKey,
                    { name: 'AES-GCM' },
                    false,
                    ['encrypt', 'decrypt']
                );
            } else {
                // Generate new key
                this.encryptionKey = await crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    true,
                    ['encrypt', 'decrypt']
                );
                
                // Store for future use
                const exportedKey = await crypto.subtle.exportKey('jwk', this.encryptionKey);
                await chrome.storage.local.set({ encryptionKey: exportedKey });
            }
        } catch (error) {
            console.error('Failed to generate encryption key:', error);
            throw new Error('Security initialization failed');
        }
    }
    
    // Encrypt sensitive data before storage
    async encryptData(data) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                dataBuffer
            );
            
            return {
                encrypted: Array.from(new Uint8Array(encrypted)),
                iv: Array.from(iv),
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Failed to encrypt data');
        }
    }
    
    // Decrypt sensitive data from storage
    async decryptData(encryptedData) {
        try {
            const { encrypted, iv, timestamp } = encryptedData;
            
            // Check if data is too old (24 hours)
            if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
                throw new Error('Encrypted data expired');
            }
            
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: new Uint8Array(iv) },
                this.encryptionKey,
                new Uint8Array(encrypted)
            );
            
            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decrypted));
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt data');
        }
    }
    
    // Validate API keys with proper format checking
    validateApiKey(provider, apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return { valid: false, error: 'API key is required' };
        }
        
        const patterns = {
            openai: {
                pattern: /^sk-[a-zA-Z0-9]{32,}$/,
                error: 'OpenAI API key must start with "sk-" and be at least 35 characters'
            },
            claude: {
                pattern: /^sk-ant-[a-zA-Z0-9_-]{95,}$/,
                error: 'Claude API key must start with "sk-ant-" and be properly formatted'
            },
            gemini: {
                pattern: /^[a-zA-Z0-9_-]{39}$/,
                error: 'Gemini API key must be exactly 39 characters'
            },
            grok: {
                pattern: /^xai-[a-zA-Z0-9]{32,}$/,
                error: 'Grok API key must start with "xai-"'
            },
            perplexity: {
                pattern: /^pplx-[a-zA-Z0-9]{32,}$/,
                error: 'Perplexity API key must start with "pplx-"'
            },
            cohere: {
                pattern: /^[a-zA-Z0-9]{40}$/,
                error: 'Cohere API key must be exactly 40 characters'
            }
        };
        
        const validation = patterns[provider];
        if (!validation) {
            return { valid: false, error: 'Unknown provider' };
        }
        
        if (!validation.pattern.test(apiKey)) {
            return { valid: false, error: validation.error };
        }
        
        return { valid: true };
    }
    
    // Rate limiting for API calls
    checkRateLimit(identifier, limit = 60, window = 60000) {
        const now = Date.now();
        const key = `${identifier}`;
        
        if (!this.rateLimits.has(key)) {
            this.rateLimits.set(key, {
                count: 0,
                resetTime: now + window
            });
        }
        
        const limitData = this.rateLimits.get(key);
        
        // Reset if window expired
        if (now >= limitData.resetTime) {
            limitData.count = 0;
            limitData.resetTime = now + window;
        }
        
        // Check limit
        if (limitData.count >= limit) {
            const remainingTime = Math.ceil((limitData.resetTime - now) / 1000);
            return {
                allowed: false,
                error: `Rate limit exceeded. Try again in ${remainingTime} seconds.`,
                remainingTime
            };
        }
        
        limitData.count++;
        return { allowed: true, remaining: limit - limitData.count };
    }
    
    // Input sanitization
    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return String(input);
        }
        
        // Remove potential XSS vectors
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    }
    
    // Content Security Policy headers
    setupSecurityHeaders() {
        const csp = [
            "default-src 'self'",
            "connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://api.x.ai https://api.perplexity.ai https://api.cohere.ai https://accounts.google.com",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'"
        ].join('; ');
        
        // Note: CSP would be set in manifest.json for actual extension
        console.log('CSP Policy:', csp);
    }
    
    // OAuth token validation and refresh
    async validateOAuthToken(provider, token) {
        try {
            let validationUrl;
            let headers = {};
            
            switch (provider) {
                case 'google':
                    validationUrl = `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`;
                    break;
                default:
                    throw new Error('Unsupported OAuth provider');
            }
            
            const response = await fetch(validationUrl, { headers });
            
            if (!response.ok) {
                throw new Error('Token validation failed');
            }
            
            const data = await response.json();
            
            // Check token expiry
            if (data.expires_in && data.expires_in < 300) { // Less than 5 minutes
                return { valid: false, needsRefresh: true };
            }
            
            return { valid: true, data };
        } catch (error) {
            console.error('OAuth validation error:', error);
            return { valid: false, error: error.message };
        }
    }
    
    // Secure storage wrapper
    async secureStore(key, data) {
        try {
            const encrypted = await this.encryptData(data);
            await chrome.storage.local.set({ [key]: encrypted });
            return true;
        } catch (error) {
            console.error('Secure storage failed:', error);
            return false;
        }
    }
    
    async secureRetrieve(key) {
        try {
            const stored = await chrome.storage.local.get([key]);
            if (!stored[key]) {
                return null;
            }
            
            return await this.decryptData(stored[key]);
        } catch (error) {
            console.error('Secure retrieval failed:', error);
            return null;
        }
    }
    
    // Privacy protection for form data
    sanitizeFormData(formData) {
        const sensitivePatterns = [
            /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
            /\b\d{3}-\d{2}-\d{4}\b/, // SSN
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email (partial)
            /\b\d{10,}\b/ // Phone numbers
        ];
        
        const sanitized = { ...formData };
        
        // Check each field
        Object.keys(sanitized).forEach(key => {
            const value = sanitized[key];
            if (typeof value === 'string') {
                // Check for sensitive patterns
                const isSensitive = sensitivePatterns.some(pattern => pattern.test(value));
                
                if (isSensitive) {
                    sanitized[key] = '[SENSITIVE_DATA_REDACTED]';
                }
            }
        });
        
        return sanitized;
    }
    
    // Generate secure session token
    generateSessionToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Validate origin for cross-frame communication
    validateOrigin(origin, allowedOrigins = []) {
        const defaultAllowed = [
            'https://api.openai.com',
            'https://api.anthropic.com',
            'https://generativelanguage.googleapis.com',
            'https://api.x.ai',
            'https://api.perplexity.ai',
            'https://api.cohere.ai',
            'https://accounts.google.com'
        ];
        
        const allowed = [...defaultAllowed, ...allowedOrigins];
        return allowed.some(allowedOrigin => origin.startsWith(allowedOrigin));
    }
    
    // Initialize rate limiting cleanup
    initializeRateLimiting() {
        // Clean up expired rate limit entries every 5 minutes
        setInterval(() => {
            const now = Date.now();
            for (const [key, data] of this.rateLimits.entries()) {
                if (now >= data.resetTime) {
                    this.rateLimits.delete(key);
                }
            }
        }, 5 * 60 * 1000);
    }
    
    // Security audit logging
    logSecurityEvent(event, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            details: this.sanitizeFormData(details),
            userAgent: navigator.userAgent,
            url: window.location?.href || 'unknown'
        };
        
        console.log('Security Event:', logEntry);
        
        // In production, this could be sent to a security monitoring service
        // chrome.runtime.sendMessage({ action: 'securityLog', data: logEntry });
    }
}

// Authentication Manager
class AuthenticationManager {
    constructor(securityManager) {
        this.security = securityManager;
        this.providers = {
            google: {
                clientId: 'YOUR_GOOGLE_CLIENT_ID',
                scopes: ['openid', 'email', 'profile'],
                redirectUri: chrome.identity.getRedirectURL()
            }
        };
    }
    
    // Google OAuth flow
    async authenticateGoogle() {
        try {
            this.security.logSecurityEvent('oauth_attempt', { provider: 'google' });
            
            const authUrl = this.buildGoogleAuthUrl();
            
            const redirectUrl = await chrome.identity.launchWebAuthFlow({
                url: authUrl,
                interactive: true
            });
            
            if (!redirectUrl) {
                throw new Error('Authentication cancelled');
            }
            
            const token = this.extractTokenFromUrl(redirectUrl);
            
            // Validate token
            const validation = await this.security.validateOAuthToken('google', token);
            if (!validation.valid) {
                throw new Error('Token validation failed');
            }
            
            // Store securely
            await this.security.secureStore('google_token', {
                token,
                expiresAt: Date.now() + (validation.data.expires_in * 1000),
                userInfo: validation.data
            });
            
            this.security.logSecurityEvent('oauth_success', { provider: 'google' });
            
            return {
                success: true,
                token,
                userInfo: validation.data
            };
            
        } catch (error) {
            this.security.logSecurityEvent('oauth_error', { 
                provider: 'google', 
                error: error.message 
            });
            
            throw error;
        }
    }
    
    buildGoogleAuthUrl() {
        const params = new URLSearchParams({
            client_id: this.providers.google.clientId,
            response_type: 'token',
            scope: this.providers.google.scopes.join(' '),
            redirect_uri: this.providers.google.redirectUri,
            state: this.security.generateSessionToken()
        });
        
        return `https://accounts.google.com/oauth/authorize?${params.toString()}`;
    }
    
    extractTokenFromUrl(url) {
        const urlObj = new URL(url);
        const fragment = urlObj.hash.substring(1);
        const params = new URLSearchParams(fragment);
        
        const accessToken = params.get('access_token');
        if (!accessToken) {
            throw new Error('No access token found in response');
        }
        
        return accessToken;
    }
    
    // Check authentication status
    async isAuthenticated(provider) {
        try {
            const stored = await this.security.secureRetrieve(`${provider}_token`);
            
            if (!stored) {
                return false;
            }
            
            // Check expiry
            if (Date.now() >= stored.expiresAt) {
                await this.logout(provider);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        }
    }
    
    // Logout and cleanup
    async logout(provider) {
        try {
            // Remove stored token
            await chrome.storage.local.remove([`${provider}_token`]);
            
            // Revoke token if possible
            if (provider === 'google') {
                const stored = await this.security.secureRetrieve('google_token');
                if (stored?.token) {
                    await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${stored.token}`);
                }
            }
            
            this.security.logSecurityEvent('logout', { provider });
            
            return true;
        } catch (error) {
            console.error('Logout failed:', error);
            return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SecurityManager, AuthenticationManager };
}
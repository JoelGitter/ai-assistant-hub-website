const encryption = require('../utils/encryption');

// GDPR and data protection middleware
const dataProtection = {
  // Sanitize sensitive data in responses
  sanitizeResponse: (req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
      if (data && typeof data === 'object') {
        data = encryption.sanitizeForLog(data, [
          'password', 'token', 'key', 'secret', 'stripeCustomerId', 
          'stripeSubscriptionId', 'emailVerificationToken', 'passwordResetToken'
        ]);
      }
      return originalJson.call(this, data);
    };
    next();
  },

  // Add privacy headers
  privacyHeaders: (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  },

  // Log data access for audit trail
  auditDataAccess: (req, res, next) => {
    const auditData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };

    // Log to secure audit trail (in production, use proper logging service)
    console.log('AUDIT:', encryption.sanitizeForLog(auditData));
    
    next();
  },

  // Rate limiting for sensitive endpoints
  sensitiveEndpointRateLimit: (windowMs = 5 * 60 * 1000, max = 10) => {
    const requests = new Map();

    return (req, res, next) => {
      const key = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowStart = now - windowMs;

      if (requests.has(key)) {
        const userRequests = requests.get(key).filter(time => time > windowStart);
        requests.set(key, userRequests);
      } else {
        requests.set(key, []);
      }

      const userRequests = requests.get(key);
      
      if (userRequests.length >= max) {
        return res.status(429).json({ 
          error: 'Too many sensitive requests',
          message: 'Please try again later'
        });
      }

      userRequests.push(now);
      next();
    };
  },

  // Data retention check
  checkDataRetention: (req, res, next) => {
    // Check if user data should be deleted based on retention policy
    // This is a placeholder for GDPR compliance
    next();
  },

  // Consent verification
  verifyConsent: (req, res, next) => {
    // Check if user has given necessary consent for data processing
    // This is a placeholder for GDPR compliance
    next();
  },

  // Data minimization
  minimizeData: (req, res, next) => {
    // Only collect necessary data
    const allowedFields = ['email', 'name', 'password'];
    if (req.body) {
      const minimized = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          minimized[field] = req.body[field];
        }
      });
      req.body = minimized;
    }
    next();
  },

  // Encryption at rest verification
  verifyEncryption: (req, res, next) => {
    // Verify that sensitive data is properly encrypted
    // This is handled by the User model encryption
    next();
  }
};

module.exports = dataProtection; 
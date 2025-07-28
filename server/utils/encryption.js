const crypto = require('crypto');

class DataEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-encryption-key-32-chars';
    this.ivLength = 16;
    this.tagLength = 16;
  }

  // Encrypt sensitive data
  encrypt(text, context = 'default') {
    if (!text) return text;
    
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.secretKey);
      cipher.setAAD(Buffer.from(context, 'utf8'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      return text; // Fallback to plain text if encryption fails
    }
  }

  // Decrypt sensitive data
  decrypt(encryptedText, context = 'default') {
    if (!encryptedText) return encryptedText;
    
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) return encryptedText; // Not encrypted, return as-is
      
      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
      decipher.setAAD(Buffer.from(context, 'utf8'));
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedText; // Return encrypted text if decryption fails
    }
  }

  // Hash sensitive data (one-way)
  hash(text, salt = null) {
    if (!text) return text;
    
    try {
      const saltToUse = salt || crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(text, saltToUse, 10000, 64, 'sha512').toString('hex');
      return saltToUse + ':' + hash;
    } catch (error) {
      console.error('Hashing error:', error);
      return text;
    }
  }

  // Verify hashed data
  verifyHash(text, hashedText) {
    if (!text || !hashedText) return false;
    
    try {
      const parts = hashedText.split(':');
      if (parts.length !== 2) return false;
      
      const salt = parts[0];
      const hash = parts[1];
      
      const verifyHash = crypto.pbkdf2Sync(text, salt, 10000, 64, 'sha512').toString('hex');
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
    } catch (error) {
      console.error('Hash verification error:', error);
      return false;
    }
  }

  // Generate secure random string
  generateSecureString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate API key
  generateApiKey(prefix = 'ai_') {
    const randomPart = crypto.randomBytes(16).toString('hex');
    return prefix + randomPart;
  }

  // Encrypt object
  encryptObject(obj, context = 'object') {
    if (!obj || typeof obj !== 'object') return obj;
    
    const encrypted = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.length > 0) {
        encrypted[key] = this.encrypt(value, context);
      } else {
        encrypted[key] = value;
      }
    }
    return encrypted;
  }

  // Decrypt object
  decryptObject(obj, context = 'object') {
    if (!obj || typeof obj !== 'object') return obj;
    
    const decrypted = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.length > 0) {
        decrypted[key] = this.decrypt(value, context);
      } else {
        decrypted[key] = value;
      }
    }
    return decrypted;
  }

  // Sanitize sensitive data for logging
  sanitizeForLog(data, fields = ['password', 'token', 'key', 'secret']) {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    for (const field of fields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }

  // Check if data is encrypted
  isEncrypted(text) {
    if (!text || typeof text !== 'string') return false;
    const parts = text.split(':');
    return parts.length === 3 && parts[0].length === 32 && parts[1].length === 32;
  }
}

module.exports = new DataEncryption(); 
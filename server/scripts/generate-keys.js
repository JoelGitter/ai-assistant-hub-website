#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 Generating secure keys for AI Assistant Hub...\n');

// Generate encryption key
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('🔑 ENCRYPTION_KEY:');
console.log(encryptionKey);
console.log('');

// Generate JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('🎫 JWT_SECRET:');
console.log(jwtSecret);
console.log('');

// Generate session secret
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('📝 SESSION_SECRET:');
console.log(sessionSecret);
console.log('');

// Generate API keys
console.log('🔑 API Keys:');
for (let i = 1; i <= 3; i++) {
  const apiKey = crypto.randomBytes(16).toString('hex');
  console.log(`API_KEY_${i}: ai_${apiKey}`);
}
console.log('');

// Generate secure password
const securePassword = crypto.randomBytes(16).toString('hex');
console.log('🔒 Secure Password:');
console.log(securePassword);
console.log('');

console.log('📋 Environment Variables to Set:');
console.log('================================');
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log('');

console.log('⚠️  Security Notes:');
console.log('==================');
console.log('• Store these keys securely');
console.log('• Never commit them to version control');
console.log('• Use different keys for development and production');
console.log('• Rotate keys regularly in production');
console.log('• Use Azure Key Vault for production keys');
console.log('');

console.log('✅ Key generation complete!'); 
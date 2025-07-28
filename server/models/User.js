const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Encryption utility
class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-encryption-key-32-chars';
    this.ivLength = 16;
    this.tagLength = 16;
  }

  encrypt(text) {
    if (!text) return text;
    
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.secretKey);
      cipher.setAAD(Buffer.from('user-data', 'utf8'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      return text; // Fallback to plain text if encryption fails
    }
  }

  decrypt(encryptedText) {
    if (!encryptedText) return encryptedText;
    
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) return encryptedText; // Not encrypted, return as-is
      
      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
      decipher.setAAD(Buffer.from('user-data', 'utf8'));
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedText; // Return encrypted text if decryption fails
    }
  }
}

const encryptionService = new EncryptionService();

const subscriptionSchema = new mongoose.Schema({
  plan: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'past_due'],
    default: 'inactive'
  },
  stripeCustomerId: {
    type: String,
    sparse: true,
    set: function(val) {
      return val ? encryptionService.encrypt(val) : val;
    },
    get: function(val) {
      return val ? encryptionService.decrypt(val) : val;
    }
  },
  stripeSubscriptionId: {
    type: String,
    sparse: true,
    set: function(val) {
      return val ? encryptionService.encrypt(val) : val;
    },
    get: function(val) {
      return val ? encryptionService.decrypt(val) : val;
    }
  },
  currentPeriodStart: {
    type: Date
  },
  currentPeriodEnd: {
    type: Date
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  usage: {
    requestsThisMonth: {
      type: Number,
      default: 0
    },
    requestsLimit: {
      type: Number,
      default: 10 // Free tier limit
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    set: function(val) {
      return val ? encryptionService.encrypt(val) : val;
    },
    get: function(val) {
      return val ? encryptionService.decrypt(val) : val;
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true,
    set: function(val) {
      return val ? encryptionService.encrypt(val) : val;
    },
    get: function(val) {
      return val ? encryptionService.decrypt(val) : val;
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    set: function(val) {
      return val ? encryptionService.encrypt(val) : val;
    },
    get: function(val) {
      return val ? encryptionService.decrypt(val) : val;
    }
  },
  emailVerificationExpires: {
    type: Date
  },
  passwordResetToken: {
    type: String,
    set: function(val) {
      return val ? encryptionService.encrypt(val) : val;
    },
    get: function(val) {
      return val ? encryptionService.decrypt(val) : val;
    }
  },
  passwordResetExpires: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  subscription: {
    type: subscriptionSchema,
    default: () => ({})
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      browser: {
        type: Boolean,
        default: true
      }
    }
  },
  apiKeys: [{
    name: String,
    key: {
      type: String,
      set: function(val) {
        return val ? encryptionService.encrypt(val) : val;
      },
      get: function(val) {
        return val ? encryptionService.decrypt(val) : val;
      }
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastUsed: Date
  }]
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ 'subscription.stripeCustomerId': 1 });
userSchema.index({ 'subscription.stripeSubscriptionId': 1 });
userSchema.index({ 'subscription.status': 1 });

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for checking subscription status
userSchema.virtual('hasActiveSubscription').get(function() {
  return this.subscription.status === 'active' && 
         this.subscription.currentPeriodEnd > new Date();
});

// Virtual for checking usage limits
userSchema.virtual('hasReachedLimit').get(function() {
  return this.subscription.usage.requestsThisMonth >= this.subscription.usage.requestsLimit;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: Date.now() }
  });
};

// Method to check if user can make requests
userSchema.methods.canMakeRequest = function() {
  // Free users check usage limits
  if (this.subscription.plan === 'free') {
    return !this.hasReachedLimit;
  }
  
  // Pro users always can make requests if subscription is active
  return this.hasActiveSubscription;
};

// Method to increment usage
userSchema.methods.incrementUsage = function() {
  const now = new Date();
  const lastReset = new Date(this.subscription.usage.lastResetDate);
  
  // Reset usage if it's a new month
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.subscription.usage.requestsThisMonth = 1;
    this.subscription.usage.lastResetDate = now;
  } else {
    this.subscription.usage.requestsThisMonth += 1;
  }
  
  return this.save();
};

// Method to update subscription
userSchema.methods.updateSubscription = function(subscriptionData) {
  Object.assign(this.subscription, subscriptionData);
  return this.save();
};

// Method to get user for API responses (excludes sensitive data)
userSchema.methods.toSafeObject = function() {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.apiKeys;
  return user;
};

module.exports = mongoose.model('User', userSchema); 
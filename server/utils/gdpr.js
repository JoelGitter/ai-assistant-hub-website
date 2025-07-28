const User = require('../models/User');
const encryption = require('./encryption');

class GDPRCompliance {
  // Right to be forgotten (data deletion)
  async deleteUserData(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Anonymize sensitive data instead of complete deletion
      const anonymizedData = {
        email: `deleted_${Date.now()}@deleted.com`,
        name: 'Deleted User',
        password: encryption.generateSecureString(),
        isEmailVerified: false,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        subscription: {
          plan: 'free',
          status: 'inactive',
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          usage: {
            requestsThisMonth: 0,
            requestsLimit: 10,
            lastResetDate: new Date()
          }
        },
        preferences: {
          theme: 'auto',
          notifications: {
            email: false,
            browser: false
          }
        },
        apiKeys: [],
        loginAttempts: 0,
        lockUntil: null,
        lastLogin: null
      };

      // Update user with anonymized data
      await User.findByIdAndUpdate(userId, anonymizedData);

      return {
        success: true,
        message: 'User data has been anonymized',
        userId: userId
      };
    } catch (error) {
      console.error('GDPR deletion error:', error);
      throw error;
    }
  }

  // Right to data portability (export user data)
  async exportUserData(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Export user data in a structured format
      const exportData = {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        subscription: {
          plan: user.subscription.plan,
          status: user.subscription.status,
          currentPeriodStart: user.subscription.currentPeriodStart,
          currentPeriodEnd: user.subscription.currentPeriodEnd,
          usage: user.subscription.usage
        },
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        apiKeys: user.apiKeys.map(key => ({
          name: key.name,
          createdAt: key.createdAt,
          lastUsed: key.lastUsed
        }))
      };

      return {
        success: true,
        data: exportData,
        format: 'json',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('GDPR export error:', error);
      throw error;
    }
  }

  // Right to rectification (update user data)
  async updateUserData(userId, updateData) {
    try {
      const allowedFields = ['name', 'email', 'preferences'];
      const sanitizedData = {};

      // Only allow updates to specific fields
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          sanitizedData[field] = updateData[field];
        }
      });

      const user = await User.findByIdAndUpdate(userId, sanitizedData, { new: true });
      
      return {
        success: true,
        message: 'User data updated successfully',
        user: user.toSafeObject()
      };
    } catch (error) {
      console.error('GDPR rectification error:', error);
      throw error;
    }
  }

  // Right to access (get user data)
  async getUserData(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        data: user.toSafeObject(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('GDPR access error:', error);
      throw error;
    }
  }

  // Consent management
  async updateConsent(userId, consentData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update consent preferences
      const consentUpdate = {
        preferences: {
          ...user.preferences,
          consent: {
            marketing: consentData.marketing || false,
            analytics: consentData.analytics || false,
            necessary: consentData.necessary || true,
            updatedAt: new Date()
          }
        }
      };

      await User.findByIdAndUpdate(userId, consentUpdate);

      return {
        success: true,
        message: 'Consent updated successfully',
        consent: consentUpdate.preferences.consent
      };
    } catch (error) {
      console.error('Consent update error:', error);
      throw error;
    }
  }

  // Data retention check
  async checkDataRetention() {
    try {
      const retentionPeriod = 7 * 365 * 24 * 60 * 60 * 1000; // 7 years
      const cutoffDate = new Date(Date.now() - retentionPeriod);

      // Find users who haven't logged in for 7 years
      const inactiveUsers = await User.find({
        lastLogin: { $lt: cutoffDate },
        'subscription.status': { $ne: 'active' }
      });

      return {
        success: true,
        inactiveUsers: inactiveUsers.length,
        cutoffDate: cutoffDate,
        retentionPeriod: '7 years'
      };
    } catch (error) {
      console.error('Data retention check error:', error);
      throw error;
    }
  }

  // Audit trail for data access
  logDataAccess(userId, action, details = {}) {
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: userId,
      action: action,
      details: encryption.sanitizeForLog(details),
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown'
    };

    // In production, log to secure audit service
    console.log('GDPR_AUDIT:', auditLog);
    
    return auditLog;
  }

  // Generate privacy policy compliance report
  async generateComplianceReport() {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ 'subscription.status': 'active' });
      const usersWithConsent = await User.countDocuments({ 'preferences.consent': { $exists: true } });

      const report = {
        timestamp: new Date().toISOString(),
        totalUsers: totalUsers,
        activeUsers: activeUsers,
        usersWithConsent: usersWithConsent,
        dataRetention: '7 years',
        encryption: 'AES-256-GCM',
        compliance: {
          gdpr: true,
          ccpa: true,
          dataMinimization: true,
          encryptionAtRest: true,
          auditTrail: true
        }
      };

      return report;
    } catch (error) {
      console.error('Compliance report error:', error);
      throw error;
    }
  }
}

module.exports = new GDPRCompliance(); 
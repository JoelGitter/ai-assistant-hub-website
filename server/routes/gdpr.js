const express = require('express');
const { body, validationResult } = require('express-validator');
const gdpr = require('../utils/gdpr');
const auth = require('../middleware/auth');
const { sensitiveEndpointRateLimit } = require('../middleware/dataProtection');
const router = express.Router();

// Get user's personal data (Right to Access)
router.get('/data', [
  auth,
  sensitiveEndpointRateLimit(5 * 60 * 1000, 5) // 5 requests per 5 minutes
], async (req, res) => {
  try {
    const result = await gdpr.getUserData(req.user.id);
    
    // Log the data access
    gdpr.logDataAccess(req.user.id, 'data_access', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json(result);
  } catch (error) {
    console.error('GDPR data access error:', error);
    res.status(500).json({ error: 'Failed to retrieve user data' });
  }
});

// Export user data (Right to Data Portability)
router.get('/export', [
  auth,
  sensitiveEndpointRateLimit(5 * 60 * 1000, 3) // 3 exports per 5 minutes
], async (req, res) => {
  try {
    const result = await gdpr.exportUserData(req.user.id);
    
    // Log the data export
    gdpr.logDataAccess(req.user.id, 'data_export', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${req.user.id}.json"`);
    res.json(result);
  } catch (error) {
    console.error('GDPR data export error:', error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
});

// Update user data (Right to Rectification)
router.put('/data', [
  auth,
  body('name').optional().isLength({ min: 2 }).trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('preferences').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const result = await gdpr.updateUserData(req.user.id, req.body);
    
    // Log the data update
    gdpr.logDataAccess(req.user.id, 'data_update', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      updatedFields: Object.keys(req.body)
    });

    res.json(result);
  } catch (error) {
    console.error('GDPR data update error:', error);
    res.status(500).json({ error: 'Failed to update user data' });
  }
});

// Delete user data (Right to be Forgotten)
router.delete('/data', [
  auth,
  sensitiveEndpointRateLimit(5 * 60 * 1000, 1) // 1 deletion per 5 minutes
], async (req, res) => {
  try {
    const result = await gdpr.deleteUserData(req.user.id);
    
    // Log the data deletion
    gdpr.logDataAccess(req.user.id, 'data_deletion', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json(result);
  } catch (error) {
    console.error('GDPR data deletion error:', error);
    res.status(500).json({ error: 'Failed to delete user data' });
  }
});

// Update consent preferences
router.put('/consent', [
  auth,
  body('marketing').optional().isBoolean(),
  body('analytics').optional().isBoolean(),
  body('necessary').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const result = await gdpr.updateConsent(req.user.id, req.body);
    
    // Log the consent update
    gdpr.logDataAccess(req.user.id, 'consent_update', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      consentData: req.body
    });

    res.json(result);
  } catch (error) {
    console.error('GDPR consent update error:', error);
    res.status(500).json({ error: 'Failed to update consent' });
  }
});

// Get consent status
router.get('/consent', auth, async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const consent = user.preferences?.consent || {
      marketing: false,
      analytics: false,
      necessary: true,
      updatedAt: null
    };

    res.json({
      success: true,
      consent: consent
    });
  } catch (error) {
    console.error('GDPR consent retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve consent status' });
  }
});

// Generate compliance report (Admin only)
router.get('/compliance-report', [
  auth,
  sensitiveEndpointRateLimit(60 * 60 * 1000, 1) // 1 report per hour
], async (req, res) => {
  try {
    // Check if user is admin (you can add admin field to User model)
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const report = await gdpr.generateComplianceReport();
    
    // Log the report generation
    gdpr.logDataAccess(req.user.id, 'compliance_report', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json(report);
  } catch (error) {
    console.error('GDPR compliance report error:', error);
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
});

// Check data retention
router.get('/retention', [
  auth,
  sensitiveEndpointRateLimit(60 * 60 * 1000, 1) // 1 check per hour
], async (req, res) => {
  try {
    const result = await gdpr.checkDataRetention();
    
    // Log the retention check
    gdpr.logDataAccess(req.user.id, 'retention_check', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json(result);
  } catch (error) {
    console.error('GDPR retention check error:', error);
    res.status(500).json({ error: 'Failed to check data retention' });
  }
});

// Privacy policy information
router.get('/privacy-info', (req, res) => {
  res.json({
    success: true,
    privacyInfo: {
      dataController: 'AI Assistant Hub',
      dataRetention: '7 years',
      dataProcessing: [
        'Account management',
        'Subscription processing',
        'AI service usage',
        'Analytics (with consent)'
      ],
      userRights: [
        'Right to access',
        'Right to rectification',
        'Right to erasure',
        'Right to data portability',
        'Right to restrict processing',
        'Right to object'
      ],
      contactEmail: 'privacy@myassistanthub.com',
      lastUpdated: new Date().toISOString()
    }
  });
});

module.exports = router; 
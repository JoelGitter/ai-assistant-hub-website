const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').isLength({ min: 2 }).trim()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await user.save();

    // Send verification email
    try {
      if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const verificationUrl = `${process.env.FRONTEND_URL || 'https://myassistanthub.com'}/verify-email?token=${verificationToken}`;
        
        const msg = {
          to: email,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || 'noreply@aiassistanthub.com',
            name: 'AI Assistant Hub'
          },
          subject: 'Verify your email address - AI Assistant Hub',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-bottom: 20px; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                  🎉 Welcome to AI Assistant Hub!
                </h2>
                
                <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
                  Hi ${name},
                </p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
                  Thank you for registering with AI Assistant Hub! To complete your registration and unlock all features, please verify your email address.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                    Verify Email Address
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                  If the button doesn't work, you can copy and paste this link into your browser:
                </p>
                
                <p style="font-size: 14px; color: #007bff; word-break: break-all; margin-bottom: 20px;">
                  ${verificationUrl}
                </p>
                
                <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                  This verification link will expire in 24 hours.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                  <p>If you didn't create an account with AI Assistant Hub, you can safely ignore this email.</p>
                </div>
              </div>
            </div>
          `,
          text: `
Welcome to AI Assistant Hub!

Hi ${name},

Thank you for registering with AI Assistant Hub! To complete your registration and unlock all features, please verify your email address.

Verify your email: ${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with AI Assistant Hub, you can safely ignore this email.
          `
        };

        await sgMail.send(msg);
        console.log(`[Auth] Verification email sent to ${email}`);
      } else {
        console.log(`[Auth] SendGrid not configured - verification email would be sent to ${email}`);
      }
    } catch (emailError) {
      console.error('[Auth] Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      token,
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({ 
        error: 'Account locked',
        message: 'Too many failed login attempts. Try again later.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', [
  auth,
  body('name').optional().isLength({ min: 2 }).trim(),
  body('preferences').optional().isObject()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update allowed fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.preferences) user.preferences = { ...user.preferences, ...req.body.preferences };

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', [
  auth,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Request password reset
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(resetTokenExpiry);
    await user.save();

    // TODO: Send email with reset link
    // For now, just return the token (in production, send via email)
    res.json({ 
      message: 'Password reset link sent',
      resetToken: resetToken // Remove this in production
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ error: 'Failed to request password reset' });
  }
});

// Reset password with token
router.post('/reset-password', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { token, newPassword } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Logout (client-side token removal)
router.post('/logout', auth, async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // You could implement a blacklist here if needed
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Verify token
router.get('/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({
      valid: true,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get current user (alias for /verify)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get usage stats
    const usageStats = {
      currentUsage: user.subscription.usage.requestsThisMonth,
      limit: user.subscription.usage.requestsLimit,
      remaining: user.subscription.usage.requestsLimit - user.subscription.usage.requestsThisMonth,
      plan: user.subscription.plan,
      status: user.subscription.status,
      hasReachedLimit: user.hasReachedLimit,
      canMakeRequest: user.canMakeRequest()
    };

    res.json({
      valid: true,
      user: {
        ...user.toSafeObject(),
        usage: usageStats
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Verify email with token
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Find user with this verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired verification token',
        message: 'The verification link is invalid or has expired. Please request a new verification email.'
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      message: 'Email verified successfully! You can now use all features of AI Assistant Hub.',
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Resend verification email
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // Send verification email
    try {
      if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const verificationUrl = `${process.env.FRONTEND_URL || 'https://myassistanthub.com'}/verify-email?token=${verificationToken}`;
        
        const msg = {
          to: email,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || 'noreply@aiassistanthub.com',
            name: 'AI Assistant Hub'
          },
          subject: 'Verify your email address - AI Assistant Hub',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-bottom: 20px; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                  📧 Email Verification
                </h2>
                
                <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
                  Hi ${user.name},
                </p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
                  You requested a new verification email for your AI Assistant Hub account. Please verify your email address to unlock all features.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                    Verify Email Address
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                  If the button doesn't work, you can copy and paste this link into your browser:
                </p>
                
                <p style="font-size: 14px; color: #007bff; word-break: break-all; margin-bottom: 20px;">
                  ${verificationUrl}
                </p>
                
                <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                  This verification link will expire in 24 hours.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                  <p>If you didn't request this verification email, you can safely ignore it.</p>
                </div>
              </div>
            </div>
          `,
          text: `
Email Verification

Hi ${user.name},

You requested a new verification email for your AI Assistant Hub account. Please verify your email address to unlock all features.

Verify your email: ${verificationUrl}

This verification link will expire in 24 hours.

If you didn't request this verification email, you can safely ignore it.
          `
        };

        await sgMail.send(msg);
        console.log(`[Auth] Verification email resent to ${email}`);
      } else {
        console.log(`[Auth] SendGrid not configured - verification email would be sent to ${email}`);
      }
    } catch (emailError) {
      console.error('[Auth] Failed to send verification email:', emailError);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.json({
      message: 'Verification email sent successfully. Please check your inbox.'
    });

  } catch (error) {
    console.error('Error resending verification email:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// Health check
router.get('/health', async (req, res) => {
  res.json({
    status: 'healthy',
    service: 'auth',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 
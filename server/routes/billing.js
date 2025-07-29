const express = require('express');
const { body, validationResult } = require('express-validator');
const stripeService = require('../services/stripe');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Create checkout session
router.post('/create-checkout-session', [
  body('priceId').isString().notEmpty(),
  body('successUrl').isURL(),
  body('cancelUrl').isURL()
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

    const { priceId, successUrl, cancelUrl, customerEmail } = req.body;

    // Create checkout session
    const session = await stripeService.createCheckoutSession(
      priceId, 
      successUrl, 
      cancelUrl, 
      customerEmail
    );

    res.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
});

// Handle Stripe webhooks
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return res.status(400).json({ error: 'Missing Stripe signature' });
    }

    // Verify webhook signature
    const event = stripeService.verifyWebhookSignature(req.body, signature);
    
    // Handle the webhook event
    await stripeService.handleWebhook(event);
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
});

// Get user's subscription status
router.get('/subscription', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      subscription: user.subscription,
      hasActiveSubscription: user.hasActiveSubscription,
      canMakeRequest: user.canMakeRequest(),
      usage: user.subscription.usage
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// Create customer portal session
router.post('/create-portal-session', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.subscription.stripeCustomerId) {
      return res.status(400).json({ error: 'No billing account found' });
    }

    const session = await stripeService.createPortalSession(
      user.subscription.stripeCustomerId,
      req.body.returnUrl || 'https://myassistanthub.com'
    );

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Cancel subscription
router.post('/cancel-subscription', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.subscription.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    await stripeService.cancelSubscription(user.subscription.stripeSubscriptionId);
    
    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Reactivate subscription
router.post('/reactivate-subscription', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.subscription.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No subscription found' });
    }

    await stripeService.reactivateSubscription(user.subscription.stripeSubscriptionId);
    
    res.json({ message: 'Subscription reactivated successfully' });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
});

// Get billing history
router.get('/billing-history', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.subscription.stripeCustomerId) {
      return res.json({ invoices: [] });
    }

    // Get invoices from Stripe
    const invoices = await stripeService.stripe.invoices.list({
      customer: user.subscription.stripeCustomerId,
      limit: 12
    });

    res.json({
      invoices: invoices.data.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        date: new Date(invoice.created * 1000),
        description: invoice.description
      }))
    });
  } catch (error) {
    console.error('Error getting billing history:', error);
    res.status(500).json({ error: 'Failed to get billing history' });
  }
});

// Update payment method
router.post('/update-payment-method', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.subscription.stripeCustomerId) {
      return res.status(400).json({ error: 'No billing account found' });
    }

    // Create a setup intent for updating payment method
    const setupIntent = await stripeService.stripe.setupIntents.create({
      customer: user.subscription.stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session'
    });

    res.json({
      clientSecret: setupIntent.client_secret
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ error: 'Failed to update payment method' });
  }
});

// Get subscription usage
router.get('/usage', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      usage: user.subscription.usage,
      hasReachedLimit: user.hasReachedLimit,
      canMakeRequest: user.canMakeRequest()
    });
  } catch (error) {
    console.error('Error getting usage:', error);
    res.status(500).json({ error: 'Failed to get usage' });
  }
});

module.exports = router; 
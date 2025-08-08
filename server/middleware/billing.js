const User = require('../models/User');

// Middleware to check if user can make AI requests
const checkSubscriptionAccess = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user can make requests
    if (!user.canMakeRequest()) {
      return res.status(403).json({
        error: 'Subscription limit reached',
        message: user.subscription.plan === 'free' 
          ? 'You have reached your free tier limit. Upgrade to Pro for unlimited requests.'
          : 'Your subscription has expired. Please renew to continue using the service.',
        subscription: {
          plan: user.subscription.plan,
          status: user.subscription.status,
          usage: user.subscription.usage,
          currentPeriodEnd: user.subscription.currentPeriodEnd
        }
      });
    }

    // Add user to request for later use
    req.user = user;
    next();
  } catch (error) {
    console.error('Error checking subscription access:', error);
    res.status(500).json({ error: 'Failed to check subscription access' });
  }
};

// Middleware to increment usage after successful request
const incrementUsage = async (req, res, next) => {
  try {
    console.log('[Billing] Incrementing usage for request');
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('[Billing] User not found for usage increment');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[Billing] User found:', user.email);
    console.log('[Billing] Current usage before increment:', user.subscription.usage.requestsThisMonth);
    
    // Increment usage
    const updatedUser = await user.incrementUsage();
    
    // Update the user object in the request with the updated user
    req.user = updatedUser;
    
    console.log('[Billing] Usage increment completed');
    console.log('[Billing] New usage count:', updatedUser.subscription.usage.requestsThisMonth);
    
    // If next is a function, call it (normal middleware flow)
    if (typeof next === 'function') {
      next();
    }
    // If next is not a function, we're being called manually
    // The calling code should handle the response
  } catch (error) {
    console.error('[Billing] Error incrementing usage:', error);
    // Fail the request if usage tracking fails
    return res.status(500).json({ 
      error: 'Usage tracking failed', 
      details: error.message,
      stack: error.stack 
    });
  }
};

// Middleware to check if user has active subscription (for premium features)
const requireActiveSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.hasActiveSubscription) {
      return res.status(403).json({
        error: 'Active subscription required',
        message: 'This feature requires an active Pro subscription.',
        subscription: {
          plan: user.subscription.plan,
          status: user.subscription.status,
          currentPeriodEnd: user.subscription.currentPeriodEnd
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error checking active subscription:', error);
    res.status(500).json({ error: 'Failed to check subscription status' });
  }
};

// Middleware to check if user is on free plan (for upgrade prompts)
const checkFreePlan = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.subscription.plan === 'free') {
      return res.status(403).json({
        error: 'Pro subscription required',
        message: 'This feature is only available for Pro subscribers.',
        upgrade: {
          required: true,
          currentPlan: 'free',
          suggestedPlan: 'pro'
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error checking plan:', error);
    res.status(500).json({ error: 'Failed to check plan status' });
  }
};

// Middleware to get usage statistics
const getUsageStats = async (req, res, next) => {
  try {
    // Use the user from the request (which should be updated by incrementUsage)
    const user = req.user || await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[Billing] Getting usage stats for user:', user.email);
    console.log('[Billing] Current usage:', user.subscription.usage.requestsThisMonth);
    console.log('[Billing] Usage limit:', user.subscription.usage.requestsLimit);

    // Add usage stats to response
    res.locals.usageStats = {
      currentUsage: user.subscription.usage.requestsThisMonth,
      limit: user.subscription.usage.requestsLimit,
      remaining: user.subscription.usage.requestsLimit - user.subscription.usage.requestsThisMonth,
      plan: user.subscription.plan,
      status: user.subscription.status,
      hasReachedLimit: user.hasReachedLimit,
      canMakeRequest: user.canMakeRequest()
    };

    console.log('[Billing] Usage stats calculated:', res.locals.usageStats);
    next();
  } catch (error) {
    console.error('Error getting usage stats:', error);
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
};

module.exports = {
  checkSubscriptionAccess,
  incrementUsage,
  requireActiveSubscription,
  checkFreePlan,
  getUsageStats
}; 
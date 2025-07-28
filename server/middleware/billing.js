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
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Increment usage
    await user.incrementUsage();
    
    next();
  } catch (error) {
    console.error('Error incrementing usage:', error);
    // Don't fail the request if usage tracking fails
    next();
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
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

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
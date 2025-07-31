// Initialize Stripe (optional for testing)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}
const User = require('../models/User');

class StripeService {
  constructor() {
    this.stripe = stripe;
    if (!this.stripe) {
      console.log('⚠️  Stripe not initialized - billing features will be disabled');
    }
  }

  // Check if Stripe is initialized
  isInitialized() {
    return !!this.stripe;
  }

  // Create a Stripe customer
  async createCustomer(user) {
    if (!this.isInitialized()) {
      throw new Error('Stripe not initialized');
    }
    
    try {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString()
        }
      });

      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  // Create a checkout session
  async createCheckoutSession(priceId, successUrl, cancelUrl, customerEmail = null) {
    if (!this.isInitialized()) {
      throw new Error('Stripe not initialized');
    }
    
    try {
      const sessionData = {
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        // Enable automatic tax calculation
        automatic_tax: {
          enabled: true,
        },
        // Collect tax IDs for business customers
        tax_id_collection: {
          enabled: true,
        },
        subscription_data: {
          metadata: {
            source: 'ai-assistant-hub'
          }
        }
      };

      // If customer email is provided, add it to the session
      if (customerEmail) {
        sessionData.customer_email = customerEmail;
      }

      const session = await this.stripe.checkout.sessions.create(sessionData);
      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Create a customer portal session
  async createPortalSession(customerId, returnUrl) {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return session;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  // Handle webhook events
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;
        
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  // Handle successful checkout completion
  async handleCheckoutSessionCompleted(session) {
    try {
      console.log('Processing checkout session completed:', session.id);
      
      // Find user by email
      const user = await User.findOne({ email: session.customer_details.email });
      if (!user) {
        console.error('User not found for checkout session:', session.customer_details.email);
        return;
      }

      // Update user with Stripe customer ID
      await user.updateSubscription({
        stripeCustomerId: session.customer,
        plan: 'pro',
        status: 'active'
      });

      console.log('User subscription updated after checkout:', user.email);
    } catch (error) {
      console.error('Error handling checkout session completed:', error);
      throw error;
    }
  }

  // Handle subscription creation
  async handleSubscriptionCreated(subscription) {
    try {
      console.log('Processing subscription created:', subscription.id);
      
      const user = await User.findOne({ 'subscription.stripeCustomerId': subscription.customer });
      if (!user) {
        console.error('User not found for subscription:', subscription.customer);
        return;
      }

      await user.updateSubscription({
        stripeSubscriptionId: subscription.id,
        plan: 'pro',
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        usage: {
          ...user.subscription.usage,
          requestsLimit: 1000 // Pro tier limit
        }
      });

      console.log('Subscription created for user:', user.email);
    } catch (error) {
      console.error('Error handling subscription created:', error);
      throw error;
    }
  }

  // Handle subscription updates
  async handleSubscriptionUpdated(subscription) {
    try {
      console.log('Processing subscription updated:', subscription.id);
      
      const user = await User.findOne({ 'subscription.stripeSubscriptionId': subscription.id });
      if (!user) {
        console.error('User not found for subscription update:', subscription.id);
        return;
      }

      await user.updateSubscription({
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      });

      console.log('Subscription updated for user:', user.email);
    } catch (error) {
      console.error('Error handling subscription updated:', error);
      throw error;
    }
  }

  // Handle subscription deletion
  async handleSubscriptionDeleted(subscription) {
    try {
      console.log('Processing subscription deleted:', subscription.id);
      
      const user = await User.findOne({ 'subscription.stripeSubscriptionId': subscription.id });
      if (!user) {
        console.error('User not found for subscription deletion:', subscription.id);
        return;
      }

      await user.updateSubscription({
        status: 'cancelled',
        plan: 'free',
        usage: {
          ...user.subscription.usage,
          requestsLimit: 10 // Back to free tier limit
        }
      });

      console.log('Subscription cancelled for user:', user.email);
    } catch (error) {
      console.error('Error handling subscription deleted:', error);
      throw error;
    }
  }

  // Handle successful payment
  async handlePaymentSucceeded(invoice) {
    try {
      console.log('Processing payment succeeded:', invoice.id);
      
      if (invoice.subscription) {
        const user = await User.findOne({ 'subscription.stripeSubscriptionId': invoice.subscription });
        if (user) {
          await user.updateSubscription({
            status: 'active',
            currentPeriodStart: new Date(invoice.period_start * 1000),
            currentPeriodEnd: new Date(invoice.period_end * 1000)
          });
          console.log('Payment processed for user:', user.email);
        }
      }
    } catch (error) {
      console.error('Error handling payment succeeded:', error);
      throw error;
    }
  }

  // Handle failed payment
  async handlePaymentFailed(invoice) {
    try {
      console.log('Processing payment failed:', invoice.id);
      
      if (invoice.subscription) {
        const user = await User.findOne({ 'subscription.stripeSubscriptionId': invoice.subscription });
        if (user) {
          await user.updateSubscription({
            status: 'past_due'
          });
          console.log('Payment failed for user:', user.email);
        }
      }
    } catch (error) {
      console.error('Error handling payment failed:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
      return subscription;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Reactivate subscription
  async reactivateSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });
      return subscription;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw error;
    }
  }

  // Get customer details
  async getCustomer(customerId) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer;
    } catch (error) {
      console.error('Error retrieving customer:', error);
      throw error;
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw error;
    }
  }
}

module.exports = new StripeService(); 
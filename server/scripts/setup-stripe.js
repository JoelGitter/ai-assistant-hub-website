#!/usr/bin/env node

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupStripe() {
  try {
    console.log('🚀 Setting up Stripe products and prices...');

    // Create the main product
    const product = await stripe.products.create({
      name: 'AI Assistant Hub Pro',
      description: 'Unlimited AI-powered form filling and page summarization',
      metadata: {
        source: 'ai-assistant-hub'
      }
    });

    console.log('✅ Product created:', product.id);

    // Create monthly price
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 999, // $9.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan: 'pro-monthly',
        source: 'ai-assistant-hub'
      }
    });

    console.log('✅ Monthly price created:', monthlyPrice.id);

    // Create yearly price (with discount)
    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 9990, // $99.90 in cents
      currency: 'usd',
      recurring: {
        interval: 'year'
      },
      metadata: {
        plan: 'pro-yearly',
        source: 'ai-assistant-hub'
      }
    });

    console.log('✅ Yearly price created:', yearlyPrice.id);

    // Create webhook endpoint
    const webhookEndpoint = await stripe.webhookEndpoints.create({
      url: 'https://ai-assistant-hub-app.azurewebsites.net/api/billing/webhook',
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed'
      ],
      metadata: {
        source: 'ai-assistant-hub'
      }
    });

    console.log('✅ Webhook endpoint created:', webhookEndpoint.id);
    console.log('🔑 Webhook secret:', webhookEndpoint.secret);

    // Output configuration
    console.log('\n📋 Configuration Summary:');
    console.log('========================');
    console.log(`Product ID: ${product.id}`);
    console.log(`Monthly Price ID: ${monthlyPrice.id}`);
    console.log(`Yearly Price ID: ${yearlyPrice.id}`);
    console.log(`Webhook Endpoint ID: ${webhookEndpoint.id}`);
    console.log(`Webhook Secret: ${webhookEndpoint.secret}`);

    console.log('\n🔧 Environment Variables to Set:');
    console.log('================================');
    console.log(`STRIPE_SECRET_KEY=${process.env.STRIPE_SECRET_KEY}`);
    console.log(`STRIPE_WEBHOOK_SECRET=${webhookEndpoint.secret}`);

    console.log('\n📝 Frontend Configuration:');
    console.log('==========================');
    console.log(`Publishable Key: ${process.env.STRIPE_PUBLISHABLE_KEY}`);
    console.log(`Monthly Price ID: ${monthlyPrice.id}`);
    console.log(`Yearly Price ID: ${yearlyPrice.id}`);

    console.log('\n✅ Stripe setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up Stripe:', error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupStripe();
}

module.exports = setupStripe; 
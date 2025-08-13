const crypto = require('crypto');

// Test webhook payload for invoice.payment_failed
const testPayload = {
  id: 'evt_test_payment_failed',
  object: 'event',
  api_version: '2020-08-27',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'in_test_payment_failed',
      object: 'invoice',
      amount_due: 999,
      amount_paid: 0,
      amount_remaining: 999,
      application_fee_amount: null,
      attempt_count: 1,
      attempted: true,
      auto_advance: true,
      billing_reason: 'subscription_cycle',
      charge: null,
      collection_method: 'charge_automatically',
      created: Math.floor(Date.now() / 1000),
      currency: 'usd',
      customer: 'cus_test_customer',
      customer_email: 'test@example.com',
      customer_name: null,
      default_source: null,
      default_tax_rates: [],
      description: null,
      discount: null,
      due_date: null,
      ending_balance: null,
      footer: null,
      hosted_invoice_url: null,
      invoice_pdf: null,
      last_finalization_error: null,
      lines: {
        data: [
          {
            id: 'il_test_line',
            object: 'line_item',
            amount: 999,
            currency: 'usd',
            description: 'Pro Plan',
            discount_amounts: [],
            discountable: true,
            discounts: [],
            livemode: false,
            metadata: {},
            period: {
              end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
              start: Math.floor(Date.now() / 1000)
            },
            price: {
              id: 'price_test',
              object: 'price',
              active: true,
              currency: 'usd',
              product: 'prod_test',
              recurring: {
                interval: 'month',
                interval_count: 1
              },
              type: 'recurring',
              unit_amount: 999,
              unit_amount_decimal: '999'
            },
            proration: false,
            quantity: 1,
            subscription: 'sub_test_subscription',
            subscription_item: 'si_test_item',
            tax_amounts: [],
            tax_rates: [],
            type: 'invoiceitem',
            unit_amount_decimal: '999'
          }
        ],
        has_more: false,
        object: 'list',
        total_count: 1,
        url: '/v1/invoices/in_test_payment_failed/lines'
      },
      livemode: false,
      metadata: {},
      next_payment_attempt: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
      number: 'TEST-0001',
      paid: false,
      payment_intent: null,
      period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      period_start: Math.floor(Date.now() / 1000),
      post_payment_credit_notes_amount: 0,
      pre_payment_credit_notes_amount: 0,
      receipt_number: null,
      starting_balance: 0,
      statement_descriptor: null,
      status: 'open',
      subscription: 'sub_test_subscription',
      subtotal: 999,
      tax: null,
      tax_percent: null,
      total: 999,
      total_tax_amounts: [],
      webhooks_delivered_at: Math.floor(Date.now() / 1000)
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test',
    idempotency_key: null
  },
  type: 'invoice.payment_failed'
};

// Function to create webhook signature
function createWebhookSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  
  return {
    timestamp,
    signature: `t=${timestamp},v1=${signature}`
  };
}

// Test the webhook
async function testPaymentFailedWebhook() {
  try {
    const payload = JSON.stringify(testPayload);
    const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';
    const { timestamp, signature } = createWebhookSignature(testPayload, secret);
    
    console.log('Testing invoice.payment_failed webhook...');
    console.log('Payload:', payload);
    console.log('Signature:', signature);
    console.log('Timestamp:', timestamp);
    
    // You can use this to test locally or send to your server
    const response = await fetch('http://localhost:3000/api/billing/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature
      },
      body: payload
    });
    
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
}

// Run the test
testPaymentFailedWebhook(); 
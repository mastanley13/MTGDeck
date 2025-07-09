// Stripe Webhook Handler for GoHighLevel Integration
// This file can be deployed as a serverless function (Vercel, Netlify, AWS Lambda)
// or used in a Node.js Express server

import { processStripeWebhook } from '../utils/stripeIntegration.js';

/**
 * Main webhook handler function
 * Deploy this as your webhook endpoint URL in Stripe
 * 
 * Example deployment paths:
 * - Vercel: /api/stripe-webhook.js
 * - Netlify: /.netlify/functions/stripe-webhook.js
 * - AWS Lambda: stripe-webhook handler
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Received Stripe webhook');

    // Get the webhook payload
    const payload = req.body;
    
    // Verify webhook signature (optional but recommended)
    const signature = req.headers['stripe-signature'];
    
    // For security, you should verify the webhook signature
    // const isValid = verifyStripeSignature(payload, signature);
    // if (!isValid) {
    //   return res.status(400).json({ error: 'Invalid signature' });
    // }

    // Process the webhook event
    const result = await processStripeWebhook(payload);

    if (result.success) {
      console.log(`✅ Webhook processed successfully: ${result.eventType}`);
      return res.status(200).json({
        received: true,
        result: result
      });
    } else {
      console.log(`❌ Webhook processing failed: ${result.error}`);
      return res.status(400).json({
        received: true,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return res.status(500).json({
      received: false,
      error: error.message
    });
  }
}

/**
 * Verify Stripe webhook signature
 * Uncomment and use this for production security
 */
/*
function verifyStripeSignature(payload, signature) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    return true;
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return false;
  }
}
*/

// For Express.js server deployment
export const expressHandler = (req, res) => {
  return handler(req, res);
};

// For testing purposes - simulate webhook events
export const testWebhook = async (testEvent) => {
  console.log('🧪 Testing webhook with simulated event');
  
  const result = await processStripeWebhook(testEvent);
  console.log('Test result:', result);
  
  return result;
};

// Example test events for development
export const exampleEvents = {
  paymentSuccess: {
    type: 'checkout.session.completed',
    data: {
      object: {
        payment_status: 'paid',
        customer_email: 'test@example.com',
        payment_intent: 'pi_test_123',
        amount_total: 399, // $3.99 in cents
        subscription: 'sub_test_123',
        customer_details: {
          name: 'Test User'
        }
      }
    }
  },
  
  subscriptionCancelled: {
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        status: 'canceled'
      }
    }
  },
  
  paymentFailed: {
    type: 'invoice.payment_failed',
    data: {
      object: {
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        attempt_count: 1
      }
    }
  }
};

/* 
DEPLOYMENT INSTRUCTIONS:

1. VERCEL DEPLOYMENT:
   - Create file: /api/stripe-webhook.js
   - Export the handler function as default
   - Set webhook URL: https://your-domain.vercel.app/api/stripe-webhook

2. NETLIFY DEPLOYMENT:
   - Create file: /.netlify/functions/stripe-webhook.js
   - Export the handler function
   - Set webhook URL: https://your-domain.netlify.app/.netlify/functions/stripe-webhook

3. AWS LAMBDA DEPLOYMENT:
   - Create Lambda function with this handler
   - Set up API Gateway endpoint
   - Set webhook URL: https://your-api-id.execute-api.region.amazonaws.com/stage/stripe-webhook

4. EXPRESS.JS DEPLOYMENT:
   - Use expressHandler in your Express routes
   - app.post('/webhook/stripe', expressHandler);
   - Set webhook URL: https://your-domain.com/webhook/stripe

5. STRIPE CONFIGURATION:
   - Go to Stripe Dashboard > Webhooks
   - Add endpoint with your webhook URL
   - Select events: checkout.session.completed, customer.subscription.deleted, invoice.payment_failed
   - Copy webhook signing secret to environment variables

6. ENVIRONMENT VARIABLES NEEDED:
   - VITE_GHL_API_KEY (GoHighLevel API key)
   - STRIPE_WEBHOOK_SECRET (for signature verification)
   - STRIPE_SECRET_KEY (if using signature verification)

7. TESTING:
   - Use Stripe CLI: stripe listen --forward-to localhost:3000/api/stripe-webhook
   - Use test functions: testWebhook(exampleEvents.paymentSuccess)
*/ 
// Vercel API endpoint for handling Stripe webhooks
import { processStripeWebhook } from '../src/utils/stripeIntegration.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Received Stripe webhook via Vercel API');

    // Get the webhook payload
    const payload = req.body;
    
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

// Configure for raw body parsing
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
} 
# Stripe Payment Success & Webhook Setup Guide

## Overview

This guide explains how to set up the complete payment flow that:
1. Redirects users to Stripe for payment
2. Redirects back to your website after successful payment
3. Sends webhook data to GoHighLevel
4. Automatically activates premium subscriptions

## Components Created/Modified

### 1. Payment Success Page (`src/pages/PaymentSuccessPage.jsx`)
- Handles redirect from Stripe after successful payment
- Sends webhook to GoHighLevel with payment data
- Shows processing status and success/error messages
- Automatically redirects to subscription page

### 2. Updated Stripe Integration (`src/utils/stripeIntegration.js`)
- Added success/cancel URL parameters to payment links
- Added GoHighLevel webhook sending functionality
- Improved webhook processing with external webhook support

### 3. Webhook API Endpoint (`api/stripe-webhook.js`)
- Vercel-compatible API endpoint for Stripe webhooks
- Processes Stripe events and sends to GoHighLevel

### 4. Router Update (`src/App.jsx`)
- Added `/payment-success` route

## Setup Instructions

### Step 1: Configure Stripe Payment Link

In your Stripe Dashboard:
1. Go to **Payment Links**
2. Find your existing payment link: `https://buy.stripe.com/5kQ9AUf8J2pg0xzab6dZ60x`
3. Edit the payment link settings
4. Set the success URL to: `https://your-domain.com/payment-success`
5. Set the cancel URL to: `https://your-domain.com/subscription`

**Note**: If Stripe payment links don't support custom success URLs, you'll need to:
- Create a Stripe Checkout Session instead
- Use the Stripe API to create dynamic checkout sessions
- See "Alternative: Stripe Checkout Sessions" section below

### Step 2: Deploy Webhook Endpoint

Your webhook endpoint will be available at:
```
https://your-domain.vercel.app/api/stripe-webhook
```

### Step 3: Configure Stripe Webhooks

1. Go to **Stripe Dashboard > Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://your-domain.vercel.app/api/stripe-webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Save the webhook

### Step 4: Test the Flow

1. **Test Payment Success Page**:
   ```
   https://your-domain.com/payment-success?session_id=test123&payment_intent=pi_test456
   ```

2. **Test Webhook Endpoint**:
   ```bash
   curl -X POST https://your-domain.vercel.app/api/stripe-webhook \
     -H "Content-Type: application/json" \
     -d '{
       "type": "checkout.session.completed",
       "data": {
         "object": {
           "payment_status": "paid",
           "customer_email": "test@example.com",
           "payment_intent": "pi_test_123",
           "amount_total": 399
         }
       }
     }'
   ```

## Payment Flow

### Current Flow (Direct Payment Links)
1. User clicks "Upgrade to Premium"
2. User is redirected to Stripe payment page
3. After payment, Stripe redirects to `/payment-success`
4. Payment success page sends webhook to GoHighLevel
5. User is redirected to subscription page

### Webhook Data Sent to GoHighLevel

```json
{
  "type": "payment_success",
  "email": "customer@example.com",
  "paymentId": "pi_1234567890",
  "amount": "3.99",
  "timestamp": 1234567890,
  "userId": "user123",
  "contactId": "contact123"
}
```

## Alternative: Stripe Checkout Sessions

If payment links don't support custom success URLs, use Checkout Sessions:

### 1. Create Checkout Session Function

```javascript
// Add to src/utils/stripeIntegration.js
export const createCheckoutSession = async (contactId, email, userId) => {
  const domain = getCurrentDomain();
  
  const checkoutData = {
    success_url: `${domain}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${domain}/subscription`,
    line_items: [{
      price: 'price_1234567890', // Your Stripe price ID
      quantity: 1,
    }],
    mode: 'subscription',
    customer_email: email,
    metadata: {
      contactId: contactId,
      userId: userId
    }
  };

  // This would require Stripe API integration
  // const session = await stripe.checkout.sessions.create(checkoutData);
  // return session.url;
};
```

### 2. Update initiatePremiumCheckout

```javascript
export const initiatePremiumCheckout = async (contactId, email, userId) => {
  try {
    // Store user info for post-payment processing
    localStorage.setItem('pendingUpgrade', JSON.stringify({
      contactId,
      email,
      userId,
      timestamp: Date.now()
    }));

    // Create checkout session and redirect
    const checkoutUrl = await createCheckoutSession(contactId, email, userId);
    window.location.href = checkoutUrl;
    
  } catch (error) {
    console.error('Error redirecting to payment:', error);
    throw error;
  }
};
```

## Troubleshooting

### Common Issues

1. **Webhook not receiving data**:
   - Check Stripe webhook logs
   - Verify webhook URL is accessible
   - Check webhook event selection

2. **GoHighLevel webhook failing**:
   - Verify webhook URL is correct
   - Check required data format
   - Monitor browser network tab for errors

3. **Payment success page not loading**:
   - Verify route is added to App.jsx
   - Check success URL in Stripe settings
   - Ensure user is logged in

### Debug Commands

```javascript
// Test webhook locally
import { testWebhook, exampleEvents } from '../src/webhooks/stripeWebhookHandler.js';
await testWebhook(exampleEvents.paymentSuccess);

// Test GoHighLevel webhook
const webhookData = {
  type: 'payment_success',
  email: 'test@example.com',
  paymentId: 'pi_test_123',
  amount: '3.99',
  timestamp: Date.now()
};

fetch('https://services.leadconnectorhq.com/hooks/zKZ8Zy6VvGR1m7lNfRkY/webhook-trigger/8af7f178-88cd-4a86-8c44-b6f1079e6d95', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(webhookData)
});
```

## Environment Variables

Ensure these are set in your deployment:

```env
VITE_GHL_API_KEY=your_ghl_api_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_SECRET_KEY=sk_your_stripe_secret_key
```

## Security Considerations

1. **Webhook Signature Verification**: Enable in production
2. **HTTPS Only**: Ensure all URLs use HTTPS
3. **Rate Limiting**: Consider adding rate limiting to webhook endpoint
4. **Error Handling**: Implement proper error logging and monitoring

## Next Steps

1. Test the complete flow in development
2. Update Stripe payment link or implement Checkout Sessions
3. Configure Stripe webhooks
4. Deploy to production
5. Monitor webhook logs and payment flow 
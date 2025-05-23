# GoHighLevel Subscription Automation Guide

## Complete Setup Guide for Automatic Subscription Management

This guide walks you through setting up automatic subscription updates using the GoHighLevel API to sync Stripe payments with your subscriber status field.

---

## 🚀 Quick Start (Manual Processing)

### 1. Manual Activation for Individual Users

```javascript
import { activatePremiumByEmail } from '../utils/ghlSubscriptionAPI';

// Activate premium for a single user
const result = await activatePremiumByEmail('user@example.com', {
  paymentId: 'pi_1234567890',
  amount: '3.99'
});

console.log(result);
// {
//   success: true,
//   contactId: 'contact_123',
//   contactName: 'John Doe',
//   email: 'user@example.com',
//   previousStatus: 'FREE',
//   newStatus: 'PREMIUM'
// }
```

### 2. Batch Processing Multiple Users

```javascript
import { batchProcessPayments } from '../utils/ghlSubscriptionAPI';

const payments = [
  {
    type: 'payment_success',
    email: 'user1@example.com',
    paymentId: 'pi_111',
    amount: '3.99'
  },
  {
    type: 'payment_success', 
    email: 'user2@example.com',
    paymentId: 'pi_222',
    amount: '3.99'
  }
];

const results = await batchProcessPayments(payments);
console.log(`Processed: ${results.successful} successful, ${results.failed} failed`);
```

---

## 🔧 GoHighLevel API Configuration

### Required Environment Variables

Add these to your `.env` file:

```env
VITE_GHL_API_KEY=your_gohighlevel_api_key
VITE_GHL_LOCATION_ID=zKZ8Zy6VvGR1m7lNfRkY
```

### API Key Setup

1. **Log into GoHighLevel**
2. **Go to Settings** → **API Keys**
3. **Create New API Key** with these permissions:
   - `contacts.readonly`
   - `contacts.write` 
   - `contacts.notes.write`
4. **Copy the API key** to your environment variables

### Subscriber Field Configuration

Your subscriber field is already configured:
- **Field ID**: `zi3peZjkU9rZmf5j41Et`
- **Field Values**: 
  - `"yes"` = Premium subscription
  - `"no"` = Free subscription

---

## 💻 Using the Admin Interface

### Access the Subscription Manager

Navigate to the Subscription Manager component (add to your routing):

```jsx
import SubscriptionManager from '../components/admin/SubscriptionManager';

// Add to your router
<Route path="/admin/subscriptions" component={SubscriptionManager} />
```

### Admin Interface Features

#### 1. **Single User Management**
- Search for contacts by email
- Activate/deactivate premium status
- View contact information

#### 2. **Batch Processing**
- Process multiple emails at once
- Bulk activate/deactivate subscriptions
- Sync status for multiple users

#### 3. **Payment Data Processing**
- Import JSON data from Stripe
- Automatically process payment events
- Handle multiple payment types

---

## 🔄 Automated Webhook Processing

### Setting Up Webhooks (Full Automation)

#### 1. Deploy Webhook Handler

Choose your deployment method:

##### **Option A: Vercel (Recommended)**
```bash
# Create file: /api/stripe-webhook.js
# Copy the webhook handler code
# Deploy to Vercel
```

##### **Option B: Netlify Functions**
```bash
# Create file: /.netlify/functions/stripe-webhook.js
# Deploy to Netlify
```

##### **Option C: Express.js Server**
```javascript
import { expressHandler } from '../webhooks/stripeWebhookHandler';
app.post('/webhook/stripe', expressHandler);
```

#### 2. Configure Stripe Webhooks

1. **Go to Stripe Dashboard** → **Webhooks**
2. **Add Endpoint** with your webhook URL:
   - Vercel: `https://yourapp.vercel.app/api/stripe-webhook`
   - Netlify: `https://yourapp.netlify.app/.netlify/functions/stripe-webhook`
3. **Select Events**:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. **Copy Webhook Secret** to environment variables

#### 3. Environment Variables for Webhooks

```env
VITE_GHL_API_KEY=your_gohighlevel_api_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
```

---

## 📋 Manual Daily Workflow

### Step-by-Step Process

#### 1. **Check Stripe for New Payments**
```bash
# Log into Stripe Dashboard
# Go to Payments → All Payments
# Filter by "Succeeded" status and recent dates
# Note customer emails and payment IDs
```

#### 2. **Process Single Payment**
```javascript
// Use the admin interface or API directly
await activatePremiumByEmail('customer@example.com', {
  paymentId: 'pi_from_stripe',
  amount: '3.99'
});
```

#### 3. **Process Multiple Payments**
```javascript
// Collect payment data from Stripe
const todaysPayments = [
  {
    type: 'payment_success',
    email: 'customer1@example.com',
    paymentId: 'pi_1234567890',
    amount: '3.99',
    timestamp: Date.now()
  },
  // ... more payments
];

// Process all at once
const results = await batchProcessPayments(todaysPayments);
```

#### 4. **Handle Cancellations**
```javascript
// For cancelled subscriptions
await deactivatePremiumByEmail('customer@example.com', {
  reason: 'Customer cancellation',
  subscriptionId: 'sub_from_stripe'
});
```

---

## 🛠 API Functions Reference

### Core Functions

#### `activatePremiumByEmail(email, paymentData)`
```javascript
// Activate premium subscription
const result = await activatePremiumByEmail('user@example.com', {
  paymentId: 'pi_123',
  amount: '3.99',
  subscriptionId: 'sub_123'
});
```

#### `deactivatePremiumByEmail(email, cancellationData)`
```javascript
// Deactivate premium subscription  
const result = await deactivatePremiumByEmail('user@example.com', {
  reason: 'Payment failed',
  subscriptionId: 'sub_123'
});
```

#### `findContactByEmail(email)`
```javascript
// Search for contact by email
const contact = await findContactByEmail('user@example.com');
if (contact) {
  console.log(`Found: ${contact.firstName} ${contact.lastName}`);
}
```

#### `batchProcessPayments(events)`
```javascript
// Process multiple payment events
const events = [
  { type: 'payment_success', email: 'user1@example.com', paymentId: 'pi_1' },
  { type: 'subscription_cancelled', email: 'user2@example.com', subscriptionId: 'sub_1' }
];
const results = await batchProcessPayments(events);
```

### Utility Functions

#### `syncSubscriptionsByEmail(emailList)`
```javascript
// Check status of multiple emails
const emails = ['user1@example.com', 'user2@example.com'];
const results = await syncSubscriptionsByEmail(emails);
```

#### `addContactNote(contactId, note)`
```javascript
// Add note to contact
await addContactNote('contact_123', 'Premium activated via API');
```

---

## 📊 Monitoring and Troubleshooting

### Success Indicators

✅ **Successful Activation:**
```json
{
  "success": true,
  "contactId": "contact_123",
  "contactName": "John Doe", 
  "email": "user@example.com",
  "previousStatus": "FREE",
  "newStatus": "PREMIUM",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

❌ **Common Errors:**

1. **Contact Not Found**
```json
{
  "success": false,
  "email": "user@example.com",
  "error": "Contact not found for email: user@example.com"
}
```

2. **API Authentication Error**
```json
{
  "success": false,
  "error": "Failed to update subscription status: HTTP 401"
}
```

3. **Rate Limiting**
```json
{
  "success": false, 
  "error": "Rate limit exceeded"
}
```

### Debug Tools

#### Test Contact Search
```javascript
import { debugContactFields } from '../utils/ghlSubscriptionAPI';

// Debug contact fields to verify setup
await debugContactFields('contact_id_here');
```

#### Test Webhook Processing
```javascript
import { testWebhook, exampleEvents } from '../webhooks/stripeWebhookHandler';

// Test webhook with sample data
await testWebhook(exampleEvents.paymentSuccess);
```

---

## 🔐 Security Best Practices

### Environment Variables Security
- Never commit API keys to version control
- Use different keys for development/production
- Rotate keys regularly

### Webhook Security
- Always verify webhook signatures in production
- Use HTTPS endpoints only
- Monitor webhook logs for suspicious activity

### GoHighLevel Permissions
- Use minimum required API permissions
- Create separate API keys for different environments
- Monitor API usage in GoHighLevel dashboard

---

## 🚀 Production Deployment Checklist

### Before Going Live

- [ ] GoHighLevel API key configured with correct permissions
- [ ] Subscriber field ID verified (`zi3peZjkU9rZmf5j41Et`)
- [ ] Test activation/deactivation with test contact
- [ ] Webhook handler deployed and tested
- [ ] Stripe webhook configured with correct events
- [ ] Environment variables set in production
- [ ] Error monitoring/logging configured
- [ ] Backup manual process documented

### Testing Process

1. **Create Test Contact** in GoHighLevel
2. **Test Activation** via admin interface
3. **Verify Field Update** in GoHighLevel
4. **Test Deactivation** via admin interface
5. **Test Webhook** with Stripe CLI or test events
6. **Monitor Logs** for any errors

### Monitoring

- Set up alerts for webhook failures
- Monitor GoHighLevel API usage
- Track subscription activation/deactivation rates
- Log all payment processing activities

---

## 📞 Support and Troubleshooting

### Common Issues

1. **Contact Email Mismatch**: Ensure email in Stripe matches GoHighLevel
2. **API Rate Limits**: Implement delays between batch operations
3. **Field Value Format**: Ensure subscriber field uses "yes"/"no" exactly
4. **Webhook Timeouts**: Optimize webhook processing speed

### Getting Help

- Check GoHighLevel API documentation
- Review Stripe webhook logs
- Use debug functions to trace issues
- Monitor console logs for error details

---

## 🔄 Workflow Summary

### Automated (With Webhooks)
1. Customer pays via Stripe payment link
2. Stripe sends webhook to your endpoint
3. Webhook handler processes payment
4. GoHighLevel subscriber field updated automatically
5. User gets premium access immediately

### Manual (Current Setup)
1. Check Stripe dashboard for new payments
2. Use admin interface to process payments
3. GoHighLevel subscriber field updated via API
4. User gets premium access after processing

Both methods use the same underlying API functions and provide the same result - automatic subscription management through GoHighLevel integration. 
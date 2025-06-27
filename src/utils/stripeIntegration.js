// Stripe Integration Utilities
// Direct payment link approach - no API keys required
import { activatePremiumByEmail, deactivatePremiumByEmail, batchProcessPayments } from './ghlSubscriptionAPI';

// Direct Stripe payment URL with success/cancel URLs
const BASE_STRIPE_PAYMENT_URL = 'https://buy.stripe.com/5kQ9AUf8J2pg0xzab6dZ60x';

// Get the current domain for success/cancel URLs
const getCurrentDomain = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://your-domain.com'; // Fallback for server-side rendering
};

const getStripePaymentUrl = () => {
  const domain = getCurrentDomain();
  const successUrl = `${domain}/payment-success`;
  const cancelUrl = `${domain}/subscription`;
  
  // For Stripe payment links, we can append success and cancel URLs as query parameters
  return `${BASE_STRIPE_PAYMENT_URL}?success_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;
};

/**
 * Redirect to Stripe payment page
 * This will be called from the "Upgrade to Premium" button
 * @param {string} contactId - GoHighLevel contact ID
 * @param {string} email - User's email
 * @param {string} userId - User's ID
 * @returns {void}
 */
export const initiatePremiumCheckout = async (contactId, email, userId) => {
  try {
    // Store user info for post-payment processing
    localStorage.setItem('pendingUpgrade', JSON.stringify({
      contactId,
      email,
      userId,
      timestamp: Date.now()
    }));

    // Redirect directly to Stripe payment page (same tab for better UX)
    window.location.href = getStripePaymentUrl();
    
  } catch (error) {
    console.error('Error redirecting to payment:', error);
    throw error;
  }
};

/**
 * Handle successful payment - manual process for now
 * Users will need to refresh the page after payment
 * @param {string} contactId - GoHighLevel contact ID
 * @returns {Promise<boolean>}
 */
export const handleSuccessfulPayment = async (contactId) => {
  try {
    // For now, this would be handled manually or through webhooks
    // The user's subscription status will be updated in GoHighLevel
    console.log(`Payment completed for contact ${contactId}`);
    return true;
  } catch (error) {
    console.error('Error handling payment:', error);
    throw error;
  }
};

/**
 * Create link to Stripe customer portal for subscription management
 * This will open Stripe's customer portal in a new tab
 * @returns {void}
 */
export const createCustomerPortalSession = async () => {
  try {
    // For direct payment links, users can manage subscriptions through Stripe's customer portal
    // You would need to provide the customer portal link or handle this through your Stripe dashboard
    alert('Please contact support to manage your subscription, or access your subscription through the original payment email from Stripe.');
    
  } catch (error) {
    console.error('Error accessing customer portal:', error);
    throw error;
  }
};

/**
 * Check if Stripe is configured (always true for direct links)
 * @returns {boolean}
 */
export const isStripeConfigured = () => {
  return true; // Direct payment links are always available
};

/**
 * Get the premium price for display
 * @returns {string}
 */
export const getPremiumPrice = () => {
  return '$3.99';
};

/**
 * Get the direct payment URL
 * @returns {string}
 */
export const getPaymentUrl = () => {
  return getStripePaymentUrl();
};

/**
 * Handle subscription cancellation webhook
 * This should be called from your backend webhook handler
 * @param {string} contactId - GoHighLevel contact ID
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<boolean>}
 */
export const handleSubscriptionCancellation = async (contactId, stripeEvent) => {
  try {
    // Update subscription status in GoHighLevel
    await updateSubscriptionStatus(contactId, 'FREE');
    console.log(`Subscription cancelled for contact ${contactId}`);
    return true;
  } catch (error) {
    console.error('Error cancelling subscription in GoHighLevel:', error);
    throw error;
  }
};

/**
 * Process Stripe webhook event and update GoHighLevel automatically
 * This function should be called from your backend webhook endpoint
 * @param {Object} webhookEvent - Stripe webhook event object
 * @returns {Promise<Object>} Processing result
 */
export const processStripeWebhook = async (webhookEvent) => {
  try {
    console.log(`🔄 Processing Stripe webhook: ${webhookEvent.type}`);

    let result = null;

    switch (webhookEvent.type) {
      case 'checkout.session.completed':
        // Payment successful - activate premium
        const session = webhookEvent.data.object;
        if (session.payment_status === 'paid' && session.customer_email) {
          result = await activatePremiumByEmail(session.customer_email, {
            paymentId: session.payment_intent,
            amount: (session.amount_total / 100).toFixed(2), // Convert from cents
            subscriptionId: session.subscription,
            customerName: session.customer_details?.name
          });
        }
        break;

      case 'customer.subscription.created':
        // New subscription created
        const newSubscription = webhookEvent.data.object;
        if (newSubscription.status === 'active') {
          // Get customer email from customer object
          const customerEmail = await getStripeCustomerEmail(newSubscription.customer);
          if (customerEmail) {
            result = await activatePremiumByEmail(customerEmail, {
              subscriptionId: newSubscription.id,
              amount: (newSubscription.items.data[0]?.price?.unit_amount / 100).toFixed(2)
            });
          }
        }
        break;

      case 'customer.subscription.deleted':
        // Subscription cancelled
        const cancelledSubscription = webhookEvent.data.object;
        const customerEmail = await getStripeCustomerEmail(cancelledSubscription.customer);
        if (customerEmail) {
          result = await deactivatePremiumByEmail(customerEmail, {
            reason: 'Subscription cancelled',
            subscriptionId: cancelledSubscription.id
          });
        }
        break;

      case 'invoice.payment_failed':
        // Payment failed - potentially deactivate
        const failedInvoice = webhookEvent.data.object;
        const failedCustomerEmail = await getStripeCustomerEmail(failedInvoice.customer);
        if (failedCustomerEmail) {
          result = await deactivatePremiumByEmail(failedCustomerEmail, {
            reason: 'Payment failed',
            subscriptionId: failedInvoice.subscription
          });
        }
        break;

      default:
        console.log(`ℹ️ Unhandled webhook event type: ${webhookEvent.type}`);
        return {
          success: true,
          message: 'Event type not processed',
          eventType: webhookEvent.type
        };
    }

    if (result) {
      console.log(`✅ Webhook processed successfully: ${webhookEvent.type}`);
      
      // Also send webhook to GoHighLevel
      try {
        await sendGoHighLevelWebhook(webhookEvent, result);
      } catch (error) {
        console.error('❌ Failed to send GoHighLevel webhook:', error);
        // Don't fail the main webhook processing if GHL webhook fails
      }
      
      return {
        success: true,
        result: result,
        eventType: webhookEvent.type,
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        success: false,
        message: 'No result from processing',
        eventType: webhookEvent.type
      };
    }

  } catch (error) {
    console.error(`❌ Error processing webhook ${webhookEvent.type}:`, error);
    return {
      success: false,
      error: error.message,
      eventType: webhookEvent.type,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Send webhook to GoHighLevel
 * @param {Object} stripeEvent - Original Stripe event
 * @param {Object} processingResult - Result from processing the webhook
 * @returns {Promise<void>}
 */
const sendGoHighLevelWebhook = async (stripeEvent, processingResult) => {
  const GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/zKZ8Zy6VvGR1m7lNfRkY/webhook-trigger/8af7f178-88cd-4a86-8c44-b6f1079e6d95';
  
  try {
    // Prepare webhook data for GoHighLevel
    const webhookData = {
      type: 'stripe_webhook_processed',
      stripeEventType: stripeEvent.type,
      email: processingResult.email,
      contactId: processingResult.contactId,
      subscriptionStatus: processingResult.newStatus || 'PREMIUM',
      timestamp: new Date().toISOString(),
      stripeData: {
        paymentId: stripeEvent.data.object.payment_intent || stripeEvent.data.object.id,
        amount: stripeEvent.data.object.amount_total ? (stripeEvent.data.object.amount_total / 100).toFixed(2) : '3.99',
        subscriptionId: stripeEvent.data.object.subscription
      }
    };

    console.log('🔄 Sending webhook to GoHighLevel...', webhookData);

    const response = await fetch(GHL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });

    if (response.ok) {
      console.log('✅ GoHighLevel webhook sent successfully');
    } else {
      const errorText = await response.text();
      console.error('❌ GoHighLevel webhook failed:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Error sending GoHighLevel webhook:', error);
    throw error;
  }
};

/**
 * Helper function to get customer email from Stripe customer ID
 * This would typically make an API call to Stripe to get customer details
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<string|null>} Customer email or null
 */
const getStripeCustomerEmail = async (customerId) => {
  // For direct payment links, this information might not be available
  // In a full integration, you would call Stripe API here:
  // const customer = await stripe.customers.retrieve(customerId);
  // return customer.email;
  
  console.warn(`⚠️ Customer email lookup not implemented for customer ${customerId}`);
  return null;
};

/**
 * Manual payment processing for when you have payment details from Stripe dashboard
 * @param {Array} paymentList - Array of payment objects from Stripe dashboard
 * @returns {Promise<Object>} Processing results
 */
export const processManualPayments = async (paymentList) => {
  const events = paymentList.map(payment => ({
    type: payment.status === 'succeeded' ? 'payment_success' : 'payment_failed',
    email: payment.email,
    paymentId: payment.id,
    amount: payment.amount,
    timestamp: payment.created
  }));

  return await batchProcessPayments(events);
};

// Example backend webhook handler (for reference)
/*
// Backend webhook endpoint: /api/stripe-webhook
export const handleStripeWebhook = async (request) => {
  const sig = request.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return { status: 400 };
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      // Payment successful - activate subscription
      const session = event.data.object;
      const contactId = session.metadata.contactId;
      await handleSuccessfulPayment(contactId, event);
      break;
      
    case 'customer.subscription.deleted':
      // Subscription cancelled - deactivate
      const subscription = event.data.object;
      const cancelContactId = subscription.metadata.contactId;
      await handleSubscriptionCancellation(cancelContactId, event);
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return { status: 200 };
};
*/ 
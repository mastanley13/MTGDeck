/**
 * SUBSCRIPTION AUTOMATION QUICK REFERENCE
 * Copy and paste these examples for common subscription tasks
 */

import { 
  activatePremiumByEmail, 
  deactivatePremiumByEmail, 
  batchProcessPayments,
  findContactByEmail,
  syncSubscriptionsByEmail 
} from './ghlSubscriptionAPI';

/**
 * ✅ ACTIVATE PREMIUM FOR SINGLE USER
 * Use this when processing individual Stripe payments
 */
export const activateSingleUser = async (email, paymentId) => {
  try {
    const result = await activatePremiumByEmail(email, {
      paymentId: paymentId,
      amount: '3.99'
    });
    
    if (result.success) {
      console.log(`✅ Premium activated for ${email}`);
      return result;
    } else {
      console.log(`❌ Failed to activate ${email}: ${result.error}`);
      return result;
    }
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ❌ DEACTIVATE PREMIUM FOR SINGLE USER  
 * Use this for cancellations or payment failures
 */
export const deactivateSingleUser = async (email, reason = 'Subscription cancelled') => {
  try {
    const result = await deactivatePremiumByEmail(email, { reason });
    
    if (result.success) {
      console.log(`✅ Premium deactivated for ${email}`);
      return result;
    } else {
      console.log(`❌ Failed to deactivate ${email}: ${result.error}`);
      return result;
    }
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 🔍 SEARCH FOR CONTACT BY EMAIL
 * Use this to verify if a customer exists in GoHighLevel
 */
export const searchCustomer = async (email) => {
  try {
    const contact = await findContactByEmail(email);
    
    if (contact) {
      console.log(`✅ Found: ${contact.firstName} ${contact.lastName} (${contact.email})`);
      return contact;
    } else {
      console.log(`❌ No contact found for ${email}`);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

/**
 * 📦 PROCESS MULTIPLE PAYMENTS AT ONCE
 * Use this for daily batch processing from Stripe
 */
export const processDailyPayments = async (paymentsFromStripe) => {
  // Convert Stripe payment data to our format
  const events = paymentsFromStripe.map(payment => ({
    type: 'payment_success',
    email: payment.customer_email,
    paymentId: payment.id,
    amount: (payment.amount / 100).toFixed(2), // Convert cents to dollars
    timestamp: payment.created
  }));

  try {
    const results = await batchProcessPayments(events);
    
    console.log(`📊 Batch Results: ${results.successful} successful, ${results.failed} failed`);
    
    // Show any errors
    if (results.errors.length > 0) {
      console.log('❌ Errors:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    return results;
  } catch (error) {
    console.error('Batch processing error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 📋 COMMON USAGE EXAMPLES
 */

// Example 1: Process a single Stripe payment
/*
const stripePayment = {
  id: 'pi_1234567890',
  customer_email: 'customer@example.com',
  amount: 399, // $3.99 in cents
  status: 'succeeded'
};

if (stripePayment.status === 'succeeded') {
  await activateSingleUser(stripePayment.customer_email, stripePayment.id);
}
*/

// Example 2: Process daily payments from Stripe
/*
const dailyPayments = [
  {
    id: 'pi_111',
    customer_email: 'user1@example.com', 
    amount: 399,
    created: 1704123456
  },
  {
    id: 'pi_222',
    customer_email: 'user2@example.com',
    amount: 399, 
    created: 1704123789
  }
];

await processDailyPayments(dailyPayments);
*/

// Example 3: Handle subscription cancellation
/*
await deactivateSingleUser('customer@example.com', 'Customer requested cancellation');
*/

// Example 4: Check if customer exists before processing
/*
const contact = await searchCustomer('potential-customer@example.com');
if (contact) {
  // Customer exists, safe to process payment
  await activateSingleUser(contact.email, 'pi_payment_id');
} else {
  console.log('Customer not found - they may need to register first');
}
*/

/**
 * 🚨 ERROR HANDLING EXAMPLES
 */

// Robust activation with error handling
export const safeActivateUser = async (email, paymentId) => {
  try {
    // First check if contact exists
    const contact = await searchCustomer(email);
    if (!contact) {
      return {
        success: false,
        error: 'Contact not found in GoHighLevel. Customer may need to register first.'
      };
    }

    // Activate premium
    const result = await activateSingleUser(email, paymentId);
    return result;

  } catch (error) {
    console.error(`Error activating ${email}:`, error);
    return {
      success: false,
      error: error.message,
      email: email
    };
  }
};

/**
 * 📊 DAILY WORKFLOW HELPER
 * Complete workflow for processing daily Stripe payments
 */
export const dailySubscriptionWorkflow = async () => {
  console.log('🔄 Starting daily subscription workflow...');
  
  try {
    // Step 1: Get payments from Stripe (you need to implement this)
    // const stripePayments = await getStripePaymentsForToday();
    
    // Step 2: For demo, using sample data
    const samplePayments = [
      {
        id: 'pi_demo_123',
        customer_email: 'demo@example.com',
        amount: 399,
        created: Date.now()
      }
    ];

    // Step 3: Process payments
    console.log(`📦 Processing ${samplePayments.length} payments...`);
    const results = await processDailyPayments(samplePayments);

    // Step 4: Report results
    console.log('📊 Daily workflow complete:');
    console.log(`  ✅ Successful: ${results.successful || 0}`);
    console.log(`  ❌ Failed: ${results.failed || 0}`);
    console.log(`  📝 Total processed: ${results.processed || 0}`);

    return results;

  } catch (error) {
    console.error('❌ Daily workflow error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 🔧 TESTING FUNCTIONS
 * Use these to test your setup
 */

// Test the GoHighLevel connection
export const testConnection = async () => {
  console.log('🧪 Testing GoHighLevel connection...');
  
  try {
    // Try to search for any contact to test API connectivity
    const testResult = await searchCustomer('test@example.com');
    console.log('✅ GoHighLevel API connection working');
    return true;
  } catch (error) {
    console.error('❌ GoHighLevel API connection failed:', error);
    return false;
  }
};

// Test activation/deactivation cycle
export const testSubscriptionCycle = async (testEmail) => {
  console.log(`🧪 Testing subscription cycle for ${testEmail}...`);
  
  try {
    // 1. Check if contact exists
    const contact = await searchCustomer(testEmail);
    if (!contact) {
      console.log('❌ Test contact not found');
      return false;
    }

    // 2. Activate premium
    console.log('🔄 Testing activation...');
    const activateResult = await activateSingleUser(testEmail, 'test_payment_123');
    
    if (!activateResult.success) {
      console.log('❌ Activation test failed');
      return false;
    }

    // 3. Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Deactivate premium
    console.log('🔄 Testing deactivation...');
    const deactivateResult = await deactivateSingleUser(testEmail, 'Test deactivation');
    
    if (!deactivateResult.success) {
      console.log('❌ Deactivation test failed');
      return false;
    }

    console.log('✅ Subscription cycle test completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

export default {
  activateSingleUser,
  deactivateSingleUser, 
  searchCustomer,
  processDailyPayments,
  safeActivateUser,
  dailySubscriptionWorkflow,
  testConnection,
  testSubscriptionCycle
}; 
// GoHighLevel Subscription API utilities
const GHL_API_BASE_URL = 'https://services.leadconnectorhq.com';
const GHL_API_TOKEN = import.meta.env.VITE_GHL_API_KEY;
const GHL_API_VERSION = '2021-07-28';
const GHL_LOCATION_ID = 'zKZ8Zy6VvGR1m7lNfRkY';

// Subscription field configuration
// The user's subscription field ID in GoHighLevel
const SUBSCRIPTION_FIELD_ID = "zi3peZjkU9rZmf5j41Et";

/**
 * Get all custom fields for a contact to help identify field IDs
 * @param {string} contactId - The contact ID
 * @returns {Promise<Object>} Contact data with custom fields
 */
export const getContactCustomFields = async (contactId) => {
  try {
    const response = await fetch(`${GHL_API_BASE_URL}/contacts/${contactId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GHL_API_TOKEN}`,
        'Version': GHL_API_VERSION,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch contact: ${response.status}`);
    }

    const data = await response.json();
    return data.contact;
  } catch (error) {
    console.error('Error fetching contact custom fields:', error);
    throw error;
  }
};

/**
 * Find subscription field by ID in custom fields array
 * @param {Array} customFields - Array of custom field objects
 * @returns {Object|null} The subscription field object or null
 */
const findSubscriptionField = (customFields) => {
  if (!customFields || !Array.isArray(customFields)) {
    return null;
  }

  // Find by the specific field ID
  const field = customFields.find(f => f.id === SUBSCRIPTION_FIELD_ID);
  return field || null;
};

/**
 * Get the subscription status from GoHighLevel
 * @param {string} contactId - The contact ID
 * @returns {Promise<string>} Subscription status ('FREE' or 'PREMIUM')
 */
export const getSubscriptionStatus = async (contactId) => {
  try {
    const contact = await getContactCustomFields(contactId);
    
    if (contact.customFields) {
      const subscriptionField = findSubscriptionField(contact.customFields);
      
      if (subscriptionField) {
        // Convert "yes"/"no" to "PREMIUM"/"FREE"
        const value = subscriptionField.value?.toLowerCase();
        return value === 'yes' ? 'PREMIUM' : 'FREE';
      }
    }
    
    // Default to FREE if field not found or no value
    return 'FREE';
  } catch (error) {
    console.error('Error fetching subscription status from GHL:', error);
    // Return FREE as fallback to not break the app
    return 'FREE';
  }
};

/**
 * Update the subscription status in GoHighLevel
 * @param {string} contactId - The contact ID
 * @param {string} status - Subscription status ('FREE' or 'PREMIUM')
 * @returns {Promise<boolean>} Success status
 */
export const updateSubscriptionStatus = async (contactId, status) => {
  try {
    // Convert status to "yes"/"no" format
    const fieldValue = status.toUpperCase() === 'PREMIUM' ? 'yes' : 'no';
    
    const payload = {
      customFields: [
        {
          id: SUBSCRIPTION_FIELD_ID,
          field_value: fieldValue
        }
      ]
    };

    const response = await fetch(`${GHL_API_BASE_URL}/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GHL_API_TOKEN}`,
        'Version': GHL_API_VERSION,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update subscription status' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    console.log(`Subscription status updated to ${status} (${fieldValue}) for contact ${contactId}`);
    return true;
  } catch (error) {
    console.error('Error updating subscription status in GHL:', error);
    throw error;
  }
};

/**
 * Set subscription status for new user registration
 * @param {string} contactId - The contact ID
 * @param {boolean} isPremium - Whether the user is signing up for premium
 * @returns {Promise<boolean>} Success status
 */
export const setInitialSubscriptionStatus = async (contactId, isPremium = false) => {
  const status = isPremium ? 'PREMIUM' : 'FREE';
  return await updateSubscriptionStatus(contactId, status);
};

/**
 * Sync subscription status from GoHighLevel to local context
 * @param {string} contactId - The contact ID
 * @param {Function} setSubscriptionStatus - Function to update local subscription status
 * @returns {Promise<string>} The fetched subscription status
 */
export const syncSubscriptionStatus = async (contactId, setSubscriptionStatus) => {
  try {
    const status = await getSubscriptionStatus(contactId);
    setSubscriptionStatus(status);
    return status;
  } catch (error) {
    console.error('Error syncing subscription status:', error);
    // Don't throw error to prevent app breakage
    return 'FREE';
  }
};

/**
 * Debug function to list all custom fields for a contact
 * Use this to find your subscription field ID
 * @param {string} contactId - The contact ID
 */
export const debugContactFields = async (contactId) => {
  try {
    const contact = await getContactCustomFields(contactId);
    console.log('=== CONTACT CUSTOM FIELDS DEBUG ===');
    console.log('Contact ID:', contactId);
    console.log('All custom fields:', contact.customFields);
    
    if (contact.customFields && contact.customFields.length > 0) {
      console.log('\n=== FIELD DETAILS ===');
      contact.customFields.forEach((field, index) => {
        console.log(`Field ${index + 1}:`);
        console.log(`  ID: ${field.id}`);
        console.log(`  Key: ${field.key || 'N/A'}`);
        console.log(`  Value: ${field.value}`);
        console.log('---');
      });
      
      // Specifically look for the subscription field
      const subscriptionField = findSubscriptionField(contact.customFields);
      if (subscriptionField) {
        console.log('\n🎯 FOUND SUBSCRIPTION FIELD:');
        console.log(`  ID: ${subscriptionField.id}`);
        console.log(`  Key: ${subscriptionField.key || 'N/A'}`);
        console.log(`  Value: ${subscriptionField.value}`);
        console.log(`  Mapped Status: ${subscriptionField.value?.toLowerCase() === 'yes' ? 'PREMIUM' : 'FREE'}`);
      } else {
        console.log(`\n❌ Subscription field with ID "${SUBSCRIPTION_FIELD_ID}" not found`);
      }
    } else {
      console.log('No custom fields found for this contact');
    }
    
    return contact.customFields || [];
  } catch (error) {
    console.error('Error debugging contact fields:', error);
    return [];
  }
};

/**
 * Search for a contact by email address
 * @param {string} email - The email address to search for
 * @returns {Promise<Object|null>} Contact object or null if not found
 */
export const findContactByEmail = async (email) => {
  try {
    const response = await fetch(`${GHL_API_BASE_URL}/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GHL_API_TOKEN}`,
        'Version': GHL_API_VERSION,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to search contact: ${response.status}`);
    }

    const data = await response.json();
    
    // Return the first contact if found
    if (data.contacts && data.contacts.length > 0) {
      return data.contacts[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error searching contact by email:', error);
    throw error;
  }
};

/**
 * Automatically activate premium subscription for a customer
 * @param {string} email - Customer email from Stripe
 * @param {Object} paymentData - Payment information from Stripe
 * @returns {Promise<Object>} Result object with success status and contact info
 */
export const activatePremiumByEmail = async (email, paymentData = {}) => {
  try {
    console.log(`🔄 Activating premium subscription for: ${email}`);
    
    // Find the contact by email
    const contact = await findContactByEmail(email);
    
    if (!contact) {
      throw new Error(`Contact not found for email: ${email}`);
    }

    console.log(`✅ Found contact: ${contact.firstName} ${contact.lastName} (ID: ${contact.id})`);

    // Update subscription status to premium
    await updateSubscriptionStatus(contact.id, 'PREMIUM');

    // Add payment notes to contact
    const paymentNote = `Premium Subscription Activated
Date: ${new Date().toLocaleDateString()}
Email: ${email}
${paymentData.paymentId ? `Stripe Payment ID: ${paymentData.paymentId}` : ''}
${paymentData.amount ? `Amount: $${paymentData.amount}` : 'Amount: $3.99'}
Status: Active - Auto-activated via API`;

    await addContactNote(contact.id, paymentNote);

    console.log(`🎉 Premium activated successfully for ${email}`);

    return {
      success: true,
      contactId: contact.id,
      contactName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
      email: email,
      previousStatus: 'FREE',
      newStatus: 'PREMIUM',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ Error activating premium for ${email}:`, error);
    return {
      success: false,
      email: email,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Automatically deactivate premium subscription for a customer
 * @param {string} email - Customer email from Stripe
 * @param {Object} cancellationData - Cancellation information from Stripe
 * @returns {Promise<Object>} Result object with success status and contact info
 */
export const deactivatePremiumByEmail = async (email, cancellationData = {}) => {
  try {
    console.log(`🔄 Deactivating premium subscription for: ${email}`);
    
    // Find the contact by email
    const contact = await findContactByEmail(email);
    
    if (!contact) {
      throw new Error(`Contact not found for email: ${email}`);
    }

    console.log(`✅ Found contact: ${contact.firstName} ${contact.lastName} (ID: ${contact.id})`);

    // Update subscription status to free
    await updateSubscriptionStatus(contact.id, 'FREE');

    // Add cancellation notes to contact
    const cancellationNote = `Premium Subscription Cancelled
Date: ${new Date().toLocaleDateString()}
Email: ${email}
${cancellationData.reason ? `Reason: ${cancellationData.reason}` : 'Reason: Customer cancellation'}
${cancellationData.subscriptionId ? `Stripe Subscription ID: ${cancellationData.subscriptionId}` : ''}
Status: Reverted to Free - Auto-cancelled via API`;

    await addContactNote(contact.id, cancellationNote);

    console.log(`📝 Premium deactivated successfully for ${email}`);

    return {
      success: true,
      contactId: contact.id,
      contactName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
      email: email,
      previousStatus: 'PREMIUM',
      newStatus: 'FREE',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ Error deactivating premium for ${email}:`, error);
    return {
      success: false,
      email: email,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Add a note to a contact
 * @param {string} contactId - The contact ID
 * @param {string} note - The note content
 * @returns {Promise<boolean>} Success status
 */
export const addContactNote = async (contactId, note) => {
  try {
    const payload = {
      body: note,
      contactId: contactId,
      userId: 'system' // or your user ID
    };

    const response = await fetch(`${GHL_API_BASE_URL}/contacts/${contactId}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_TOKEN}`,
        'Version': GHL_API_VERSION,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(`Failed to add note to contact ${contactId}: ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error adding contact note:', error);
    return false;
  }
};

/**
 * Process multiple Stripe payment events in batch
 * @param {Array} paymentEvents - Array of payment event objects from Stripe
 * @returns {Promise<Object>} Batch processing results
 */
export const batchProcessPayments = async (paymentEvents) => {
  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [],
    details: []
  };

  console.log(`🔄 Processing ${paymentEvents.length} payment events...`);

  for (const event of paymentEvents) {
    results.processed++;

    try {
      let result;
      
      if (event.type === 'payment_success' || event.type === 'subscription_created') {
        result = await activatePremiumByEmail(event.email, {
          paymentId: event.paymentId,
          amount: event.amount,
          subscriptionId: event.subscriptionId
        });
      } else if (event.type === 'subscription_cancelled' || event.type === 'payment_failed') {
        result = await deactivatePremiumByEmail(event.email, {
          reason: event.reason || 'Subscription cancelled',
          subscriptionId: event.subscriptionId
        });
      } else {
        throw new Error(`Unknown event type: ${event.type}`);
      }

      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        results.errors.push(result.error);
      }

      results.details.push(result);

    } catch (error) {
      results.failed++;
      results.errors.push(`Error processing ${event.email}: ${error.message}`);
      results.details.push({
        success: false,
        email: event.email,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`✅ Batch processing complete: ${results.successful} successful, ${results.failed} failed`);
  return results;
};

/**
 * Sync specific emails with their Stripe subscription status
 * @param {Array} emailList - Array of email addresses to sync
 * @returns {Promise<Object>} Sync results
 */
export const syncSubscriptionsByEmail = async (emailList) => {
  const results = {
    total: emailList.length,
    found: 0,
    notFound: 0,
    updated: 0,
    errors: [],
    details: []
  };

  console.log(`🔄 Syncing ${emailList.length} email subscriptions...`);

  for (const email of emailList) {
    try {
      const contact = await findContactByEmail(email);
      
      if (!contact) {
        results.notFound++;
        results.details.push({
          email,
          status: 'not_found',
          message: 'Contact not found in GoHighLevel'
        });
        continue;
      }

      results.found++;
      
      // Here you would typically check Stripe for the actual subscription status
      // For now, we'll just log that the contact was found
      console.log(`✅ Found contact for ${email}: ${contact.firstName} ${contact.lastName}`);
      
      results.details.push({
        email,
        contactId: contact.id,
        contactName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
        status: 'found',
        message: 'Contact found and ready for sync'
      });

    } catch (error) {
      results.errors.push(`Error syncing ${email}: ${error.message}`);
      results.details.push({
        email,
        status: 'error',
        message: error.message
      });
    }
  }

  console.log(`✅ Sync complete: ${results.found} found, ${results.notFound} not found`);
  return results;
}; 
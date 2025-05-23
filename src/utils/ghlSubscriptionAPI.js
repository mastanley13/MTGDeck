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
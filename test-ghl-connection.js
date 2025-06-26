import dotenv from 'dotenv';
dotenv.config();

const GHL_API_BASE_URL = 'https://services.leadconnectorhq.com';
const GHL_API_TOKEN = process.env.VITE_GHL_API_KEY;
const GHL_API_VERSION = '2021-07-28';
const GHL_LOCATION_ID = 'zKZ8Zy6VvGR1m7lNfRkY';

async function testGHLConnection() {
  try {
    console.log('Testing GHL Connection...');
    console.log('API Token available:', !!GHL_API_TOKEN);
    
    // Test with a known email
    const testEmail = 'test@example.com';
    const response = await fetch(`${GHL_API_BASE_URL}/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(testEmail)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GHL_API_TOKEN}`,
        'Version': GHL_API_VERSION,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ GHL Connection Successful!');
      console.log('Response Status:', response.status);
      if (data.contact) {
        console.log('Contact found:', data.contact.email);
      } else {
        console.log('No contact found for test email');
      }
    } else {
      console.error('❌ GHL Connection Failed');
      console.error('Status:', response.status);
      console.error('Error:', data);
    }
  } catch (error) {
    console.error('❌ Error testing GHL connection:', error);
  }
}

testGHLConnection(); 
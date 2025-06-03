import axios from 'axios';

const webhookUrl = 'https://services.leadconnectorhq.com/hooks/zKZ8Zy6VvGR1m7lNfRkY/webhook-trigger/670990aa-2807-4e4b-ba9b-cfc24eaf4e5e';

async function testWebhook() {
  try {
    // Most basic test data format
    const testData = {
      "message": "test message"
    };

    console.log('🚀 Sending test webhook request...\n');
    console.log('Request Data:', JSON.stringify(testData, null, 2), '\n');

    const response = await axios.post(webhookUrl, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Webhook test successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Webhook test failed:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testWebhook(); 
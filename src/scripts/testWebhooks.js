import axios from 'axios';

const testWebhooks = async () => {
  const baseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const webhookSecret = process.env.VITE_GHL_WEBHOOK_SECRET;

  // Test data
  const testPost = {
    id: 'test-post-123',
    title: 'Test Commander Deck Guide',
    content: 'This is a test post content...',
    status: 'draft'
  };

  try {
    console.log('🚀 Starting webhook tests...\n');

    // Test new post webhook
    console.log('Testing new post webhook...');
    const newPostResponse = await axios.post(
      `${baseUrl}/api/webhooks/blog/new`,
      testPost,
      {
        headers: {
          'x-webhook-signature': 'test-signature',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ New post webhook test passed\n');

    // Test post publish webhook
    console.log('Testing post publish webhook...');
    const publishResponse = await axios.post(
      `${baseUrl}/api/webhooks/blog/publish`,
      { ...testPost, status: 'published' },
      {
        headers: {
          'x-webhook-signature': 'test-signature',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Post publish webhook test passed\n');

    // Test post update webhook
    console.log('Testing post update webhook...');
    const updateResponse = await axios.post(
      `${baseUrl}/api/webhooks/blog/update`,
      { ...testPost, content: 'Updated content...' },
      {
        headers: {
          'x-webhook-signature': 'test-signature',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Post update webhook test passed\n');

    console.log('🎉 All webhook tests completed successfully!');
  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
};

// Run tests
testWebhooks(); 
import crypto from 'crypto';

class WebhookService {
  constructor() {
    this.webhookSecret = process.env.GHL_WEBHOOK_SECRET;
  }

  // Verify webhook signature
  verifySignature(signature, payload) {
    try {
      // Create an HMAC using your webhook secret
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      
      // Add the request body to the HMAC
      hmac.update(JSON.stringify(payload));
      
      // Get the hex digest of the HMAC
      const calculatedSignature = hmac.digest('hex');
      
      // Compare the calculated signature with the one from the request
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(calculatedSignature)
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  // Handle new blog post creation webhook
  async handleNewPost(postData) {
    try {
      console.log('Processing new blog post:', postData.title);
      // Add your post creation logic here
      return { success: true, message: 'New post processed' };
    } catch (error) {
      console.error('Error handling new post webhook:', error);
      throw error;
    }
  }

  // Handle post publish webhook
  async handlePostPublish(postData) {
    try {
      console.log('Processing published post:', postData.title);
      // Add your post publishing logic here
      return { success: true, message: 'Post publish processed' };
    } catch (error) {
      console.error('Error handling post publish webhook:', error);
      throw error;
    }
  }

  // Handle post update webhook
  async handlePostUpdate(postData) {
    try {
      console.log('Processing updated post:', postData.title);
      // Add your post update logic here
      return { success: true, message: 'Post update processed' };
    } catch (error) {
      console.error('Error handling post update webhook:', error);
      throw error;
    }
  }
}

export const webhookService = new WebhookService(); 
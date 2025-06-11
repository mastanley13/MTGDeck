import express from 'express';
import { webhookService } from '../services/webhookService.js';

const router = express.Router();

// Middleware to verify webhook signature
const verifyWebhook = (req, res, next) => {
  const signature = req.headers['x-webhook-signature'];
  
  if (!signature) {
    return res.status(401).json({ error: 'No webhook signature provided' });
  }

  if (!webhookService.verifySignature(signature, req.body)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  next();
};

// Handle new post creation
router.post('/blog/new', verifyWebhook, async (req, res) => {
  try {
    const result = await webhookService.handleNewPost(req.body);
    res.json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Handle post publish
router.post('/blog/publish', verifyWebhook, async (req, res) => {
  try {
    const result = await webhookService.handlePostPublish(req.body);
    res.json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Handle post update
router.post('/blog/update', verifyWebhook, async (req, res) => {
  try {
    const result = await webhookService.handlePostUpdate(req.body);
    res.json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

export default router; 
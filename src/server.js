import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import webhookRoutes from './api/webhookRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/webhooks', webhookRoutes);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Webhook URL: http://localhost:${port}/api/webhooks/blog`);
}); 
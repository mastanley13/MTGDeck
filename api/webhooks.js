import express from 'express';
import cors from 'cors';
import webhookRoutes from '../src/api/webhookRoutes.js';

// Express setup for Vercel serverless functions
const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://aidecktutor.com', 'https://www.aidecktutor.com']
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Version']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Use the webhook routes directly
app.use('/', webhookRoutes);

// Export for Vercel serverless functions
export default app;
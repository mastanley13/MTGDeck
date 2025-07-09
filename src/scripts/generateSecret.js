import crypto from 'crypto';

// Generate a random 32-byte hex string
const webhookSecret = crypto.randomBytes(32).toString('hex');

console.log('\nYour Webhook Secret:');
console.log('----------------------------------------');
console.log(webhookSecret);
console.log('----------------------------------------');
console.log('\nAdd this to your .env file as:');
console.log('VITE_GHL_WEBHOOK_SECRET=' + webhookSecret); 
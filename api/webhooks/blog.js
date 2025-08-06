export default function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Process webhook
      const data = req.body;
      console.log('Received blog webhook:', data);
      
      // Return success
      return res.status(200).json({ success: true, message: 'Webhook received' });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  } else {
    // Method not allowed
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
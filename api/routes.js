export default function handler(req, res) {
  res.status(200).json({
    message: 'AIDeckTutor API',
    endpoints: [
      '/api/health',
      '/api/webhooks'
    ],
    version: '1.0.0'
  });
}
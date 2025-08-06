export default function handler(req, res) {
  res.status(200).json({
    message: 'AIDeckTutor API',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString()
  });
}
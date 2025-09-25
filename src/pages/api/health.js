export default function handler(req, res) {
  if (req.method === 'GET') {
    res.json({ status: 'OK', message: 'OrbitOS API is running' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
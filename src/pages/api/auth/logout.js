import { clearAuthCookie } from '../../../lib/cookies';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Set-Cookie', clearAuthCookie());
  res.json({ message: 'Logged out successfully' });
}

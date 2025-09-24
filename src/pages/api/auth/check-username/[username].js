import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { username } = req.query;
    const user = await User.findOne({ username });
    res.json({ available: !user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}
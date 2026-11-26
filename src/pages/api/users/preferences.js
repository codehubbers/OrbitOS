import dbConnect from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
  } catch (error) {
    console.error('Preferences API: database unavailable:', error.message);
    return res
      .status(503)
      .json({ error: 'Preferences storage is unavailable' });
  }

  try {
    const user = await verifyToken(req);
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({ error: 'Preferences data is required' });
    }

    // Update user preferences
    await User.findByIdAndUpdate(user._id, { preferences });

    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

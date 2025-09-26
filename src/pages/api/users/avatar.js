import dbConnect from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';
import User from '../../../models/User';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyToken(req);
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ error: 'Avatar data is required' });
    }

    // Update user avatar
    const updatedUser = await User.findByIdAndUpdate(user._id, { avatar }, { new: true });
    console.log('Avatar updated for user:', user._id, 'New avatar length:', avatar.length);
    console.log('Updated user avatar field:', updatedUser.avatar ? 'Set' : 'Not set');

    res.json({ message: 'Avatar updated successfully' });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
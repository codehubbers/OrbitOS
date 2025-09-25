import dbConnect from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';
import User from '../../../models/User';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      await verifyToken(req);
      const users = await User.find({ isActive: true }).select('-passwordHash');
      res.json(users);
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
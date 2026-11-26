import dbConnect from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';
import { isAuthError } from '../../../lib/authErrors';
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

  let user;
  try {
    user = await verifyToken(req);
  } catch (error) {
    if (isAuthError(error)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.error('Preferences API: could not verify session:', error.message);
    return res.status(500).json({ error: 'Failed to verify session' });
  }

  const { preferences } = req.body || {};
  if (!preferences) {
    return res.status(400).json({ error: 'Preferences data is required' });
  }

  try {
    await User.findByIdAndUpdate(user._id, { preferences });
    return res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    // A database hiccup isn't an auth problem: don't tell the client to sign in.
    console.error('Preferences API: save failed:', error.message);
    return res.status(500).json({ error: 'Failed to save preferences' });
  }
}

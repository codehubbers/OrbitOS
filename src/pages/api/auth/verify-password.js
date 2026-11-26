// POST /api/auth/verify-password (#98)
//
// Unlocks the lock screen. The password is always checked here on the
// server with User#comparePassword (bcrypt); the client never compares
// anything itself.
//
// TODO(#98, help wanted): wrap with withRateLimit from #136 once it lands,
// e.g. 5 failed attempts / 15 min per user, resetOnSuccess: true.

import dbConnect from '../../../lib/mongodb';
import { hasLocalAdminSession, verifyToken } from '../../../lib/auth';
import { isAuthError } from '../../../lib/authErrors';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  if (typeof password !== 'string' || !password || password.length > 128) {
    return res.status(400).json({ error: 'Password is required' });
  }

  // The local dev admin has no stored password and no database record
  // (localhost + NEXT_PUBLIC_ENABLE_LOCAL_ADMIN only), so unlock it without
  // touching the database.
  if (hasLocalAdminSession(req)) {
    return res.json({ ok: true });
  }

  try {
    await dbConnect();
  } catch (error) {
    console.error('verify-password: database unavailable:', error.message);
    return res.status(503).json({ error: 'Unlock is unavailable right now' });
  }

  let sessionUser;
  try {
    sessionUser = await verifyToken(req);
  } catch (error) {
    if (isAuthError(error)) {
      return res.status(401).json({ error: 'Not signed in' });
    }
    console.error('verify-password: session lookup failed:', error.message);
    return res.status(500).json({ error: 'Failed to verify session' });
  }

  try {
    // verifyToken drops passwordHash, so load it again for the comparison.
    const user = await User.findById(sessionUser._id);
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Wrong password' });
    }
    return res.json({ ok: true });
  } catch (error) {
    console.error('verify-password: check failed:', error.message);
    return res.status(500).json({ error: 'Failed to check password' });
  }
}

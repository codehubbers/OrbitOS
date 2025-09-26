import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { generateToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email, isActive: true });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    
    // Set createdAt if it doesn't exist (for existing users)
    if (!user.createdAt) {
      user.createdAt = new Date();
    }
    
    await user.save();

    const token = generateToken(user._id);
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=${maxAge / 1000}; SameSite=Strict`);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        createdAt: user.createdAt,
        preferences: user.preferences
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
}
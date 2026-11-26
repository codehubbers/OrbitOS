import { body } from 'express-validator';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { generateToken } from '../../../lib/auth';
import { authCookie } from '../../../lib/cookies';
import { getClientIp, withRateLimit } from '../../../middleware/withRateLimit';
import { withValidation } from '../../../middleware/withValidation';

export const LOGIN_LIMIT = { windowMs: 15 * 60 * 1000, max: 5 };

const rules = [
  body('email')
    .isString()
    .withMessage('Email must be text')
    .bail()
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Enter a valid email address')
    .isLength({ max: 254 }),
  body('password')
    .isString()
    .withMessage('Password must be text')
    .bail()
    .isLength({ min: 1, max: 128 })
    .withMessage('Password is required (max 128 characters)'),
  body('rememberMe').optional().isBoolean().toBoolean(),
];

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    // Validated above: both are plain strings, so they can't carry
    // MongoDB operators like {"$ne": null}.
    const { email, password, rememberMe } = req.body;

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
    const maxAgeSeconds = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

    res.setHeader('Set-Cookie', authCookie(token, maxAgeSeconds));

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        createdAt: user.createdAt,
        preferences: user.preferences,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
}

const loginKey = (req) => {
  const email = req.body?.email;
  const normalized =
    typeof email === 'string' ? email.trim().toLowerCase() : '';
  return `${getClientIp(req)}|${normalized}`;
};

// Rate limit first (per IP + email; a successful login clears the bucket,
// so only failed attempts count), then validate, then the handler.
export default withRateLimit(withValidation(rules)(handler), {
  name: 'login',
  ...LOGIN_LIMIT,
  methods: ['POST'],
  resetOnSuccess: true,
  key: loginKey,
});

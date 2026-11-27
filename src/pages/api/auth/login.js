import { body } from 'express-validator';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { generateToken } from '../../../lib/auth';
import { authCookie } from '../../../lib/cookies';
import { clientKey, withRateLimit } from '../../../middleware/withRateLimit';
import { withValidation } from '../../../middleware/withValidation';

export const LOGIN_LIMIT = { windowMs: 15 * 60 * 1000, max: 5 };
// Failed logins per IP across all emails, so one client can't spray
// passwords over many accounts (5 tries each would otherwise be unlimited).
export const LOGIN_IP_LIMIT = { windowMs: 15 * 60 * 1000, max: 20 };

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
  // Validation runs after the limiter, so cap the length here: an oversized
  // value shares one bucket instead of making the key arbitrarily large.
  const normalized =
    typeof email === 'string' && email.length <= 254
      ? email.trim().toLowerCase()
      : '';
  return `${clientKey(req)}|${normalized}`;
};

// Rate limits first, then validate, then the handler:
// - per IP: 20 failed logins / 15 min over all emails (successes don't count
//   and don't clear it). Checked first, so a blocked client creates no
//   per-email buckets.
// - per IP + email: 5 failed / 15 min; a successful login clears it.
const perEmail = withRateLimit(withValidation(rules)(handler), {
  name: 'login',
  ...LOGIN_LIMIT,
  methods: ['POST'],
  resetOnSuccess: true,
  key: loginKey,
});

export default withRateLimit(perEmail, {
  name: 'login-ip',
  ...LOGIN_IP_LIMIT,
  methods: ['POST'],
  skipSuccessful: true,
});

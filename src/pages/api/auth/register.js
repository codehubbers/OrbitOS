import { body } from 'express-validator';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { generateToken } from '../../../lib/auth';
import { authCookie } from '../../../lib/cookies';
import { withRateLimit } from '../../../middleware/withRateLimit';
import { USERNAME, withValidation } from '../../../middleware/withValidation';

export const REGISTER_LIMIT = { windowMs: 60 * 60 * 1000, max: 3 };

const rules = [
  body('username')
    .isString()
    .withMessage('Username must be text')
    .bail()
    .trim()
    .matches(USERNAME)
    .withMessage(
      'Username must be 3-30 characters: letters, numbers, dot, dash or underscore',
    ),
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
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be 6-128 characters'),
  body('displayName')
    .optional({ values: 'falsy' })
    .isString()
    .bail()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Display name can be at most 50 characters'),
];

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { username, email, password, displayName } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        error:
          existingUser.email === email
            ? 'Email already registered'
            : 'Username already taken',
      });
    }

    const user = new User({
      username,
      email,
      passwordHash: password,
      displayName: displayName || username,
    });

    await user.save();

    const token = generateToken(user._id);

    res.setHeader('Set-Cookie', authCookie(token, 7 * 24 * 60 * 60));

    res.status(201).json({
      message: 'User registered successfully',
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
    res.status(500).json({ error: 'Server error during registration' });
  }
}

export default withRateLimit(withValidation(rules)(handler), {
  name: 'register',
  ...REGISTER_LIMIT,
  methods: ['POST'],
});

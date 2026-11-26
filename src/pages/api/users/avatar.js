import dbConnect from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';
import User from '../../../models/User';
import { body } from 'express-validator';
import { withValidation } from '../../../middleware/withValidation';

// Avatars are stored as image data URLs. Reject anything else (for example
// a javascript: URL or an SVG, which can carry scripts).
const AVATAR = /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i;

const rules = [
  body('avatar')
    .isString()
    .withMessage('Avatar must be text')
    .bail()
    .matches(AVATAR)
    .withMessage('Avatar must be a PNG, JPEG, GIF or WebP image'),
];

async function handler(req, res) {
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
    await User.findByIdAndUpdate(user._id, { avatar });

    res.json({ message: 'Avatar updated successfully' });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

const validated = withValidation(rules)(handler);
export default function avatarRoute(req, res) {
  return req.method === 'PUT' ? validated(req, res) : handler(req, res);
}

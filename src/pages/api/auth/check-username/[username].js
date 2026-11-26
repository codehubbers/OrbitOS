import { param } from 'express-validator';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { withRateLimit } from '../../../../middleware/withRateLimit';
import {
  USERNAME,
  withValidation,
} from '../../../../middleware/withValidation';

const rules = [
  param('username')
    .isString()
    .bail()
    .matches(USERNAME)
    .withMessage(
      'Username must be 3-30 characters: letters, numbers, dot, dash or underscore',
    ),
];

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { username } = req.params;
    const user = await User.findOne({ username });
    res.json({ available: !user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}

const validated = withValidation(rules)(handler);

// Next.js puts dynamic route segments in req.query, while express-validator's
// param() reads req.params, so mirror it before validating.
function withParams(req, res) {
  req.params = { username: req.query?.username };
  return validated(req, res);
}

// The register form checks availability as you type (debounced 500 ms), so
// allow a generous 60/min per IP while still slowing username enumeration.
export default withRateLimit(withParams, {
  name: 'check-username',
  windowMs: 60 * 1000,
  max: 60,
});

// Request validation for Next.js API routes using express-validator (#104).
//
// express-validator chains work on any object with body/query/params, so
// they run fine on Next's req. Usage:
//
//   import { body } from 'express-validator';
//   export default withValidation([
//     body('email').isString().trim().isEmail().normalizeEmail(...),
//   ])(handler);
//
// On failure the route answers 400 with a consistent shape:
//   { error: 'Invalid request', details: [{ field, message }] }
// Sanitisers in the chain (trim, toLowerCase...) update req.body/req.query
// in place, so the handler sees the cleaned values.

import { validationResult } from 'express-validator';

export const withValidation = (rules) => (handler) =>
  async function validated(req, res) {
    for (const rule of rules) {
      await rule.run(req);
    }
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({
        error: 'Invalid request',
        details: result
          .array({ onlyFirstError: true })
          .map((e) => ({ field: e.path, message: e.msg })),
      });
    }
    return handler(req, res);
  };

// Shared rules, so every route agrees on what a valid value is.
export const USERNAME = /^[a-zA-Z0-9_.-]{3,30}$/;
export const OBJECT_ID = /^[a-f0-9]{24}$/i;
export const PERMISSIONS = ['view', 'comment', 'edit'];

export default withValidation;

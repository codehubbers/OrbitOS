// Auth cookie helpers (#104): one place for the session cookie flags.
//
// HttpOnly: JavaScript can't read the token (limits XSS damage).
// SameSite=Strict: the cookie isn't sent on cross-site requests (CSRF).
// Secure: only sent over HTTPS. Off in development so http://localhost
// keeps working; on everywhere else.

import { serialize } from 'cookie';

const isSecure = () => process.env.NODE_ENV !== 'development';

export const authCookie = (token, maxAgeSeconds) =>
  serialize('token', token, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: 'strict',
    path: '/',
    maxAge: maxAgeSeconds,
  });

export const clearAuthCookie = () =>
  serialize('token', '', {
    httpOnly: true,
    secure: isSecure(),
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

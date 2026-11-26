// Errors that mean "the request isn't signed in", as opposed to a server or
// database failure. Kept separate from auth.js so tests that mock auth.js
// can still tell the two apart.
export class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
  }
}

const JWT_ERROR_NAMES = new Set([
  'JsonWebTokenError',
  'TokenExpiredError',
  'NotBeforeError',
]);

export const isAuthError = (error) =>
  error?.name === 'AuthError' || JWT_ERROR_NAMES.has(error?.name);

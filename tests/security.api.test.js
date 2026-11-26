// Tests for #104: rate limiting, input validation and cookie hardening.
import loginHandler, { LOGIN_LIMIT } from '@/pages/api/auth/login';
import registerHandler, { REGISTER_LIMIT } from '@/pages/api/auth/register';
import checkUsernameHandler from '@/pages/api/auth/check-username/[username]';
import documentShareHandler from '@/pages/api/documents/share';
import avatarHandler from '@/pages/api/users/avatar';
import {
  createMemoryStore,
  getClientIp,
  withRateLimit,
} from '@/middleware/withRateLimit';
import { authCookie, clearAuthCookie } from '@/lib/cookies';
import User from '@/models/User';

jest.mock('@/lib/mongodb', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/lib/auth', () => ({
  generateToken: jest.fn(() => 'signed-token'),
  verifyToken: jest.fn().mockResolvedValue({ _id: 'user-1' }),
}));
jest.mock('@/models/User', () => {
  const User = jest.fn(function User(data) {
    Object.assign(this, data, { _id: 'new-user' });
    this.save = jest.fn();
  });
  User.findOne = jest.fn();
  User.findByIdAndUpdate = jest.fn();
  return { __esModule: true, default: User };
});
jest.mock('@/models/Document', () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

let ipCounter = 0;
// Each test gets its own client IP so rate-limit buckets don't leak between
// tests (the limiter's store lives for the whole module).
const freshIp = () => `203.0.113.${++ipCounter}`;

function request({ method = 'POST', body = {}, query = {}, ip, headers = {} }) {
  return {
    method,
    body,
    query,
    headers,
    socket: { remoteAddress: ip ?? freshIp() },
  };
}

function response() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader: jest.fn((name, value) => {
      res.headers[name.toLowerCase()] = value;
    }),
    status: jest.fn((code) => {
      res.statusCode = code;
      return res;
    }),
    json: jest.fn((data) => {
      res.body = data;
      return res;
    }),
  };
  return res;
}

const call = async (handler, req) => {
  const res = response();
  await handler(req, res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('login rate limit', () => {
  it('returns 429 on the 6th failed login within 15 minutes', async () => {
    User.findOne.mockResolvedValue(null);
    const ip = freshIp();
    const body = { email: 'victim@example.com', password: 'wrong' };

    for (let i = 0; i < LOGIN_LIMIT.max; i++) {
      const res = await call(loginHandler, request({ body, ip }));
      expect(res.statusCode).toBe(401);
    }

    const res = await call(loginHandler, request({ body, ip }));
    expect(res.statusCode).toBe(429);
    expect(res.headers['retry-after']).toBeDefined();
    expect(res.body).toEqual({
      error: 'Too many attempts. Please wait and try again.',
      details: { retryAfter: expect.any(Number) },
    });
  });

  it('counts per email, so one attacked account does not lock out others', async () => {
    User.findOne.mockResolvedValue(null);
    const ip = freshIp();
    for (let i = 0; i <= LOGIN_LIMIT.max; i++) {
      await call(
        loginHandler,
        request({ body: { email: 'a@example.com', password: 'x' }, ip }),
      );
    }
    const res = await call(
      loginHandler,
      request({ body: { email: 'b@example.com', password: 'x' }, ip }),
    );
    expect(res.statusCode).toBe(401);
  });

  it('clears failed attempts after a successful login', async () => {
    const ip = freshIp();
    const body = { email: 'me@example.com', password: 'pw' };
    const user = {
      _id: 'u1',
      email: 'me@example.com',
      comparePassword: jest.fn(),
      save: jest.fn(),
    };
    User.findOne.mockResolvedValue(user);

    user.comparePassword.mockResolvedValue(false);
    for (let i = 0; i < LOGIN_LIMIT.max - 1; i++) {
      await call(loginHandler, request({ body, ip }));
    }
    user.comparePassword.mockResolvedValueOnce(true);
    expect((await call(loginHandler, request({ body, ip }))).statusCode).toBe(
      200,
    );

    // The bucket was reset, so a fresh run of failures is allowed again.
    for (let i = 0; i < LOGIN_LIMIT.max; i++) {
      const res = await call(loginHandler, request({ body, ip }));
      expect(res.statusCode).toBe(401);
    }
  });
});

describe('login validation', () => {
  it('rejects MongoDB operators instead of passing them to the query', async () => {
    const res = await call(
      loginHandler,
      request({ body: { email: { $ne: null }, password: { $ne: null } } }),
    );
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Invalid request');
    expect(res.body.details.map((d) => d.field)).toEqual(['email', 'password']);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('normalises the email before looking the user up', async () => {
    User.findOne.mockResolvedValue(null);
    await call(
      loginHandler,
      request({ body: { email: '  Me@Example.COM ', password: 'pw' } }),
    );
    expect(User.findOne).toHaveBeenCalledWith({
      email: 'me@example.com',
      isActive: true,
    });
  });

  it('sets a hardened session cookie on success', async () => {
    User.findOne.mockResolvedValue({
      _id: 'u1',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn(),
    });
    const res = await call(
      loginHandler,
      request({ body: { email: 'me@example.com', password: 'pw' } }),
    );
    const cookie = res.headers['set-cookie'];
    expect(cookie).toMatch(/^token=signed-token;/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Max-Age=86400/);
  });
});

describe('register', () => {
  const valid = () => ({
    username: `user_${ipCounter}`,
    email: `user${ipCounter}@example.com`,
    password: 'secret123',
  });

  it('returns 429 after 3 registrations per hour from one IP', async () => {
    User.findOne.mockResolvedValue(null);
    const ip = freshIp();
    for (let i = 0; i < REGISTER_LIMIT.max; i++) {
      const res = await call(registerHandler, request({ body: valid(), ip }));
      expect(res.statusCode).toBe(201);
    }
    const res = await call(registerHandler, request({ body: valid(), ip }));
    expect(res.statusCode).toBe(429);
  });

  it('returns 400 with details for malformed input', async () => {
    const res = await call(
      registerHandler,
      request({
        body: { username: 'a b<script>', email: 'nope', password: '123' },
      }),
    );
    expect(res.statusCode).toBe(400);
    expect(res.body.details.map((d) => d.field)).toEqual([
      'username',
      'email',
      'password',
    ]);
  });
});

describe('check-username', () => {
  it('returns 400 for usernames that could never be registered', async () => {
    const res = await call(
      checkUsernameHandler,
      request({ method: 'GET', query: { username: '{"$ne":null}' } }),
    );
    expect(res.statusCode).toBe(400);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('checks valid usernames', async () => {
    User.findOne.mockResolvedValue(null);
    const res = await call(
      checkUsernameHandler,
      request({ method: 'GET', query: { username: 'orbit_user' } }),
    );
    expect(res.body).toEqual({ available: true });
    expect(User.findOne).toHaveBeenCalledWith({ username: 'orbit_user' });
  });
});

describe('document sharing validation', () => {
  it('rejects an invalid ObjectId, email and permission', async () => {
    const res = await call(
      documentShareHandler,
      request({
        body: {
          documentId: { $gt: '' },
          userEmail: 'not-an-email',
          permission: 'owner',
        },
      }),
    );
    expect(res.statusCode).toBe(400);
    expect(res.body.details.map((d) => d.field)).toEqual([
      'documentId',
      'userEmail',
      'permission',
    ]);
  });
});

describe('avatar validation', () => {
  it('accepts a JPEG data URL', async () => {
    const res = await call(
      avatarHandler,
      request({
        method: 'PUT',
        body: { avatar: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' },
      }),
    );
    expect(res.statusCode).toBe(200);
  });

  it.each([
    'javascript:alert(1)',
    'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    'https://example.com/a.png',
  ])('rejects %s', async (avatar) => {
    const res = await call(
      avatarHandler,
      request({ method: 'PUT', body: { avatar } }),
    );
    expect(res.statusCode).toBe(400);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});

describe('getClientIp', () => {
  it('trusts cf-connecting-ip only when the request comes over loopback', () => {
    expect(
      getClientIp({
        socket: { remoteAddress: '127.0.0.1' },
        headers: { 'cf-connecting-ip': '198.51.100.7' },
      }),
    ).toBe('198.51.100.7');

    expect(
      getClientIp({
        socket: { remoteAddress: '198.51.100.9' },
        headers: { 'cf-connecting-ip': '1.2.3.4' },
      }),
    ).toBe('198.51.100.9');
  });

  it('never trusts x-forwarded-for', () => {
    expect(
      getClientIp({
        socket: { remoteAddress: '127.0.0.1' },
        headers: { 'x-forwarded-for': '1.2.3.4' },
      }),
    ).toBe('127.0.0.1');
  });
});

describe('withRateLimit', () => {
  it('opens a new window once the old one expires', async () => {
    let now = 0;
    const store = createMemoryStore({ now: () => now });
    const handler = withRateLimit((req, res) => res.json({ ok: true }), {
      name: 't',
      windowMs: 1000,
      max: 1,
      store,
    });
    const ip = freshIp();

    expect((await call(handler, request({ ip }))).statusCode).toBe(200);
    expect((await call(handler, request({ ip }))).statusCode).toBe(429);
    now = 1001;
    expect((await call(handler, request({ ip }))).statusCode).toBe(200);
  });

  it('only limits the listed methods', async () => {
    const handler = withRateLimit((req, res) => res.json({ ok: true }), {
      name: 'methods',
      windowMs: 1000,
      max: 0,
      methods: ['POST'],
      store: createMemoryStore(),
    });
    expect((await call(handler, request({ method: 'GET' }))).statusCode).toBe(
      200,
    );
    expect((await call(handler, request({ method: 'POST' }))).statusCode).toBe(
      429,
    );
  });
});

describe('auth cookie', () => {
  const env = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = env;
  });

  it('is Secure outside development', () => {
    process.env.NODE_ENV = 'production';
    expect(authCookie('t', 60)).toMatch(/; Secure/);
    expect(clearAuthCookie()).toMatch(/Max-Age=0/);
  });

  it('is not Secure in development so http://localhost works', () => {
    process.env.NODE_ENV = 'development';
    expect(authCookie('t', 60)).not.toMatch(/Secure/);
    expect(authCookie('t', 60)).toMatch(/HttpOnly; SameSite=Strict/);
  });
});

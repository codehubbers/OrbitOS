import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginForm from '@/components/auth/LoginForm';
import dbConnect from '@/lib/mongodb';
import {
  generateLocalAdminToken,
  isLocalAdminRequest,
  verifyToken,
} from '@/lib/auth';
import localAdminHandler from '@/pages/api/auth/local-admin';
import meHandler from '@/pages/api/auth/me';

const mockLoginLocalAdmin = jest.fn();

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
    loginLocalAdmin: mockLoginLocalAdmin,
  }),
}));

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
  };
}

function localRequest(method = 'POST') {
  return {
    method,
    headers: { host: 'localhost:3000', 'x-forwarded-for': '::1' },
    cookies: {},
    socket: { remoteAddress: '::1' },
  };
}

const originalNodeEnv = process.env.NODE_ENV;

describe('local admin authentication', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_ENABLE_LOCAL_ADMIN = 'true';
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('logs in a virtual admin without querying for a database account', async () => {
    const req = localRequest();
    const res = createResponse();
    await localAdminHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const { user, token: bodyToken } = res.json.mock.calls[0][0];
    expect(bodyToken).toBeUndefined();
    const cookie = res.setHeader.mock.calls.find(
      ([name]) => name === 'Set-Cookie',
    )[1];
    const token = cookie.match(/^token=([^;]+);/)[1];
    expect(user).toMatchObject({
      username: 'local-admin',
      email: 'admin@localhost',
      roles: ['admin'],
      isActive: true,
    });
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining(`token=${token}; HttpOnly;`),
    );

    const session = await verifyToken({
      ...localRequest('GET'),
      cookies: { token },
    });
    expect(session.roles).toEqual(['admin']);
    expect(dbConnect).not.toHaveBeenCalled();
  });

  it('restores the local admin session without connecting to MongoDB', async () => {
    const token = generateLocalAdminToken();
    const res = createResponse();
    await meHandler({ ...localRequest('GET'), cookies: { token } }, res);

    expect(dbConnect).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      user: expect.objectContaining({
        username: 'local-admin',
        roles: ['admin'],
        permissions: expect.objectContaining({ canDelete: true }),
      }),
    });
  });

  it('rejects remote requests even when forwarded headers claim localhost', async () => {
    const req = {
      ...localRequest(),
      socket: { remoteAddress: '192.0.2.10' },
      headers: { host: 'localhost:3000', 'x-forwarded-for': '127.0.0.1' },
    };
    const res = createResponse();
    await localAdminHandler(req, res);

    expect(isLocalAdminRequest(req)).toBe(false);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('rejects tunnelled requests that reach the server from loopback', async () => {
    const req = {
      ...localRequest(),
      headers: {
        host: 'abc123.ngrok-free.app',
        'x-forwarded-for': '203.0.113.7',
      },
    };
    const res = createResponse();
    await localAdminHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('rejects DNS-rebinding requests with a non-local Host header', () => {
    const req = { ...localRequest(), headers: { host: 'evil.example:3000' } };
    expect(isLocalAdminRequest(req)).toBe(false);
  });

  it('stays off in development unless explicitly enabled', async () => {
    delete process.env.NEXT_PUBLIC_ENABLE_LOCAL_ADMIN;
    const res = createResponse();
    await localAdminHandler(localRequest(), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('disables the endpoint and existing local tokens outside development', async () => {
    const token = generateLocalAdminToken();
    process.env.NODE_ENV = 'production';
    const res = createResponse();
    await localAdminHandler(localRequest(), res);

    expect(res.status).toHaveBeenCalledWith(404);
    await expect(
      verifyToken({ ...localRequest('GET'), cookies: { token } }),
    ).rejects.toThrow('Local admin sessions are only available on localhost');
  });

  it('offers one-click local admin login in the development login form', async () => {
    const onSuccess = jest.fn();
    const result = { user: { username: 'local-admin' } };
    mockLoginLocalAdmin.mockResolvedValue(result);
    render(<LoginForm onSuccess={onSuccess} onBack={jest.fn()} theme={{}} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Continue as Local Admin' }),
    );

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(result));
    expect(mockLoginLocalAdmin).toHaveBeenCalledTimes(1);
  });

  it('does not show the local admin button outside development', () => {
    process.env.NODE_ENV = 'production';
    render(<LoginForm onSuccess={jest.fn()} onBack={jest.fn()} theme={{}} />);
    expect(
      screen.queryByRole('button', { name: 'Continue as Local Admin' }),
    ).not.toBeInTheDocument();
  });
});

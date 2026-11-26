import handler from '@/pages/api/users/preferences';
import { AuthError } from '@/lib/authErrors';

jest.mock('@/lib/mongodb', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn().mockResolvedValue({ _id: 'user-1' }),
}));
jest.mock('@/models/User', () => ({
  __esModule: true,
  default: { findByIdAndUpdate: jest.fn() },
}));

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const put = (body = { preferences: {} }) => ({
  method: 'PUT',
  body,
  headers: {},
});

describe('PUT /api/users/preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('saves preferences and confirms it', async () => {
    const User = jest.requireMock('@/models/User').default;
    const res = createResponse();
    const preferences = { sound: { startupSound: true } };
    await handler(put({ preferences }), res);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user-1', {
      preferences,
    });
    expect(res.json).toHaveBeenCalledWith({
      message: 'Preferences updated successfully',
    });
  });

  it('returns 503 when the database is unavailable', async () => {
    const dbConnect = jest.requireMock('@/lib/mongodb').default;
    dbConnect.mockRejectedValueOnce(new Error('connect ECONNREFUSED'));
    const res = createResponse();
    await handler(put(), res);
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('returns 401 when not signed in', async () => {
    const { verifyToken } = jest.requireMock('@/lib/auth');
    verifyToken.mockRejectedValueOnce(new AuthError('No token provided'));
    const res = createResponse();
    await handler(put(), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 500, not 401, when saving fails after a healthy connect', async () => {
    const User = jest.requireMock('@/models/User').default;
    User.findByIdAndUpdate.mockRejectedValueOnce(
      new Error('MongoNetworkError'),
    );
    const res = createResponse();
    await handler(put(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('returns 500, not 401, when the session lookup hits a DB error', async () => {
    const { verifyToken } = jest.requireMock('@/lib/auth');
    verifyToken.mockRejectedValueOnce(new Error('MongoNetworkError'));
    const res = createResponse();
    await handler(put(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('returns 405 for other methods without touching the database', async () => {
    const dbConnect = jest.requireMock('@/lib/mongodb').default;
    const res = createResponse();
    await handler({ method: 'GET', headers: {} }, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(dbConnect).not.toHaveBeenCalled();
  });
});

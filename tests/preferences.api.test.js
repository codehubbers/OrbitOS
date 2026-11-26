import handler from '@/pages/api/users/preferences';

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

describe('PUT /api/users/preferences', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 503 instead of crashing when the database is unavailable', async () => {
    const dbConnect = jest.requireMock('@/lib/mongodb').default;
    dbConnect.mockRejectedValueOnce(new Error('connect ECONNREFUSED'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = createResponse();
    await handler(
      { method: 'PUT', body: { preferences: {} }, headers: {} },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('saves preferences for a signed-in user', async () => {
    const User = jest.requireMock('@/models/User').default;
    const res = createResponse();
    const preferences = { sound: { startupSound: true } };
    await handler({ method: 'PUT', body: { preferences }, headers: {} }, res);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user-1', {
      preferences,
    });
    expect(res.status).not.toHaveBeenCalled();
  });
});

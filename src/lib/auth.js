import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'orbitos-secret-key';
const LOCAL_ADMIN_ID = '000000000000000000000000';
const LOCAL_ADMIN_ISSUER = 'orbitos-local-admin';
const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

const getRequestToken = (req) =>
  req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;

export const isLocalAdminRequest = (req) => {
  const remoteAddress =
    req.socket?.remoteAddress || req.connection?.remoteAddress;
  return (
    process.env.NODE_ENV === 'development' &&
    LOOPBACK_ADDRESSES.has(remoteAddress)
  );
};

export const getLocalAdminUser = () => ({
  _id: LOCAL_ADMIN_ID,
  id: LOCAL_ADMIN_ID,
  username: 'local-admin',
  email: 'admin@localhost',
  displayName: 'Local Admin',
  avatar: null,
  roles: ['admin'],
  permissions: {
    canEdit: true,
    canShare: true,
    canDelete: true,
    maxFileSize: 10485760,
    allowedFileTypes: [],
  },
  preferences: {
    theme: 'light',
    wallpaper: '/backgrounds/orbit-default.jpg',
    notifications: true,
    weather: { unit: 'C' },
  },
  installedApps: [],
  isActive: true,
});

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const generateLocalAdminToken = () =>
  jwt.sign({ userId: LOCAL_ADMIN_ID, localAdmin: true }, JWT_SECRET, {
    expiresIn: '12h',
    issuer: LOCAL_ADMIN_ISSUER,
  });

const hasLocalAdminClaims = (decoded) =>
  decoded?.localAdmin === true &&
  decoded?.userId === LOCAL_ADMIN_ID &&
  decoded?.iss === LOCAL_ADMIN_ISSUER;

export const hasLocalAdminSession = (req) => {
  if (!isLocalAdminRequest(req)) return false;
  const token = getRequestToken(req);
  if (!token) return false;
  try {
    return hasLocalAdminClaims(jwt.verify(token, JWT_SECRET));
  } catch (error) {
    return false;
  }
};

export const verifyToken = async (req) => {
  const token = getRequestToken(req);
  if (!token) {
    throw new Error('No token provided');
  }

  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.localAdmin === true) {
    if (!isLocalAdminRequest(req) || !hasLocalAdminClaims(decoded)) {
      throw new Error('Local admin sessions are only available on localhost');
    }
    return getLocalAdminUser();
  }

  const user = await User.findById(decoded.userId).select('-passwordHash');
  if (!user || !user.isActive) {
    throw new Error('Invalid token or user not found');
  }

  return user;
};

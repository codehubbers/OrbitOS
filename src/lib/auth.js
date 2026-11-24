import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'orbitos-secret-key';
const LOCAL_ADMIN_ID = '000000000000000000000000';
const LOCAL_ADMIN_ISSUER = 'orbitos-local-admin';
const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

const getRequestToken = (req) =>
  req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;

// A tunnel (ngrok, cloudflared...) connects to the dev server from 127.0.0.1,
// so the socket address alone does not prove the user is local. Next.js
// itself adds x-forwarded-for/x-forwarded-host with the real client values,
// so every forwarded hop and host must also be loopback.
const BLOCKED_PROXY_HEADERS = ['forwarded', 'x-real-ip', 'cf-connecting-ip'];
const LOOPBACK_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

const isLoopbackList = (value) =>
  String(value)
    .split(',')
    .every((ip) => LOOPBACK_ADDRESSES.has(ip.trim()));

export const isLocalAdminEnabled = () =>
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_ENABLE_LOCAL_ADMIN === 'true';

export const isLocalAdminRequest = (req) => {
  if (!isLocalAdminEnabled()) return false;
  const headers = req.headers || {};
  const remoteAddress =
    req.socket?.remoteAddress || req.connection?.remoteAddress;
  if (!LOOPBACK_ADDRESSES.has(remoteAddress)) return false;
  if (BLOCKED_PROXY_HEADERS.some((name) => headers[name] !== undefined)) {
    return false;
  }
  const forwardedFor = headers['x-forwarded-for'];
  if (forwardedFor !== undefined && !isLoopbackList(forwardedFor)) return false;
  const forwardedHost = headers['x-forwarded-host'];
  if (forwardedHost !== undefined && !LOOPBACK_HOST.test(forwardedHost)) {
    return false;
  }
  // Host check blocks DNS-rebinding pages that resolve to 127.0.0.1.
  return LOOPBACK_HOST.test(headers.host || '');
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

import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'orbitos-secret-key';

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = async (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;
  
  if (!token) {
    throw new Error('No token provided');
  }

  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await User.findById(decoded.userId).select('-passwordHash');
  
  if (!user || !user.isActive) {
    throw new Error('Invalid token or user not found');
  }

  return user;
};
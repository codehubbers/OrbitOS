// src/pages/api/apps/uninstall.js

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await dbConnect();

    const { appId } = req.body;

    await User.findByIdAndUpdate(decoded.userId, {
      $pull: { installedApps: { appId } },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Uninstall error:', error);
    res.status(500).json({ error: 'Failed to uninstall app' });
  }
}

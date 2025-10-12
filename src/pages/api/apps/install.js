// src/pages/api/apps/install.js

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

    const { appId, manifest, downloadUrl } = req.body;

    console.log('Finding user:', decoded.userId);
    const user = await User.findById(decoded.userId);
    console.log('User found:', user ? 'yes' : 'no');
    console.log('Current installedApps:', user.installedApps);

    if (!user.installedApps) {
      user.installedApps = [];
      await user.save();
      console.log('Initialized and saved installedApps array');
    }

    // Remove duplicates and keep latest version
    const cleanedApps = [];
    const appMap = new Map();

    // First pass: collect latest version of each app
    for (const app of user.installedApps) {
      const existing = appMap.get(app.appId);
      if (
        !existing ||
        new Date(app.installedAt) > new Date(existing.installedAt)
      ) {
        appMap.set(app.appId, app);
      }
    }

    // Convert map back to array
    user.installedApps = Array.from(appMap.values());

    // Check if app is already installed
    const existingApp = user.installedApps.find((app) => app.appId === appId);
    console.log('App already installed:', existingApp ? 'yes' : 'no');

    if (!existingApp) {
      user.installedApps.push({
        appId,
        manifest,
        downloadUrl,
        installedAt: new Date(),
      });
      console.log('Added app to installedApps, saving user...');
    } else {
      // Update existing app with latest manifest
      existingApp.manifest = manifest;
      existingApp.downloadUrl = downloadUrl;
      existingApp.installedAt = new Date();
      console.log('Updated existing app with latest version');
    }

    const savedUser = await user.save();
    console.log(
      'User saved successfully:',
      savedUser.installedApps.length,
      'apps',
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Install error:', error);
    res.status(500).json({ error: 'Failed to install app' });
  }
}

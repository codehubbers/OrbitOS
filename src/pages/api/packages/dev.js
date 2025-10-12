// src/pages/api/packages/dev.js

import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (process.env.NODE_ENV !== 'development') {
    return res
      .status(403)
      .json({ error: 'Dev packages only allowed in development' });
  }

  const { path: folderPath } = req.query;

  if (!folderPath) {
    return res.status(400).json({ error: 'Folder path required' });
  }

  try {
    const manifestPath = path.join(folderPath, 'orbit.json');
    const mainPath = path.join(folderPath, 'App.jsx');

    if (!fs.existsSync(manifestPath)) {
      return res.status(400).json({ error: 'orbit.json not found' });
    }

    if (!fs.existsSync(mainPath)) {
      return res.status(400).json({ error: 'App.jsx not found' });
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const code = fs.readFileSync(mainPath, 'utf8');

    res.status(200).json({
      manifest,
      code,
      isDev: true,
    });
  } catch (error) {
    console.error('Error loading dev package:', error);
    res.status(500).json({ error: 'Failed to load dev package' });
  }
}

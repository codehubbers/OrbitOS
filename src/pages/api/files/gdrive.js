// src/pages/api/files/gdrive.js

import { google } from 'googleapis';
import * as cookie from 'cookie';

export default async function handler(req, res) {
  try {
    // --- THIS IS THE FIX ---
    // Create a new, clean OAuth2 client for EVERY request.
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/api/auth/google/callback',
    );

    const cookies = cookie.parse(req.headers.cookie || '');
    const accessToken = cookies.gdrive_token;

    if (!accessToken) {
      return res.status(401).json({ error: 'Not authenticated with Google' });
    }

    // Set the credentials for this specific request's client instance.
    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const response = await drive.files.list({
      pageSize: 100,
      fields: 'files(id, name, mimeType, modifiedTime, iconLink, webViewLink)',
      q: "'root' in parents and trashed = false",
    });

    res.status(200).json(response.data.files);
  } catch (error) {
    // Add a log so we can see any future errors in the terminal
    console.error('Error in /api/files/gdrive:', error);
    res.status(500).json({ error: 'Failed to list files from Google Drive' });
  }
}

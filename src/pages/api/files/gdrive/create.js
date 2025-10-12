// src/pages/api/files/gdrive/create.js
import { google } from 'googleapis';
import * as cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/api/auth/google/callback',
    );
    const cookies = cookie.parse(req.headers.cookie || '');
    const accessToken = cookies.gdrive_token;
    if (!accessToken)
      return res.status(401).json({ error: 'Not authenticated' });

    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const { name, content } = req.body;

    const fileMetadata = {
      name: name,
      mimeType: 'text/plain',
    };
    const media = {
      mimeType: 'text/plain',
      body: content || '',
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name',
    });

    res.status(201).json({ file: file.data });
  } catch (error) {
    console.error('Error creating Google Drive file:', error);
    res.status(500).json({ error: 'Failed to create file' });
  }
}

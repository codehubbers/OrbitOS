// src/pages/api/files/gdrive/[fileId].js
import { google } from 'googleapis';
import * as cookie from 'cookie';

export default async function handler(req, res) {
  const { fileId } = req.query;
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

    if (req.method === 'GET') {
      const fileRes = await drive.files.get({ fileId: fileId, alt: 'media' });
      res.status(200).json({ content: fileRes.data });
    } else if (req.method === 'PUT') {
      const { content } = req.body;
      const media = {
        mimeType: 'text/plain',
        body: content,
      };
      await drive.files.update({
        fileId: fileId,
        media: media,
      });
      res.status(200).json({ message: 'File saved successfully' });
    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error(`Error with file ${fileId}:`, error);
    res.status(500).json({ error: 'Failed to process file request' });
  }
}

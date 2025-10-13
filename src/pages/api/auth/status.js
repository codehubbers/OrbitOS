// src/pages/api/auth/status.js
import { google } from 'googleapis';
import * as cookie from 'cookie';

function getCallbackUrl(req) {
  const protocol =
    req.headers['x-forwarded-proto'] ||
    (req.connection.encrypted ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}/api/auth/google/callback`;
}

export default async function handler(req, res) {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const accessToken = cookies.gdrive_token;

    if (!accessToken) {
      return res.status(200).json({ connected: false });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      getCallbackUrl(req),
    );

    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Test app data folder access
    await drive.files.list({
      q: "name='test'",
      spaces: 'appDataFolder',
      pageSize: 1,
    });

    res.status(200).json({ connected: true, hasAppDataAccess: true });
  } catch (error) {
    res.status(200).json({ connected: false, hasAppDataAccess: false });
  }
}

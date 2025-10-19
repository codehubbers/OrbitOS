// src/pages/api/auth/google/me.js

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
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      getCallbackUrl(req),
    );

    const cookies = cookie.parse(req.headers.cookie || '');
    const accessToken = cookies.gdrive_token;

    if (!accessToken) {
      return res.status(401).json({ error: 'Not authenticated with Google' });
    }

    oauth2Client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });

    // Fetch the user's profile information
    const userInfo = await oauth2.userinfo.get();

    res.status(200).json({ email: userInfo.data.email });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user info from Google' });
  }
}

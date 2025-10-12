import { google } from 'googleapis';
import * as cookie from 'cookie';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/api/auth/google/callback',
);

export default async function handler(req, res) {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.setHeader(
      'Set-Cookie',
      cookie.serialize('gdrive_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 3600, // 1 hour
        sameSite: 'lax',
        path: '/',
      }),
    );
    res.redirect('/');
  } catch (error) {
    console.error('Error authenticating with Google:', error);
    res.redirect('/?error=google_auth_failed');
  }
}

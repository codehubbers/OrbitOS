import * as cookie from 'cookie';

export default function handler(req, res) {
  res.setHeader(
    'Set-Cookie',
    cookie.serialize('gdrive_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: -1,
      sameSite: 'lax',
      path: '/',
    }),
  );
  res.status(200).json({ message: 'Logged out successfully' });
}

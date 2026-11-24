import {
  generateLocalAdminToken,
  getLocalAdminUser,
  isLocalAdminEnabled,
  isLocalAdminRequest,
} from '../../../lib/auth';

export default async function handler(req, res) {
  if (!isLocalAdminEnabled()) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (!isLocalAdminRequest(req)) {
    return res.status(403).json({
      error: 'Local admin login is only available from localhost',
    });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = generateLocalAdminToken();
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader(
    'Set-Cookie',
    `token=${token}; HttpOnly; Path=/; Max-Age=43200; SameSite=Strict`,
  );
  return res.status(200).json({
    message: 'Local admin login successful',
    user: getLocalAdminUser(),
  });
}

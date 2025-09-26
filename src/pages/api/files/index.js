import dbConnect from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  await dbConnect();

  try {
    const user = await verifyToken(req);

    if (req.method === 'GET') {
      res.json({ files: [], message: 'File system not implemented yet' });
    } else if (req.method === 'POST') {
      res.json({ message: 'File upload not implemented yet' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
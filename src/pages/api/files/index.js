import dbConnect from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';
import File from '../../../models/File'; // You'll need to create this model

// Audio is uploaded as a base64 data URL; an 8 MB file is ~10.7 MB encoded.
// Stays below MongoDB's 16 MB document limit.
export const config = {
  api: { bodyParser: { sizeLimit: '12mb' } },
};

const MIME_TYPE = /^[a-z0-9][\w.+-]{0,63}\/[a-z0-9][\w.+-]{0,63}$/i;

export function isValidMimeType(value) {
  return typeof value === 'string' && MIME_TYPE.test(value);
}

export default async function handler(req, res) {
  try {
    await dbConnect();
  } catch (error) {
    console.error('Files API: database unavailable:', error.message);
    return res.status(503).json({ error: 'File storage is unavailable' });
  }

  let user;
  try {
    user = await verifyToken(req);
  } catch (error) {
    return res.status(401).json({ error: 'Not signed in' });
  }

  if (req.method === 'GET') {
    // List files for the File Manager and Document Picker
    try {
      const files = await File.find({
        $or: [{ owner: user._id }, { 'collaborators.user': user._id }],
      }).populate('owner', 'username _id'); // Include _id in populate

      // ?meta=1 returns metadata only (no content) — used by apps that
      // scan the library, such as the Music Player.
      if (req.query.meta === '1') {
        return res.json({
          files: files.map((f) => {
            const obj = f.toObject();
            delete obj.content;
            return obj;
          }),
        });
      }

      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch files' });
    }
  } else if (req.method === 'POST') {
    // Create or update a file (Save/Save As)
    try {
      const { id, name, content, mimeType } = req.body;
      if (mimeType !== undefined && !isValidMimeType(mimeType)) {
        return res.status(400).json({ error: 'Invalid mimeType' });
      }

      if (id) {
        // Update existing file
        const file = await File.findOneAndUpdate(
          {
            _id: id,
            $or: [
              { owner: user._id },
              {
                'collaborators.user': user._id,
                'collaborators.permission': 'edit',
              },
            ],
          },
          {
            content,
            lastModified: new Date(),
            ...(mimeType ? { mimeType } : {}),
          },
          { new: true },
        );
        if (!file) {
          return res
            .status(404)
            .json({ error: 'File not found or no edit permission' });
        }
        res.json({ message: 'File saved', file });
      } else {
        // Create new file
        const newFile = new File({
          name,
          content,
          owner: user._id,
          ...(mimeType ? { mimeType } : {}),
        });
        await newFile.save();
        res.status(201).json({ message: 'File created', file: newFile });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to save file' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

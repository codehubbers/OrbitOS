import dbConnect from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';
import File from '../../../models/File'; // You'll need to create this model

export default async function handler(req, res) {
  await dbConnect();
  const user = await verifyToken(req);

  if (req.method === 'GET') {
    // List files for the File Manager and Document Picker
    try {
      const files = await File.find({
        $or: [{ owner: user._id }, { 'collaborators.user': user._id }],
      }).populate('owner', 'username _id'); // Include _id in populate
      
      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch files' });
    }
  } else if (req.method === 'POST') {
    // Create or update a file (Save/Save As)
    try {
      const { id, name, content } = req.body;

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
          { content, lastModified: new Date() },
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

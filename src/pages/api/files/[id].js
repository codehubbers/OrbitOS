// src/pages/api/files/[id].js
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import File from '@/models/File';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyToken(req);
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    // Find the file
    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if user is the owner
    if (file.owner.toString() === user._id.toString()) {
      // User is owner - delete the file completely
      await File.findByIdAndDelete(id);
      return res.status(200).json({ 
        message: 'File deleted successfully',
        deletedFile: file 
      });
    }

    // Check if user is a collaborator
    const collaboratorIndex = file.collaborators.findIndex(
      collab => collab.user.toString() === user._id.toString()
    );

    if (collaboratorIndex !== -1) {
      // User is collaborator - remove them from collaborators (unshare)
      file.collaborators.splice(collaboratorIndex, 1);
      await file.save();
      
      return res.status(200).json({ 
        message: 'File unshared successfully',
        unsharedFile: file 
      });
    }

    // User has no access to the file
    return res.status(403).json({ error: 'Access denied' });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
}
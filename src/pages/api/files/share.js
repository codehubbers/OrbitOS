// src/pages/api/files/share.js
import dbConnect from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';
import File from '../../../models/File';
import User from '../../../models/User';

export default async function handler(req, res) {
  // Ensure this is a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();

  try {
    // 1. Authenticate the user making the request
    const user = await verifyToken(req);

    // 2. Extract data from the request body
    const { documentId, userEmail, permission } = req.body;

    // 3. Validate required fields
    if (!userEmail || !permission || !documentId) {
      return res
        .status(400)
        .json({
          error: 'Missing required fields: userEmail, permission, documentId',
        });
    }

    // 4. Find the file/document and verify the current user has rights to share it
    const file = await File.findOne({ _id: documentId, owner: user._id });
    if (!file) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    // 5. Find the user to share with by email
    const targetUser = await User.findOne({ email: userEmail });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 6. Check if already a collaborator
    const existingCollab = file.collaborators.find(
      (collab) => collab.user.toString() === targetUser._id.toString(),
    );

    if (existingCollab) {
      // Update existing permission
      existingCollab.permission = permission;
    } else {
      // Add new collaborator
      file.collaborators.push({
        user: targetUser._id,
        permission,
      });
    }

    // 7. Save the updated file
    await file.save();

    res.status(200).json({
      message: `File shared successfully with ${userEmail}`,
      file: {
        id: file._id,
        name: file.name,
        collaborators: file.collaborators,
      },
    });
  } catch (error) {
    console.error('Share API error:', error);
    res.status(500).json({ error: 'Internal server error during sharing' });
  }
}

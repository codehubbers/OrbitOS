// src/pages/api/documents/share.js
import dbConnect from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';
import Document from '../../../models/Document';
import User from '../../../models/User';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyToken(req);
    const { documentId, userEmail, permission } = req.body;

    // Validate required fields
    if (!documentId || !userEmail || !permission) {
      return res
        .status(400)
        .json({
          error: 'Missing required fields: documentId, userEmail, permission',
        });
    }

    // Find the document and verify ownership
    const document = await Document.findOne({
      _id: documentId,
      owner: user._id,
    });
    if (!document) {
      return res
        .status(404)
        .json({ error: 'Document not found or access denied' });
    }

    // Find the user to share with
    const targetUser = await User.findOne({ email: userEmail });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already a collaborator
    const existingCollab = document.collaborators.find(
      (c) => c.user.toString() === targetUser._id.toString(),
    );

    if (existingCollab) {
      existingCollab.permission = permission;
    } else {
      document.collaborators.push({
        user: targetUser._id,
        permission,
      });
    }

    await document.save();

    res.json({
      message: `Document shared with ${userEmail}`,
      document: {
        id: document._id,
        title: document.title,
        collaborators: document.collaborators,
      },
    });
  } catch (error) {
    console.error('Document share error:', error);
    res.status(500).json({ error: 'Server error during sharing' });
  }
}

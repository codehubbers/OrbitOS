// src/pages/api/files/download.js
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

// Simple in-memory storage for files (replace with your actual database logic)
let fileStorage = new Map();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const user = await verifyToken(req);
    const { file: filename } = req.query;

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    // Get files from the database endpoint
    const dbResponse = await fetch(`${getBaseUrl(req)}/api/files/database`, {
      headers: {
        'Cookie': req.headers.cookie || ''
      }
    });

    if (!dbResponse.ok) {
      throw new Error('Failed to fetch files from database');
    }

    const files = await dbResponse.json();
    const file = files.find(f => f.name === filename);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Send file content
    res.status(200).send(file.content || '');
  } catch (error) {
    console.error('Download error:', error);
    
    // Fallback: try to get file from localStorage data
    try {
      const files = JSON.parse(localStorage.getItem('orbitos-files') || '[]');
      const file = files.find(f => f.name === filename);
      
      if (file) {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.status(200).send(file.content || '');
      }
    } catch (fallbackError) {
      console.error('Fallback download also failed:', fallbackError);
    }
    
    res.status(500).json({ error: 'Failed to download file' });
  }
}

function getBaseUrl(req) {
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  return `${protocol}://${host}`;
}
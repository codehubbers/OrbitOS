// src/pages/api/files/database.js
import { google } from 'googleapis';
import * as cookie from 'cookie';

function getCallbackUrl(req) {
  const protocol =
    req.headers['x-forwarded-proto'] ||
    (req.connection.encrypted ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}/api/auth/google/callback`;
}

// In-memory database (replace with MongoDB in production)
let fileDatabase = new Map();
let backupFileId = null;

// Load database from Google Drive backup
async function loadFromBackup(req) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      getCallbackUrl(req),
    );

    const cookies = cookie.parse(req.headers.cookie || '');
    const accessToken = cookies.gdrive_token;
    if (!accessToken) return;

    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Search for backup file in app data folder
    const searchResult = await drive.files.list({
      q: "name='orbitos_backup.json' and parents in 'appDataFolder'",
      spaces: 'appDataFolder',
    });

    if (searchResult.data.files.length > 0) {
      backupFileId = searchResult.data.files[0].id;
      const fileContent = await drive.files.get({
        fileId: backupFileId,
        alt: 'media',
      });

      const backupData = JSON.parse(fileContent.data);
      fileDatabase = new Map(Object.entries(backupData));
    }
  } catch (error) {
    console.log('Failed to load backup, starting fresh:', error.message);
  }
}

// Save database to Google Drive backup
async function saveToBackup(req) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      getCallbackUrl(req),
    );

    const cookies = cookie.parse(req.headers.cookie || '');
    const accessToken = cookies.gdrive_token;
    if (!accessToken) return;

    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const backupData = Object.fromEntries(fileDatabase);
    const content = JSON.stringify(backupData);

    if (backupFileId) {
      // Update existing backup
      await drive.files.update({
        fileId: backupFileId,
        media: {
          mimeType: 'application/json',
          body: Buffer.from(content, 'utf8'),
        },
      });
    } else {
      // Create new backup in app data folder
      const result = await drive.files.create({
        requestBody: {
          name: 'orbitos_backup.json',
          parents: ['appDataFolder'],
        },
        media: {
          mimeType: 'application/json',
          body: Buffer.from(content, 'utf8'),
        },
      });
      backupFileId = result.data.id;
    }
  } catch (error) {
    console.log('Backup failed:', error.message);
  }
}

export default async function handler(req, res) {
  // Load from backup on first request
  if (fileDatabase.size === 0) {
    await loadFromBackup(req);
  }

  if (req.method === 'GET') {
    const { id } = req.query;
    
    if (id) {
      // Get specific file by ID
      const file = fileDatabase.get(id);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      res.status(200).json(file);
    } else {
      // Get all files
      const files = Array.from(fileDatabase.values());
      console.log('Getting files, database size:', fileDatabase.size);
      res.status(200).json(files);
    }
  } else if (req.method === 'POST') {
    const { name, content, type } = req.body;
    const fileId = `file_${Date.now()}`;

    const dbFile = {
      id: fileId,
      name,
      content: content,
      type: type || 'file',
      lastModified: new Date().toISOString(),
    };

    console.log('Creating item:', dbFile);
    fileDatabase.set(fileId, dbFile);
    console.log('Database size after create:', fileDatabase.size);

    // Non-blocking backup
    saveToBackup(req).catch((err) => console.log('Backup error:', err));

    res.status(201).json(dbFile);
  } else if (req.method === 'PUT') {
    const { id, content, name, type } = req.body;
    const file = fileDatabase.get(id);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (content !== undefined) file.content = content;
    if (name !== undefined) file.name = name;
    if (type !== undefined) file.type = type;
    file.lastModified = new Date().toISOString();

    console.log('Updating item:', file);
    fileDatabase.set(id, file);

    // Non-blocking backup
    saveToBackup(req).catch((err) => console.log('Backup error:', err));

    res.status(200).json(file);
  } else if (req.method === 'DELETE') {
    const { id } = req.query;
    const file = fileDatabase.get(id);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    fileDatabase.delete(id);
    saveToBackup(req);

    res.status(200).json({ message: 'File deleted successfully' });
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

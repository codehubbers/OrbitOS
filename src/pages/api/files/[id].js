// src/pages/api/files/[id].js
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import File from '@/models/File';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

// Only media types that browsers cannot execute are served inline.
// Anything else (text/html, image/svg+xml, application/javascript...) is
// sent as plain text so a shared file can never run script on our origin.
const INLINE_MIME = /^(audio\/[\w.+-]+|image\/(png|jpe?g|gif|webp|avif))$/i;

export function getSafeMimeType(mimeType) {
  const type = String(mimeType || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  return INLINE_MIME.test(type) ? type : 'text/plain; charset=utf-8';
}

/** Parses a single `bytes=start-end` Range header. Returns null if invalid. */
export function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header || '');
  if (!match || (match[1] === '' && match[2] === '')) return null;
  let start;
  let end;
  if (match[1] === '') {
    // Suffix range: last N bytes
    start = Math.max(size - Number(match[2]), 0);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);
  }
  if (start > end || start >= size) return null;
  return { start, end };
}

/**
 * Streams a stored file's content so it can be used directly as an
 * <audio>/<img> source. Content saved as a base64 data URL is decoded.
 * Supports HTTP Range requests so the player's seek bar works.
 */
async function handleGet(req, res) {
  let user;
  try {
    user = await verifyToken(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'File ID is required' });
  }
  if (!OBJECT_ID.test(id)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const file = await File.findOne({
    _id: id,
    $or: [{ owner: user._id }, { 'collaborators.user': user._id }],
  });
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  const content = file.content || '';
  const dataUrlMatch = /^data:([^;,]+)(;[^,]*)?;base64,(.*)$/s.exec(content);
  const buffer = dataUrlMatch
    ? Buffer.from(dataUrlMatch[3], 'base64')
    : Buffer.from(content, 'utf8');
  const contentType = getSafeMimeType(
    dataUrlMatch ? dataUrlMatch[1] : file.mimeType,
  );

  res.setHeader('Content-Type', contentType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; media-src 'self'; img-src 'self'; sandbox",
  );
  res.setHeader('Cache-Control', 'private, no-cache');
  res.setHeader('Accept-Ranges', 'bytes');
  if (contentType.startsWith('text/plain')) {
    res.setHeader('Content-Disposition', 'attachment');
  }

  if (req.headers.range) {
    const range = parseRange(req.headers.range, buffer.length);
    if (!range) {
      res.setHeader('Content-Range', `bytes */${buffer.length}`);
      return res.status(416).end();
    }
    const chunk = buffer.subarray(range.start, range.end + 1);
    res.setHeader(
      'Content-Range',
      `bytes ${range.start}-${range.end}/${buffer.length}`,
    );
    res.setHeader('Content-Length', chunk.length);
    return res.status(206).send(chunk);
  }

  res.setHeader('Content-Length', buffer.length);
  return res.status(200).send(buffer);
}

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      return await handleGet(req, res);
    } catch (error) {
      console.error('File stream error:', error);
      return res.status(500).json({ error: 'Failed to load file' });
    }
  }

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
        deletedFile: file,
      });
    }

    // Check if user is a collaborator
    const collaboratorIndex = file.collaborators.findIndex(
      (collab) => collab.user.toString() === user._id.toString(),
    );

    if (collaboratorIndex !== -1) {
      // User is collaborator - remove them from collaborators (unshare)
      file.collaborators.splice(collaboratorIndex, 1);
      await file.save();

      return res.status(200).json({
        message: 'File unshared successfully',
        unsharedFile: file,
      });
    }

    // User has no access to the file
    return res.status(403).json({ error: 'Access denied' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
}

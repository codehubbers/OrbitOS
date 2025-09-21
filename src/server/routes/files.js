const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Mock file storage
let files = [
  { id: 1, name: 'document.txt', size: 1024, uploadDate: new Date() },
  { id: 2, name: 'image.jpg', size: 2048, uploadDate: new Date() },
];

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET /api/files - List all files
router.get('/', (req, res) => {
  res.json({ success: true, files });
});

// POST /api/files/upload - Upload file
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: 'No file uploaded' });
  }

  const newFile = {
    id: files.length + 1,
    name: req.file.originalname,
    size: req.file.size,
    uploadDate: new Date(),
    mimetype: req.file.mimetype,
  };

  files.push(newFile);
  res.json({ success: true, file: newFile });
});

// DELETE /api/files/:id - Delete file
router.delete('/:id', (req, res) => {
  const fileId = parseInt(req.params.id);
  const fileIndex = files.findIndex((f) => f.id === fileId);

  if (fileIndex === -1) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  files.splice(fileIndex, 1);
  res.json({ success: true, message: 'File deleted' });
});

module.exports = router;

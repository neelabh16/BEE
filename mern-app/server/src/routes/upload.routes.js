const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { protect } = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(16).toString('hex') + ext;
    cb(null, name);
  },
});

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'), false);
    }
  },
});

router.post('/avatar', protect, upload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error('No file uploaded');
    error.statusCode = 400;
    throw error;
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ success: true, data: { url }, message: 'File uploaded successfully' });
}));

router.post('/image', protect, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error('No file uploaded');
    error.statusCode = 400;
    throw error;
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ success: true, data: { url }, message: 'File uploaded successfully' });
}));

module.exports = router;

const asyncHandler = require('../utils/asyncHandler');

// @desc    Upload an image file
// @route   POST /api/v1/uploads
// @access  Private
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error('Please select an image file to upload');
    error.statusCode = 400;
    throw error;
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  res.status(201).json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});

module.exports = {
  uploadFile,
};

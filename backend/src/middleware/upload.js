const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const path = require('path');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isImage = file.fieldname === 'image';

    const ext = path.extname(file.originalname).toLowerCase(); // .pdf
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '_');

    return {
      folder: isImage ? 'products/images' : 'products/documents',
      resource_type: isImage ? 'image' : 'raw',
      allowed_formats: isImage
        ? ['jpg', 'jpeg', 'png', 'webp']
        : ['pdf', 'doc', 'docx', 'xls', 'xlsx'],

      // Important: keep extension for documents like PDF
      public_id: isImage
        ? `${baseName}_${Date.now()}`
        : `${baseName}_${Date.now()}${ext}`,
    };
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

module.exports = upload;

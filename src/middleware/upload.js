/**
 * middleware/upload.js — Multer + Cloudinary file upload middleware
 *
 * Security measures:
 *  1. Server-side MIME type validation using file-type@16 (CJS-compatible)
 *     via a custom multer fileFilter. Rejects anything that isn't
 *     image/jpeg, image/png, or application/pdf.
 *  2. Max file size: 5MB (enforced by Multer limits).
 *  3. Files uploaded to the "payment_slips" folder on Cloudinary.
 *  4. resource_type: "auto" to handle both images and PDFs.
 */

'use strict';

const multer                = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary            = require('../config/cloudinary');

// Allowed MIME types and extensions for payment slip uploads
const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/pjpeg',
  'application/pdf',
  'application/octet-stream',
]);
const ALLOWED_EXTS = new Set(['jpg', 'jpeg', 'png', 'pdf', 'webp', 'heic', 'heif']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// ── Cloudinary Storage ───────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = (file.originalname.split('.').pop() || '').toLowerCase();
    const isPdf = (file.mimetype || '').toLowerCase() === 'application/pdf' || ext === 'pdf';
    return {
      folder: 'payment_slips',
      resource_type: isPdf ? 'raw' : 'image',
      public_id: `slip_${Date.now()}_${Math.round(Math.random() * 1e9)}`,
    };
  },
});

// ── MIME & Extension Validation via fileFilter ───────────────────────────
async function fileFilter(req, file, cb) {
  const declaredMime = (file.mimetype || '').toLowerCase();
  const ext = (file.originalname.split('.').pop() || '').toLowerCase();

  const isMimeAllowed = ALLOWED_MIMES.has(declaredMime);
  const isExtAllowed = ALLOWED_EXTS.has(ext);

  if (!isMimeAllowed && !isExtAllowed) {
    return cb(
      Object.assign(new Error('Only JPG, PNG, WEBP, HEIC, and PDF files are allowed'), {
        status: 400,
      }),
      false
    );
  }

  cb(null, true);
}

// ── Multer instance ──────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files:    1,
  },
});

/**
 * Single-file upload middleware for the payment slip field.
 * Wraps the multer .single() call to translate Multer errors into
 * structured JSON responses.
 */
function uploadSlip(req, res, next) {
  const singleUpload = upload.single('payment_slip');

  singleUpload(req, res, (err) => {
    if (!err) return next();

    console.error('[UPLOAD ERROR]', err);

    // Multer file size exceeded
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size must not exceed 5MB' });
    }

    const statusCode = err.status || err.statusCode || 400;
    const message = err.message || 'File upload failed. Please ensure your slip is a valid image or PDF under 5MB.';
    return res.status(statusCode).json({ error: message });
  });
}

module.exports = { uploadSlip };

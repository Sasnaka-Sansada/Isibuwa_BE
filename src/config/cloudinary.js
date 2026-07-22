/**
 * config/cloudinary.js — Cloudinary v1 SDK configuration
 *
 * Exports the configured cloudinary instance for use in
 * multer-storage-cloudinary and for generating signed URLs.
 */

'use strict';

const cloudinary = require('cloudinary').v2;
require('dotenv').config();

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
    api_key:    (process.env.CLOUDINARY_API_KEY || '').trim(),
    api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
    secure:     true,
  });
}

module.exports = cloudinary;

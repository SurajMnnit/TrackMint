/**
 * Multer configuration for receipt uploads.
 *
 * - Stores files in the uploads/ directory (configurable via UPLOAD_DIR).
 * - Limits file size (configurable via MAX_FILE_SIZE_MB).
 * - Only allows image MIME types (jpeg, png, webp, gif).
 * - Filenames are prefixed with a timestamp to avoid collisions.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function getUploadDir() {
    const dir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

const storage = multer.diskStorage({
    destination(_req, _file, cb) {
        cb(null, getUploadDir());
    },
    filename(_req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        cb(null, name);
    },
});

function fileFilter(_req, file, cb) {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (jpeg, png, webp, gif) are allowed.'), false);
    }
}

const maxSize = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5) * 1024 * 1024;

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSize },
});

module.exports = upload;

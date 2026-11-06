import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { receiptsDir } from '../utils/receipts';

/**
 * Receipt uploads: stored on disk under server/uploads with a random
 * unguessable name (the original extension is kept for viewers).
 * Registered per-route with .single('receipt').
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, receiptsDir()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomBytes(16).toString('hex') + ext);
  },
});

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const ALLOWED_EXT = /\.(jpe?g|png|webp|pdf)$/i;
const MAX_SIZE_MB = 5;

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype) && ALLOWED_EXT.test(path.extname(file.originalname))) {
      cb(null, true);
      return;
    }
    const error: Error & { statusCode?: number } = new Error(
      `Receipts must be a JPG, PNG, WebP or PDF up to ${MAX_SIZE_MB} MB`
    );
    error.statusCode = 400;
    cb(error);
  },
});

export default upload;

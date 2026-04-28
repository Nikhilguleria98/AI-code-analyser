import multer from 'multer';
import path from 'path';
import sanitizeFilename from 'sanitize-filename';
import { env } from '../config/env.js';

const storage = multer.diskStorage({
  destination: 'server/uploads',
  filename: (_req, file, cb) => {
    const base = sanitizeFilename(path.basename(file.originalname, path.extname(file.originalname)));
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${base}${extension}`);
  }
});

export const uploadFile = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 }
});

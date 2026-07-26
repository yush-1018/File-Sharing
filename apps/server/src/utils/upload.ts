import multer from 'multer';
import path from 'node:path';
import { env } from '../config/env.js';

const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.php', '.pl', '.py', '.js', '.vbs', '.scr',
  '.pif', '.application', '.gadget', '.msi', '.msp', '.com', '.hta', '.cpl',
  '.msc', '.jar', '.html', '.htm',
]);

export function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return cb(new Error(`File type ${ext} is blocked for security reasons.`));
  }
  cb(null, true);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

export const sharedMulterUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB
  fileFilter,
});

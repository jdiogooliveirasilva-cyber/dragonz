import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB

// Ensure upload directories exist
const dirs = ['avatars', 'posts', 'banners', 'settings'].map(d => path.join(UPLOAD_DIR, d));
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const fieldName = file.fieldname;
    let dest = UPLOAD_DIR;
    if (fieldName === 'avatar') dest = path.join(UPLOAD_DIR, 'avatars');
    else if (fieldName === 'postImage') dest = path.join(UPLOAD_DIR, 'posts');
    else if (fieldName === 'banner') dest = path.join(UPLOAD_DIR, 'banners');
    else if (fieldName === 'settings') dest = path.join(UPLOAD_DIR, 'settings');
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG, GIF, WEBP, MP4, MOV, AVI ou WEBM.'));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

export function getFileUrl(filename: string, folder: string = ''): string {
  return `/uploads/${folder ? folder + '/' : ''}${filename}`;
}

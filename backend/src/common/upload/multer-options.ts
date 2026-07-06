import { extname, join } from 'path';
import * as fs from 'fs';
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

function ensureUploadDir(folder: string) {
  const uploadPath = join(process.cwd(), 'uploads', folder);
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  return uploadPath;
}

function createFilename(file: Express.Multer.File) {
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
];
const ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/x-c',
  'text/x-c++src',
  'application/octet-stream',
];

export const avatarUploadOptions: MulterOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      cb(null, ensureUploadDir('avatars'));
    },
    filename: (req, file, cb) => {
      cb(null, createFilename(file));
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
      return cb(new BadRequestException('Only JPG, PNG, or WEBP images are allowed'), false);
    }
    cb(null, true);
  },
};

export const postFilesUploadOptions: MulterOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'image') {
        return cb(null, ensureUploadDir('posts/images'));
      }
      if (file.fieldname === 'video') {
        return cb(null, ensureUploadDir('posts/videos'));
      }
      if (file.fieldname === 'attachment') {
        return cb(null, ensureUploadDir('posts/attachments'));
      }
      return cb(new BadRequestException('Invalid upload field'), '');
    },
    filename: (req, file, cb) => {
      cb(null, createFilename(file));
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'image') {
      if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
        return cb(new BadRequestException('Only JPG, PNG, or WEBP images are allowed for image'), false);
      }
      return cb(null, true);
    }
    if (file.fieldname === 'video') {
      if (!VIDEO_MIME_TYPES.includes(file.mimetype)) {
        return cb(new BadRequestException('Only MP4, WEBM, OGG, or MOV videos are allowed'), false);
      }
      return cb(null, true);
    }
    if (file.fieldname === 'attachment') {
      if (!ATTACHMENT_MIME_TYPES.includes(file.mimetype)) {
        return cb(
          new BadRequestException(
            'Only zip, pptx, doc, docx, pdf, txt, c, and cpp files are allowed',
          ),
          false,
        );
      }
      return cb(null, true);
    }
    return cb(new BadRequestException('Invalid upload field'), false);
  },
};

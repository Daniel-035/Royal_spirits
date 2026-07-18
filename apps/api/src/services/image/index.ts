import { env } from '../../config/env';
import path from 'node:path';
import fs from 'node:fs/promises';

export interface SavedImage {
  url: string;
  key: string;
}

export interface ImageService {
  save(buffer: Buffer, filename: string, mimetype: string): Promise<SavedImage>;
  delete(key: string): Promise<void>;
}

class LocalImageService implements ImageService {
  private dir: string;

  constructor() {
    this.dir = path.resolve(process.cwd(), env.imageUploadDir);
  }

  async save(buffer: Buffer, filename: string): Promise<SavedImage> {
    await fs.mkdir(this.dir, { recursive: true });
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${filename}`;
    const fullPath = path.join(this.dir, unique);
    await fs.writeFile(fullPath, buffer);
    const url = `${env.imagePublicBase}/${unique}`;
    return { url, key: unique };
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.dir, key);
    await fs.rm(fullPath, { force: true });
  }
}

class CloudinaryImageService implements ImageService {
  async save(): Promise<SavedImage> {
    throw new Error('Cloudinary image provider not configured');
  }
  async delete(): Promise<void> {
    throw new Error('Cloudinary image provider not configured');
  }
}

export function createImageService(): ImageService {
  switch (env.imageProvider) {
    case 'cloudinary':
      return new CloudinaryImageService();
    case 'local':
    default:
      return new LocalImageService();
  }
}

export const imageService = createImageService();

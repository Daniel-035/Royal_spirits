import { env } from '../../config/env';
import path from 'node:path';
import fs from 'node:fs/promises';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

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
  private configured: boolean;

  constructor() {
    if (env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret) {
      cloudinary.config({
        cloud_name: env.cloudinaryCloudName,
        api_key: env.cloudinaryApiKey,
        api_secret: env.cloudinaryApiSecret,
        secure: true,
      });
      this.configured = true;
    } else {
      this.configured = false;
    }
  }

  async save(buffer: Buffer, _filename: string, mimetype: string): Promise<SavedImage> {
    if (!this.configured) {
      throw new Error('Cloudinary credentials not configured: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET required');
    }

    const publicId = `royal-spirits/products/${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const resourceType = mimetype.startsWith('image/') ? 'image' : 'raw';

    const result: UploadApiResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: resourceType,
          folder: 'royal-spirits/products',
          overwrite: true,
        },
        (error, uploadResult) => {
          if (error) {
            reject(error);
          } else if (uploadResult) {
            resolve(uploadResult as UploadApiResponse);
          } else {
            reject(new Error('Cloudinary upload returned no result'));
          }
        },
      );
      uploadStream.end(buffer);
    });

    return {
      url: result.secure_url,
      key: result.public_id,
    };
  }

  async delete(key: string): Promise<void> {
    if (!this.configured) {
      throw new Error('Cloudinary not configured');
    }
    const result = (await cloudinary.uploader.destroy(key, {
      resource_type: 'image',
    })) as { result: string };
    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Cloudinary delete failed: ${result.result}`);
    }
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

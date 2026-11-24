
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  // Upload file through backend
  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    resourceType: 'image' | 'raw' = 'raw',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: resourceType,
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }

            if (!result) {
              return reject(new Error('Cloudinary upload failed'));
            }

            resolve(result);
          },
        )
        .end(file.buffer);
    });
  }

  // Generate signed upload credentials
  generateUploadSignature(
    folder: string,
    resourceType: 'image' | 'raw' = 'raw',
  ) {
    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign = {
      timestamp,
      folder,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!,
    );

    return {
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder,
      resourceType,
    };
  }

  // Delete Cloudinary file
  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'raw' | 'video' = 'image',
  ) {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  }
}

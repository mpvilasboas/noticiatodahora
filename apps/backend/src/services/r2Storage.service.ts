import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ENV } from '../config/env.js';
import crypto from 'crypto';

let s3Client: S3Client | null = null;

if (ENV.R2_ACCOUNT_ID && ENV.R2_ACCESS_KEY_ID && ENV.R2_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${ENV.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ENV.R2_ACCESS_KEY_ID,
      secretAccessKey: ENV.R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function uploadToR2(fileBuffer: Buffer, mimeType: string, folder: string = 'media'): Promise<string> {
  const extension = mimeType.split('/')[1] || 'bin';
  const fileName = `${folder}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${extension}`;

  if (!s3Client) {
    console.warn('[R2 Storage] R2 credentials not configured. Returning local mock URL.');
    return `https://storage.mock.local/${fileName}`;
  }

  const command = new PutObjectCommand({
    Bucket: ENV.R2_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  return ENV.R2_PUBLIC_URL ? `${ENV.R2_PUBLIC_URL}/${fileName}` : `https://${ENV.R2_BUCKET_NAME}.r2.cloudflarestorage.com/${fileName}`;
}

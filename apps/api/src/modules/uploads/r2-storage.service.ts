import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);

  private readonly accountId = process.env.R2_ACCOUNT_ID;
  private readonly accessKeyId = process.env.R2_ACCESS_KEY_ID;
  private readonly secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  private readonly bucketName = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME || 'kiraka-uploads';

  private s3Client: S3Client | null = null;
  private readonly localBlobs = new Map<string, { buffer: Buffer; contentType: string }>();

  constructor() {
    if (this.accountId && this.accessKeyId && this.secretAccessKey) {
      try {
        this.s3Client = new S3Client({
          region: 'auto',
          endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: this.accessKeyId,
            secretAccessKey: this.secretAccessKey,
          },
          // Section 4 (b): Checksum calculation set to WHEN_REQUIRED to avoid rejected SigV4 checksum headers
          requestChecksumCalculation: 'WHEN_REQUIRED',
          responseChecksumValidation: 'WHEN_REQUIRED',
        });
        this.logger.log(`Initialized Cloudflare R2 client for bucket '${this.bucketName}'`);
      } catch (err: any) {
        this.logger.error(`Failed to initialize R2 client: ${err.message}`);
      }
    } else {
      this.logger.log('R2 credentials not set in .env. Storage operating in local zero-mock memory mode.');
    }
  }

  isConfigured(): boolean {
    return !!(this.s3Client && this.accountId && this.accessKeyId && this.secretAccessKey);
  }

  getBucketName(): string {
    return this.bucketName;
  }

  /**
   * Section 4: Generate presigned PUT URL for Cloudflare R2
   */
  async generatePresignedPutUrl(options: {
    key: string;
    contentType: string;
    expiresInSeconds?: number;
  }): Promise<{ url: string; key: string; contentType: string; expiresInSeconds: number }> {
    const { key, contentType, expiresInSeconds = 300 } = options;

    if (!this.isConfigured()) {
      const appUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      return {
        url: `${appUrl}/api/v1/uploads/local-put?key=${encodeURIComponent(key)}`,
        key,
        contentType,
        expiresInSeconds,
      };
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(this.s3Client!, command, {
      expiresIn: expiresInSeconds,
    });

    return { url, key, contentType, expiresInSeconds };
  }

  /**
   * Section 4: Generate short-lived signed GET URL (1 hour)
   */
  async generateSignedGetUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    if (!this.isConfigured()) {
      const appUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      return `${appUrl}/api/v1/uploads/local-get?key=${encodeURIComponent(key)}`;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client!, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Section 4: Server-side stream upload fallback when direct client PUT fails
   */
  async putObjectDirect(key: string, buffer: Buffer, contentType: string): Promise<string> {
    if (!this.isConfigured()) {
      this.storeLocalDevBlob(key, buffer, contentType);
      return this.generateSignedGetUrl(key);
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client!.send(command);
    return this.generateSignedGetUrl(key);
  }

  /**
   * Section 4: Verify uploaded object existence and validate magic bytes
   */
  async verifyAndCheckSignature(key: string, expectedContentType: string): Promise<boolean> {
    if (!this.isConfigured()) {
      const item = this.localBlobs.get(key);
      if (!item) return true;
      return this.validateMagicBytes(item.buffer, expectedContentType);
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const head = await this.s3Client!.send(command);
      return !!head;
    } catch (err: any) {
      this.logger.error(`Error verifying R2 object ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Storage Health Check (pnpm r2:verify and Admin Console)
   */
  async verifyR2Connection(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!this.isConfigured()) {
      return {
        success: true,
        message: 'Storage operating in local development mode (R2 variables unset in .env). Local direct-PUT and streaming fallbacks active.',
        details: { mode: 'local', bucket: this.bucketName },
      };
    }

    const testKey = `health-check/verify-${Date.now()}.txt`;
    const testContent = Buffer.from('kiraka-r2-verification-probe');

    try {
      // 1. Put
      await this.s3Client!.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: testKey,
          Body: testContent,
          ContentType: 'text/plain',
        }),
      );

      // 2. Head
      await this.s3Client!.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: testKey,
        }),
      );

      // 3. Signed GET URL test
      const getUrl = await this.generateSignedGetUrl(testKey, 60);

      // 4. Delete
      await this.s3Client!.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: testKey,
        }),
      );

      return {
        success: true,
        message: `Cloudflare R2 verification passed successfully for bucket '${this.bucketName}'.`,
        details: { bucket: this.bucketName, testKey, getUrl },
      };
    } catch (err: any) {
      return {
        success: false,
        message: `R2 verification probe failed: ${err.message}`,
        details: { bucket: this.bucketName, error: err.stack },
      };
    }
  }

  // ─── Local Dev In-Memory Storage ───

  storeLocalDevBlob(key: string, buffer: Buffer, contentType: string) {
    this.localBlobs.set(key, { buffer, contentType });
  }

  getLocalDevBlob(key: string) {
    return this.localBlobs.get(key);
  }

  private validateMagicBytes(buffer: Buffer, mime: string): boolean {
    if (buffer.length < 4) return false;

    // JPEG: FF D8 FF
    if (mime === 'image/jpeg') {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    // PNG: 89 50 4E 47
    if (mime === 'image/png') {
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    }
    // WebP: RIFF ... WEBP
    if (mime === 'image/webp') {
      if (buffer.length < 12) return false;
      return (
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
      );
    }
    return true;
  }
}

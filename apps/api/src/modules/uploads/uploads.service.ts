import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { R2StorageService } from './r2-storage.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import {
  UploadPurpose,
  UploadStatus,
  type PresignUploadInput,
  type PresignUploadResponse,
} from '@kiraka/contracts';

export interface UploadRecord {
  id: string;
  ownerId: string;
  key: string;
  purpose: UploadPurpose;
  contentType: string;
  sizeBytes: number;
  status: UploadStatus;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  // In-memory fallback upload records store
  private readonly inMemoryUploads = new Map<string, UploadRecord>();

  constructor(
    private readonly r2: R2StorageService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Section 4: Request presigned direct-to-bucket upload URL.
   * Generates unique key u/<userId>/<uuid>.<ext> with 5-minute expiry.
   */
  async presign(userId: string, input: PresignUploadInput): Promise<PresignUploadResponse> {
    const ext = this.mimeToExtension(input.contentType);
    const uploadId = `upl-${crypto.randomUUID()}`;
    const key = `u/${userId}/${uploadId}.${ext}`;

    const presigned = await this.r2.generatePresignedPutUrl({
      key,
      contentType: input.contentType,
      expiresInSeconds: 300, // 5 minutes
    });

    const record: UploadRecord = {
      id: uploadId,
      ownerId: userId,
      key,
      purpose: input.purpose,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      status: UploadStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.inMemoryUploads.set(uploadId, record);

    return {
      id: record.id,
      uploadUrl: presigned.url,
      key: record.key,
      contentType: record.contentType,
      expiresInSeconds: 300,
    };
  }

  /**
   * Section 4: Complete upload.
   * Checks file signature, verifies binary magic numbers, and marks upload READY.
   */
  async complete(userId: string, uploadId: string) {
    const record = this.inMemoryUploads.get(uploadId);
    if (!record) {
      throw new NotFoundException('Upload session not found or expired.');
    }

    if (record.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to finalize this upload.');
    }

    if (record.status === UploadStatus.READY) {
      const url = await this.r2.generateSignedGetUrl(record.key, 3600);
      return {
        id: record.id,
        url,
        key: record.key,
        purpose: record.purpose,
        status: record.status,
      };
    }

    // Verify magic bytes
    const isValid = await this.r2.verifyAndCheckSignature(record.key, record.contentType);
    if (!isValid) {
      record.status = UploadStatus.REJECTED;
      throw new BadRequestException(
        'Upload verification failed. File does not match expected image signature (magic numbers).',
      );
    }

    record.status = UploadStatus.READY;
    record.updatedAt = new Date();
    this.inMemoryUploads.set(uploadId, record);

    const signedUrl = await this.r2.generateSignedGetUrl(record.key, 3600);
    this.logger.log(`[R2-UPLOAD] Completed direct upload ${uploadId} for user ${userId} (key: ${record.key})`);

    return {
      id: record.id,
      url: signedUrl,
      key: record.key,
      purpose: record.purpose,
      status: record.status,
    };
  }

  /**
   * Section 4: Resilient Server-Side Multipart Fallback Upload
   * Streams directly to R2 if direct client-side PUT is blocked by CORS/network.
   */
  async uploadFallback(
    userId: string,
    purpose: UploadPurpose,
    buffer: Buffer,
    contentType: string,
  ): Promise<{ id: string; url: string; key: string; status: UploadStatus }> {
    if (buffer.length > 5 * 1024 * 1024) {
      throw new BadRequestException('Image exceeds the maximum allowed size of 5MB.');
    }

    const ext = this.mimeToExtension(contentType);
    const uploadId = `upl-${crypto.randomUUID()}`;
    const key = `u/${userId}/${uploadId}.${ext}`;

    const url = await this.r2.putObjectDirect(key, buffer, contentType);

    const record: UploadRecord = {
      id: uploadId,
      ownerId: userId,
      key,
      purpose,
      contentType,
      sizeBytes: buffer.length,
      status: UploadStatus.READY,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.inMemoryUploads.set(uploadId, record);
    this.logger.log(`[R2-UPLOAD] Completed fallback stream upload ${uploadId} for user ${userId}`);

    return {
      id: uploadId,
      url,
      key,
      status: UploadStatus.READY,
    };
  }

  /**
   * Section 4: Get short-lived signed GET URL (1 hour) for authorized users.
   */
  async getSignedUrl(uploadId: string, userId: string): Promise<string> {
    const record = this.inMemoryUploads.get(uploadId);
    if (!record) {
      throw new NotFoundException('Upload not found.');
    }

    if (record.status !== UploadStatus.READY) {
      throw new BadRequestException('Upload is not ready.');
    }

    return this.r2.generateSignedGetUrl(record.key, 3600);
  }

  private mimeToExtension(mime: string): string {
    switch (mime.toLowerCase()) {
      case 'image/jpeg':
      case 'image/jpg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/avif':
        return 'avif';
      default:
        return 'jpg';
    }
  }
}

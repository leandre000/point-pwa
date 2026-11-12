import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { UploadsService } from './uploads.service.js';
import { R2StorageService } from './r2-storage.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  PresignUploadSchema,
  UploadPurpose,
  type PresignUploadInput,
  type PresignUploadResponse,
} from '@kiraka/contracts';

@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly r2: R2StorageService,
  ) {}

  /**
   * Section 4: Request presigned direct-to-bucket upload URL.
   */
  @Post('presign')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async presignUpload(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(PresignUploadSchema)) body: PresignUploadInput,
  ): Promise<PresignUploadResponse> {
    return this.uploadsService.presign(userId, body);
  }

  /**
   * Section 4: Complete upload.
   */
  @Post(':id/complete')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async completeUpload(
    @CurrentUser('id') userId: string,
    @Param('id') uploadId: string,
  ) {
    return this.uploadsService.complete(userId, uploadId);
  }

  /**
   * Section 4: Server-Side Stream Fallback Upload
   * Used automatically by ImageUploader if direct PUT fails.
   */
  @Post('fallback')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async uploadFallback(
    @CurrentUser('id') userId: string,
    @Query('purpose') purposeStr: string,
    @Req() req: Request,
  ) {
    const purpose = (purposeStr as UploadPurpose) || UploadPurpose.JOB_PHOTO;
    const contentType = (req.headers['content-type'] as string) || 'image/jpeg';

    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          if (buffer.length === 0) {
            return reject(new BadRequestException('No file content received.'));
          }
          const result = await this.uploadsService.uploadFallback(
            userId,
            purpose,
            buffer,
            contentType,
          );
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      req.on('error', (err) => reject(err));
    });
  }

  /**
   * Storage Health Check (Used by admin console and pnpm r2:verify)
   */
  @Get('health')
  async checkStorageHealth() {
    return this.r2.verifyR2Connection();
  }

  /**
   * Section 4: Get short-lived signed GET URL (1 hour)
   */
  @Get(':id/view')
  @UseGuards(AuthGuard)
  async getSignedViewUrl(
    @CurrentUser('id') userId: string,
    @Param('id') uploadId: string,
  ) {
    const url = await this.uploadsService.getSignedUrl(uploadId, userId);
    return { url };
  }

  /**
   * Local dev direct PUT handler (when R2 credentials are unset)
   */
  @Put('local-put')
  @HttpCode(HttpStatus.OK)
  async handleLocalPut(
    @Query('key') key: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const contentType = (req.headers['content-type'] as string) || 'image/jpeg';
      this.r2.storeLocalDevBlob(key, buffer, contentType);
      res.status(200).json({ success: true, key });
    });
  }

  /**
   * Local dev direct GET handler
   */
  @Get('local-get')
  async handleLocalGet(
    @Query('key') key: string,
    @Res() res: Response,
  ) {
    const blob = this.r2.getLocalDevBlob(key);
    if (!blob) {
      return res.status(404).send('Not Found');
    }
    res.setHeader('Content-Type', blob.contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(blob.buffer);
  }
}

import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller.js';
import { UploadsService } from './uploads.service.js';
import { R2StorageService } from './r2-storage.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [UploadsController],
  providers: [UploadsService, R2StorageService],
  exports: [UploadsService, R2StorageService],
})
export class UploadsModule {}


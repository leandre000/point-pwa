import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminAuthController } from './admin-auth.controller.js';
import { AdminService } from './admin.service.js';

@Module({
  controllers: [AdminController, AdminAuthController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}


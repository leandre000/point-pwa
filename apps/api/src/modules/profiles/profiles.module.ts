import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller.js';
import { ProvidersController } from './providers.controller.js';
import { ProfilesService } from './profiles.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ProfilesController, ProvidersController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}


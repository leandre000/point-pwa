import { Module, forwardRef } from '@nestjs/common';
import { JobsController } from './jobs.controller.js';
import { JobsService } from './jobs.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { OffersModule } from '../offers/offers.module.js';

@Module({
  imports: [AuthModule, forwardRef(() => OffersModule)],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}


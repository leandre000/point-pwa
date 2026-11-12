import { Module, forwardRef } from '@nestjs/common';
import { OffersController } from './offers.controller.js';
import { OffersService } from './offers.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { JobsModule } from '../jobs/jobs.module.js';

@Module({
  imports: [AuthModule, forwardRef(() => JobsModule)],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}


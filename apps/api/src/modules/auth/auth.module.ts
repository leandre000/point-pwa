import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { OtpService } from './otp.service.js';
import { SMS_PROVIDER } from './adapters/sms-provider.interface.js';
import { MockSmsProvider } from './adapters/mock-sms.provider.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    AuthGuard,
    {
      provide: SMS_PROVIDER,
      useClass: MockSmsProvider,
    },
  ],
  exports: [AuthService, AuthGuard, OtpService],
})
export class AuthModule {}

import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { OtpService } from './otp.service.js';
import { PasswordService } from './password.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    PasswordService,
    AuthGuard,
  ],
  exports: [AuthService, AuthGuard, OtpService, PasswordService],
})
export class AuthModule {}

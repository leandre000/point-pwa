import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Res,
  UseGuards,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { OtpService } from './otp.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CurrentSessionToken } from '../../common/decorators/current-session.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  OtpRequestSchema,
  OtpVerifySchema,
  type OtpRequest,
  type OtpVerify,
  type OtpRequestResponse,
} from '@kiraka/contracts';
import type { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  private readonly COOKIE_NAME = 'kiraka_session';

  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  async requestOtp(
    @Body(new ZodValidationPipe(OtpRequestSchema)) body: OtpRequest,
    @Req() req: Request,
  ): Promise<OtpRequestResponse> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const result = await this.otpService.requestOtp(body.phone, ipAddress);

    return {
      success: true,
      message: 'Verification code sent via SMS',
      cooldownSeconds: result.cooldownSeconds,
      expiresInSeconds: result.expiresInSeconds,
      mockCode: result.mockCode,
    };
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body(new ZodValidationPipe(OtpVerifySchema)) body: OtpVerify,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    const { user, token, isNewUser } = await this.authService.verifyAndAuthenticate(
      body.phone,
      body.code,
      userAgent,
      ipAddress,
    );

    // Set secure HTTP-only cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(this.COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });

    return {
      success: true,
      token, // Also returned in JSON for PWA offline or authorization headers
      isNewUser,
      user: {
        id: user.id,
        phone: user.phone,
        phoneVerified: !!user.phoneVerifiedAt,
        role: user.role,
        countryCode: user.countryCode,
        locale: user.locale,
        customerProfile: user.customerProfile,
        providerProfile: user.providerProfile,
      },
    };
  }

  @Post('sign-out')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async signOut(
    @CurrentSessionToken() token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.revokeSession(token);
    res.clearCookie(this.COOKIE_NAME, { path: '/' });
    return { success: true, message: 'Signed out successfully' };
  }

  @Get('sessions')
  @UseGuards(AuthGuard)
  async getSessions(
    @CurrentUser() user: User,
    @CurrentSessionToken() currentToken: string,
  ) {
    return this.authService.listUserSessions(user.id, currentToken);
  }

  @Post('sessions/revoke-others')
  @UseGuards(AuthGuard)
  async revokeOtherSessions(
    @CurrentUser() user: User,
    @CurrentSessionToken() currentToken: string,
  ) {
    return this.authService.revokeOtherSessions(user.id, currentToken);
  }
}


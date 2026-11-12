import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CurrentSessionToken } from '../../common/decorators/current-session.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  RegisterRequestSchema,
  VerifySignupOtpSchema,
  CreatePasswordSchema,
  SignInRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordSchema,
  type RegisterRequest,
  type VerifySignupOtpInput,
  type CreatePasswordInput,
  type SignInRequest,
  type ForgotPasswordRequest,
  type ResetPasswordInput,
} from '@kiraka/contracts';

@Controller('auth')
export class AuthController {
  private readonly COOKIE_NAME = 'kiraka_session';

  constructor(private readonly authService: AuthService) {}

  /**
   * Section 1.2: Sign Up (Screen 1) — Request Email OTP
   */
  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(
    @Body(new ZodValidationPipe(RegisterRequestSchema)) body: RegisterRequest,
    @Req() req: Request,
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.authService.register(body, ipAddress);
  }

  /**
   * Section 1.2: Sign Up (Screen 2) — Verify Email OTP -> Get Setup Token
   */
  @Post('verify-signup-otp')
  @HttpCode(HttpStatus.OK)
  async verifySignupOtp(
    @Body(new ZodValidationPipe(VerifySignupOtpSchema)) body: VerifySignupOtpInput,
  ) {
    return this.authService.verifySignupOtp(body);
  }

  /**
   * Section 1.2: Sign Up (Screen 3) — Create Password & Start First Session
   */
  @Post('create-password')
  @HttpCode(HttpStatus.OK)
  async createPassword(
    @Body(new ZodValidationPipe(CreatePasswordSchema)) body: CreatePasswordInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    const { user, token, isNewUser } = await this.authService.createPassword(
      body,
      userAgent,
      ipAddress,
    );

    this.setSessionCookie(res, token);

    return {
      success: true,
      user,
      token,
      isNewUser,
    };
  }

  /**
   * Section 1.3: Sign In — Email and Password ONLY (NO OTP AT LOGIN)
   */
  @Post(['login', 'sign-in'])
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(SignInRequestSchema)) body: SignInRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    const { user, token } = await this.authService.login(body, userAgent, ipAddress);

    this.setSessionCookie(res, token);

    return {
      success: true,
      user,
      token,
    };
  }

  /**
   * Section 1.4: Forgot Password Request (OTP to Email)
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body(new ZodValidationPipe(ForgotPasswordRequestSchema)) body: ForgotPasswordRequest,
    @Req() req: Request,
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.authService.forgotPassword(body, ipAddress);
  }

  /**
   * Section 1.4: Reset Password (Verify OTP + Set New Password)
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordSchema)) body: ResetPasswordInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    const { user, token } = await this.authService.resetPassword(body, userAgent, ipAddress);

    this.setSessionCookie(res, token);

    return {
      success: true,
      user,
      token,
      message: 'Your password has been reset successfully.',
    };
  }

  /**
   * Current Authenticated User (Me)
   */
  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() user: any) {
    return this.authService.formatUserDto(user);
  }

  /**
   * Logout: Revokes server session and clears cookie
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentSessionToken() token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (token) {
      await this.authService.logout(token);
    }
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie(this.COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    });
    return { success: true, message: 'Logged out successfully' };
  }

  private setSessionCookie(res: Response, token: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(this.COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });
  }
}

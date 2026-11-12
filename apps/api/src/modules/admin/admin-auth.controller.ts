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
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdminService } from './admin.service.js';
import { AuthService } from '../auth/auth.service.js';
import { AdminGuard } from '../../common/guards/admin.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('admin/auth')
export class AdminAuthController {
  private readonly ADMIN_COOKIE_NAME = 'kiraka_admin_session';

  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

  /**
   * P0-B: Admin Direct Login on ADMIN_ORIGIN
   * Email + Password only, 12h session, 2h idle.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: { email: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required.');
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const { admin, token } = await this.authService.loginAdmin(
      body.email,
      body.password,
      ipAddress,
      userAgent,
    );

    this.setAdminSessionCookie(res, token);

    return {
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
      token,
    };
  }

  /**
   * P0-B: Exchange 30-Second Single-Use Handoff Code
   * Triggered when admin credentials were typed into customer app.
   */
  @Post('exchange-handoff')
  @HttpCode(HttpStatus.OK)
  async exchangeHandoff(
    @Body('code') code: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!code) {
      throw new BadRequestException('Handoff code is required.');
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const { admin, token } = await this.authService.exchangeAdminHandoff(
      code,
      ipAddress,
      userAgent,
    );

    this.setAdminSessionCookie(res, token);

    return {
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
      token,
    };
  }

  /**
   * P0-B: Current Authenticated Admin
   */
  @Get('me')
  @UseGuards(AdminGuard)
  async getMe(@CurrentUser() admin: any) {
    return {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
    };
  }

  /**
   * P0-B: Admin Logout
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token =
      req.cookies?.[this.ADMIN_COOKIE_NAME] ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);

    if (token) {
      await this.authService.logoutAdmin(token);
    }

    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie(this.ADMIN_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    });

    return { success: true, message: 'Admin logged out successfully' };
  }

  private setAdminSessionCookie(res: Response, token: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(this.ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 12 * 60 * 60 * 1000, // 12 hours absolute
      path: '/',
    });
  }
}

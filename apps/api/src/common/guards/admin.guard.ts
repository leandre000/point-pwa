import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service.js';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const adminToken =
      request.cookies?.['kiraka_admin_session'] ||
      this.extractBearerToken(request.headers.authorization);

    if (adminToken) {
      const { admin, session } = await this.authService.validateAdminSession(adminToken);
      request.user = admin;
      request.admin = admin;
      request.session = session;
      request.sessionToken = adminToken;
      return true;
    }

    // Fallback: check legacy customer session token if it has ADMIN or MODERATOR role
    const customerToken = request.cookies?.['kiraka_session'];
    if (customerToken) {
      try {
        const sessionData = await this.authService.validateSession(customerToken);
        if (
          sessionData?.user &&
          (sessionData.user.role === 'ADMIN' || sessionData.user.role === 'MODERATOR')
        ) {
          request.user = sessionData.user;
          request.session = sessionData.session;
          request.sessionToken = customerToken;
          return true;
        }
      } catch {}
    }

    throw new UnauthorizedException('Super Admin session required.');
  }

  private extractBearerToken(header?: string): string | null {
    if (!header || !header.startsWith('Bearer ')) return null;
    return header.slice(7);
  }
}



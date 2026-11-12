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
    const token =
      request.cookies?.['kiraka_session'] ||
      this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    const sessionData = await this.authService.validateSession(token);
    if (!sessionData || !sessionData.user) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const { user, session } = sessionData;
    if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
      throw new ForbiddenException('Admin or moderator privilege required');
    }

    request.user = user;
    request.session = session;
    request.sessionToken = token;
    return true;
  }

  private extractBearerToken(header?: string): string | null {
    if (!header || !header.startsWith('Bearer ')) return null;
    return header.slice(7);
  }
}


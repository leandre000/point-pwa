import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Check HTTP-only cookie first
    let token = request.cookies?.['kiraka_session'];

    // 2. Fallback to Authorization: Bearer <token>
    if (!token && request.headers.authorization) {
      const parts = request.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    const { user, session } = await this.authService.validateSession(token);
    request.user = user;
    request.session = session;
    request.sessionToken = token;

    return true;
  }
}


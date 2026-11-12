import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service.js';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    let token = request.cookies?.['kiraka_session'];

    if (!token && request.headers.authorization) {
      const parts = request.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (token) {
      try {
        const { user, session } = await this.authService.validateSession(token);
        request.user = user;
        request.session = session;
        request.sessionToken = token;
      } catch {
        // Session invalid or expired: proceed as guest
      }
    }

    return true;
  }
}


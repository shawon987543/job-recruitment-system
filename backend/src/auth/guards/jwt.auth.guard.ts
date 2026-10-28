import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ALLOW_FIRST_LOGIN_KEY } from '../../common/decorators/allow-first-login.decorator';

interface AuthenticatedRequest {
  user?: {
    mustChangePassword?: boolean;
  };
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authenticated = await super.canActivate(context);
    if (!authenticated) {
      return false;
    }
    const allowFirstLogin = this.reflector.getAllAndOverride<boolean>(
      ALLOW_FIRST_LOGIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (allowFirstLogin) {
      return true;
    }
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.user?.mustChangePassword) {
      throw new ForbiddenException(
        'You must change your password before accessing this resource',
      );
    }

    return true;
  }
}
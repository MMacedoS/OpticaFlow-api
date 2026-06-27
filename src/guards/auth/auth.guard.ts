import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

interface RequestWithUser {
  headers: {
    authorization?: string;
  };
  user?: {
    sub: string;
    email: string;
    username?: string;
    pessoaId?: string | null;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      return false;
    }

    const payload = await this.authService.validateTokenAndGetPayload(token);

    if (!payload) {
      return false;
    }

    request.user = payload;

    return true;
  }

  private extractTokenFromHeader(request: RequestWithUser): string | null {
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}

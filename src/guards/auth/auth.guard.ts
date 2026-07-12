import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from 'src/app/auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.authService.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token não informado.');
    }

    const payload = await this.authService.validateTokenAndGetPayload(token);

    if (!payload) {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    request.user = payload;

    return true;
  }
}

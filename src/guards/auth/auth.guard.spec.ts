import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/app/auth/auth.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const authMock = {
    extractTokenFromHeader: jest.fn(),
    validateTokenAndGetPayload: jest.fn(),
  };
  const guard = new AuthGuard(authMock as unknown as AuthService);

  const contexto = (request: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  beforeEach(() => jest.clearAllMocks());

  it('rejeita requisicao sem token', async () => {
    authMock.extractTokenFromHeader.mockReturnValue(undefined);

    await expect(guard.canActivate(contexto({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejeita token invalido ou expirado', async () => {
    authMock.extractTokenFromHeader.mockReturnValue('token');
    authMock.validateTokenAndGetPayload.mockResolvedValue(null);

    await expect(guard.canActivate(contexto({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('anexa o payload do token a requisicao', async () => {
    const payload = { sub: 'usuario-1', email: 'a@b.com' };
    const request: Record<string, unknown> = {};
    authMock.extractTokenFromHeader.mockReturnValue('token');
    authMock.validateTokenAndGetPayload.mockResolvedValue(payload);

    await expect(guard.canActivate(contexto(request))).resolves.toBe(true);
    expect(request.user).toBe(payload);
  });
});

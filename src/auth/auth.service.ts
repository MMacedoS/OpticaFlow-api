import { ResponseJson } from 'src/interface/response/response.interface';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from 'src/usuario/usuario.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { AcessoService } from 'src/acesso/acesso.service';
import { Atribuicao } from 'src/acesso/interfaces/acesso.interface';
import { Usuario } from '@prisma/client';
import type { RequestWithUser } from './interface/user.interface';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  username?: string | null;
  pessoaId?: string | null;
  type?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
    private readonly acessoService: AcessoService,
  ) {}

  private isBcryptHash(value: string): boolean {
    return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
  }

  private async comparePassword(
    plainPassword: string,
    storedPassword: string,
  ): Promise<boolean> {
    if (!storedPassword) {
      return false;
    }

    // Compatibilidade com registros antigos onde a senha pode ter sido salva em texto puro.
    if (!this.isBcryptHash(storedPassword)) {
      return plainPassword === storedPassword;
    }

    try {
      return await bcrypt.compare(plainPassword, storedPassword);
    } catch {
      return false;
    }
  }

  async login(dto: LoginDto): Promise<ResponseJson> {
    const usuario = await this.usuarioService.findByEmail(dto.email);

    if (!usuario?.senha) {
      return {
        status: 401,
        message: 'Usuário não encontrado, verifique os dados inseridos.',
      };
    }

    const isPasswordValid = await this.comparePassword(
      dto.senha,
      usuario.senha,
    );

    if (!isPasswordValid) {
      return {
        status: 401,
        message: 'Usuário não encontrado, verifique os dados inseridos.',
      };
    }

    const payload = {
      email: usuario.email,
      sub: usuario.id,
      username: usuario.username,
      pessoaId: usuario.pessoaId,
    };

    const access = this.generateToken(payload);

    const lista = await this.acessoService.listarAtribuicoesDoUsuario(
      usuario.id,
    );

    const atribuicoes: Atribuicao[] = lista.data || [];

    return {
      status: 200,
      message: 'Login realizado com sucesso.',
      data: {
        access_token: (await access).access_token,
        refresh_token: (await access).refresh_token,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          username: usuario.username,
          pessoaId: usuario.pessoaId,
        },
        atribuicoes: atribuicoes || [],
      },
    };
  }

  async validateToken(token: string): Promise<boolean> {
    const payload = await this.validateTokenAndGetPayload(token);

    if (!payload) {
      return false;
    }

    return true;
  }

  private async generateToken(payload: JwtPayload): Promise<any> {
    const payloadRefresh: Record<string, any> = {
      sub: payload.sub,
      type: 'refresh',
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload as any, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRATION || ('15m' as any),
      }),
      this.jwtService.signAsync(payloadRefresh as any, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRATION || ('7d' as any),
      }),
    ]);

    return { access_token, refresh_token };
  }

  async validateTokenAndGetPayload(token: string): Promise<JwtPayload | null> {
    try {
      const decoded = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
      const usuario = await this.usuarioService.findById(decoded.sub);

      if (!usuario) {
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('Erro ao validar token JWT:', error);
      return null;
    }
  }

  async refreshToken(refreshToken: string): Promise<ResponseJson> {
    try {
      const decoded = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      if (decoded.type !== 'refresh') {
        return { status: 401, message: 'Token de refresh inválido.' };
      }

      const usuario = await this.usuarioService.findById(decoded.sub);

      if (!usuario) {
        return { status: 401, message: 'Usuário não encontrado.' };
      }

      const payload = {
        email: usuario.email,
        sub: usuario.id,
        username: usuario.username,
        pessoaId: usuario.pessoaId,
      };

      const access = await this.generateToken(payload);

      const lista = await this.acessoService.listarAtribuicoesDoUsuario(
        usuario.id,
      );

      const atribuicoes: Atribuicao[] = lista.data || [];

      return {
        status: 200,
        message: 'Token de acesso renovado com sucesso.',
        data: {
          access_token: access.access_token,
          refresh_token: access.refresh_token,
          usuario: {
            id: usuario.id,
            email: usuario.email,
            username: usuario.username,
            pessoaId: usuario.pessoaId,
          },
          atribuicoes: atribuicoes || [],
        },
      };
    } catch (error) {
      console.error('Erro ao renovar token de acesso:', error);
      return { status: 401, message: 'Token de refresh inválido ou expirado.' };
    }
  }

  async userLoggedIn(token: string): Promise<Partial<Usuario> | null> {
    const payload = await this.validateTokenAndGetPayload(token);

    if (!payload) {
      return null;
    }

    const usuario = await this.usuarioService.findById(payload.sub);

    if (!usuario) {
      return null;
    }

    return usuario;
  }

  public extractTokenFromHeader(
    request: RequestWithUser | Request,
  ): string | null {
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

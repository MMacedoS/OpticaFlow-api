import { ResponseJson } from 'src/interface/response/response.interface';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from 'src/usuario/usuario.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

interface JwtPayload {
  sub: string;
  email: string;
  username?: string;
  pessoaId?: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
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

    const access_token = this.jwtService.sign(payload);

    return {
      status: 200,
      message: 'Login realizado com sucesso.',
      data: { access_token },
    };
  }

  async validateToken(token: string): Promise<boolean> {
    const payload = await this.validateTokenAndGetPayload(token);

    if (!payload) {
      return false;
    }

    return true;
  }

  async validateTokenAndGetPayload(token: string): Promise<JwtPayload | null> {
    try {
      const decoded = this.jwtService.verify<JwtPayload>(token);
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
}

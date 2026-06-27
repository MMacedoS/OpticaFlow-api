import { ResponseJson } from 'src/interface/response/response.interface';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from 'src/usuario/usuario.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<ResponseJson> {
    const usuario = await this.usuarioService.findByEmail(dto.email);

    if (!usuario) {
      return {
        status: 401,
        message: 'Usuário não encontrado, verifique os dados inseridos.',
      };
    }

    const isPasswordValid = await bcrypt.compare(dto.senha, usuario.senha);

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
    try {
      const decoded = this.jwtService.verify(token);
      const usuario = await this.usuarioService.findById(decoded.sub);

      if (!usuario) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao validar token JWT:', error);
      return false;
    }
  }
}

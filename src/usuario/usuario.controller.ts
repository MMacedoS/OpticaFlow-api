import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { UsuarioDto } from './dto/usuario.dto';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';

@Controller('usuario')
@UseGuards(AuthGuard, AcessoGuard)
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Get()
  async getAllUsuarios(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const usuarios = await this.usuarioService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ? search : '',
    );

    if (!usuarios || usuarios.length === 0) {
      return { error: 'Nenhum usuário encontrado' };
    }

    return usuarios;
  }

  @Post()
  async createUsuario(@Body() data: UsuarioDto) {
    return await this.usuarioService.create(data);
  }

  @Delete(':id')
  async deleteUsuario(@Param('id') id: string) {
    return await this.usuarioService.deleteById(id);
  }
}

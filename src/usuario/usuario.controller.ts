import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/createUsuario.dto';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { UpdateUsuarioDto } from './dto/updateUsuario.dto';

@Controller('usuarios')
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

    return usuarios;
  }

  @Post()
  async createUsuario(@Body() data: CreateUsuarioDto) {
    return await this.usuarioService.create(data);
  }

  @Get(':id')
  async getUsuarioById(@Param('id') id: string) {
    return await this.usuarioService.findById(id);
  }

  @Get('email/:email')
  async getUsuarioByEmail(@Param('email') email: string) {
    return await this.usuarioService.findByEmail(email);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return await this.usuarioService.updateStatus(id, status);
  }

  @Put(':id')
  async updateUsuario(@Param('id') id: string, @Body() data: UpdateUsuarioDto) {
    return await this.usuarioService.update(id, data);
  }

  @Delete(':id')
  async deleteUsuario(@Param('id') id: string) {
    return await this.usuarioService.deleteById(id);
  }
}

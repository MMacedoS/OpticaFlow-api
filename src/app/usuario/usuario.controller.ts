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
  UseInterceptors,
} from '@nestjs/common';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import { CreateUsuarioDto } from './dto/createUsuario.dto';
import { UpdateUsuarioDto } from './dto/updateUsuario.dto';
import { UsuarioService } from './usuario.service';

@Controller('usuario')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Get()
  async getAllUsuarios(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.usuarioService.findAll(
      escopo,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ? search : '',
    );
  }

  @Post()
  async createUsuario(
    @Body() data: CreateUsuarioDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.usuarioService.create(data, escopo);
  }

  @Get('email/:email')
  async getUsuarioByEmail(
    @Param('email') email: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.usuarioService.findByEmailNoEscopo(email, escopo);
  }

  @Get(':id')
  async getUsuarioById(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.usuarioService.findByIdNoEscopo(id, escopo);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.usuarioService.updateStatus(id, status, escopo);
  }

  @Put(':id')
  async updateUsuario(
    @Param('id') id: string,
    @Body() data: UpdateUsuarioDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.usuarioService.update(id, data, escopo);
  }

  @Delete(':id')
  async deleteUsuario(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.usuarioService.deleteById(id, escopo);
  }
}

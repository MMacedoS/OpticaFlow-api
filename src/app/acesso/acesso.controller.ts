import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import { AcessoService } from './acesso.service';
import {
  CreateAcessoDto,
  DefinirAcessosUsuarioDto,
  UpdateAcessoDto,
} from './dto/acesso.dto';

@Controller('acesso')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class AcessoController {
  constructor(private readonly acessoService: AcessoService) {}

  @Get('modulos')
  async catalogo() {
    return this.acessoService.catalogo();
  }

  @Get('usuarios')
  async listarUsuarios(@Escopo() escopo: EscopoUsuario) {
    return this.acessoService.listarUsuarios(escopo);
  }

  @Put('usuario/:usuarioId')
  async definirAcessosDoUsuario(
    @Param('usuarioId') usuarioId: string,
    @Body() dto: DefinirAcessosUsuarioDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.acessoService.definirAcessosDoUsuario(
      usuarioId,
      dto.acessoIds,
      escopo,
    );
  }

  @Get()
  async findAll(@Escopo() escopo: EscopoUsuario) {
    return this.acessoService.findAll(escopo);
  }

  @Post()
  async create(@Body() dto: CreateAcessoDto, @Escopo() escopo: EscopoUsuario) {
    return this.acessoService.create(dto, escopo);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.acessoService.findById(id, escopo);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAcessoDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.acessoService.update(id, dto, escopo);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.acessoService.deleteById(id, escopo);
  }
}

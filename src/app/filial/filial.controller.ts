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
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilialService } from './filial.service';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { ConfigFilialDto, CreateFilialDto } from './dto/filial.dto';
import { UsuarioService } from 'src/app/usuario/usuario.service';
import { UpdateFilialDto } from './dto/update.dto';
import { Status } from '@prisma/client';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';

@Controller('filial')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class FilialController {
  constructor(
    private readonly filialService: FilialService,
    private readonly usuarioService: UsuarioService,
  ) {}

  @Get()
  async getAllFiliais(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('empresaId') empresaId?: string,
  ) {
    return this.filialService.findAllByEmpresa(
      escopo,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      undefined,
      empresaId,
    );
  }

  @Post()
  async createFilial(
    @Body() dto: CreateFilialDto,
    @Req()
    request?: {
      user?: {
        sub: string;
      };
    },
  ) {
    const usuarioId = request?.user?.sub;

    if (!usuarioId) {
      return { status: 401, message: 'Usuário não autenticado.' };
    }

    const usuario = await this.usuarioService.findById(usuarioId);

    if (!usuario) {
      return { status: 401, message: 'Usuário não encontrado.' };
    }

    if (!usuario.empresaId) {
      return {
        status: 401,
        message: 'Usuário não está associado a uma empresa.',
      };
    }

    dto.empresaId = usuario.empresaId;

    return this.filialService.create(dto);
  }

  @Get(':id')
  async getFilialById(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.filialService.findById(id, escopo);
  }

  @Put(':id')
  async updateFilial(
    @Param('id') id: string,
    @Body() dto: UpdateFilialDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.filialService.update(id, dto, escopo);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.filialService.updateStatus(id, status as Status, escopo);
  }

  @Delete(':id')
  async deleteFilial(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.filialService.deleteById(id, escopo);
  }

  // ─── Config ───────────────────────────────────────────────────────────────

  @Put(':id/config')
  async upsertConfig(
    @Param('id') id: string,
    @Body() dto: ConfigFilialDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.filialService.upsertConfig(id, dto, escopo);
  }
}

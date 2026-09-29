import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CanalNotificacao } from '@prisma/client';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import {
  CreateNotificacaoDto,
  UpdateNotificacaoDto,
} from './dto/notificacao.dto';
import { NotificacaoService } from './notificacao.service';

@Controller('notificacao')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class NotificacaoController {
  constructor(private readonly notificacaoService: NotificacaoService) {}

  @Post()
  async createNotificacao(
    @Body() dto: CreateNotificacaoDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.notificacaoService.create(dto, escopo);
  }

  @Get('empresa/:empresaId')
  async getAllByEmpresa(
    @Param('empresaId') empresaId: string,
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('pessoaId') pessoaId?: string,
    @Query('usuarioDestinoId') usuarioDestinoId?: string,
    @Query('usuarioRemetenteId') usuarioRemetenteId?: string,
    @Query('canal') canal?: CanalNotificacao,
    @Query('lida') lida?: string,
  ) {
    return this.notificacaoService.findAllByEmpresa(
      empresaId,
      escopo,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      pessoaId,
      usuarioDestinoId,
      usuarioRemetenteId,
      canal,
      lida === undefined ? undefined : lida === 'true',
    );
  }

  @Get(':id')
  async getNotificacaoById(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.notificacaoService.findById(id, escopo);
  }

  @Put(':id')
  async updateNotificacao(
    @Param('id') id: string,
    @Body() dto: UpdateNotificacaoDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.notificacaoService.update(id, dto, escopo);
  }

  @Put(':id/marcar-lida')
  async marcarComoLida(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.notificacaoService.marcarComoLida(id, escopo);
  }

  @Put(':id/marcar-nao-lida')
  async marcarComoNaoLida(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.notificacaoService.marcarComoNaoLida(id, escopo);
  }

  @Delete(':id')
  async deleteNotificacao(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.notificacaoService.deleteById(id, escopo);
  }
}

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import { AuditoriaService } from './auditoria.service';

/** Somente leitura: a auditoria e gravada automaticamente e nao pode ser alterada. */
@Controller('auditoria')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  async findAll(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('usuarioId') usuarioId?: string,
    @Query('entidade') entidade?: string,
    @Query('acao') acao?: string,
    @Query('entidadeId') entidadeId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.auditoriaService.findAll(escopo, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search,
      usuarioId,
      entidade,
      acao,
      entidadeId,
      dataInicio,
      dataFim,
    });
  }

  @Get('opcoes')
  async opcoes(@Escopo() escopo: EscopoUsuario) {
    return this.auditoriaService.opcoes(escopo);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.auditoriaService.findById(id, escopo);
  }
}

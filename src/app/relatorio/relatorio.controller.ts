import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { ModuloAcesso } from 'src/decorators/modulo-acesso/modulo-acesso.decorator';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import type { FiltroRelatorio } from './interfaces/relatorio.interface';
import { RelatorioService } from './relatorio.service';

/**
 * Relatorios por periodo (?dataInicio=AAAA-MM-DD&dataFim=AAAA-MM-DD&filialId).
 * Cada um exige a permissao de listar do modulo de origem dos dados.
 */
@Controller('relatorio')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class RelatorioController {
  constructor(private readonly relatorioService: RelatorioService) {}

  @Get('vendas')
  @ModuloAcesso('venda')
  vendas(@Escopo() escopo: EscopoUsuario, @Query() filtro: FiltroRelatorio) {
    return this.relatorioService.vendas(escopo, filtro);
  }

  @Get('compras')
  @ModuloAcesso('compra')
  compras(@Escopo() escopo: EscopoUsuario, @Query() filtro: FiltroRelatorio) {
    return this.relatorioService.compras(escopo, filtro);
  }

  @Get('financeiro')
  @ModuloAcesso('financeiro-lancamento')
  financeiro(
    @Escopo() escopo: EscopoUsuario,
    @Query() filtro: FiltroRelatorio,
  ) {
    return this.relatorioService.financeiro(escopo, filtro);
  }

  @Get('pessoas')
  @ModuloAcesso('pessoa')
  pessoas(@Escopo() escopo: EscopoUsuario, @Query() filtro: FiltroRelatorio) {
    return this.relatorioService.pessoas(escopo, filtro);
  }

  @Get('produtos')
  @ModuloAcesso('produto')
  produtos(@Escopo() escopo: EscopoUsuario, @Query() filtro: FiltroRelatorio) {
    return this.relatorioService.produtos(escopo, filtro);
  }

  @Get('agendas')
  @ModuloAcesso('agenda')
  agendas(@Escopo() escopo: EscopoUsuario, @Query() filtro: FiltroRelatorio) {
    return this.relatorioService.agendas(escopo, filtro);
  }

  @Get('consultas')
  @ModuloAcesso('atendimento')
  consultas(@Escopo() escopo: EscopoUsuario, @Query() filtro: FiltroRelatorio) {
    return this.relatorioService.consultas(escopo, filtro);
  }

  @Get('fluxo-ordens')
  @ModuloAcesso('ordem-servico')
  fluxoOrdens(
    @Escopo() escopo: EscopoUsuario,
    @Query() filtro: FiltroRelatorio,
  ) {
    return this.relatorioService.fluxoOrdens(escopo, filtro);
  }
}

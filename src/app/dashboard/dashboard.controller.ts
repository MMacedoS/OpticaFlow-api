import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import { DashboardService } from './dashboard.service';

/** Indicadores do painel inicial, restritos a empresa/filial do usuario. */
@Controller('dashboard')
@UseGuards(AuthGuard)
@UseInterceptors(EnrichUserInterceptor)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async resumo(@Escopo() escopo: EscopoUsuario) {
    return this.dashboardService.resumo(escopo);
  }
}

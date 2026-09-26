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
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import {
  CreateOrdemServicoDto,
  UpdateOrdemServicoDto,
} from './dto/ordem-servico.dto';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { OrdemServicoService } from './ordem-servico.service';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';

@Controller('ordem-servico')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class OrdemServicoController {
  constructor(private readonly ordemServicoService: OrdemServicoService) {}

  @Post()
  async createOrdemServico(
    @Body() dto: CreateOrdemServicoDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.ordemServicoService.create(dto, escopo);
  }

  @Get()
  async getAllByFilial(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('clienteId') clienteId?: string,
    @Query('atendimentoId') atendimentoId?: string,
    @Query('laboratorioId') laboratorioId?: string,
    @Query('status') status?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.ordemServicoService.findAll(
      escopo,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      clienteId,
      atendimentoId,
      laboratorioId,
      status,
      dataInicio,
      dataFim,
    );
  }

  @Get(':id')
  async getOrdemServicoById(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.ordemServicoService.findById(id, escopo);
  }

  @Put(':id')
  async updateOrdemServico(
    @Param('id') id: string,
    @Body() dto: UpdateOrdemServicoDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.ordemServicoService.update(id, dto, escopo);
  }

  @Delete(':id')
  async deleteOrdemServico(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.ordemServicoService.deleteById(id, escopo);
  }
}

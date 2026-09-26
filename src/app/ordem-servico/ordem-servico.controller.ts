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
  ForbiddenException,
  UseInterceptors,
} from '@nestjs/common';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import {
  CreateOrdemServicoDto,
  UpdateOrdemServicoDto,
} from './dto/ordem-servico.dto';
import type {
  EscopoOrdemServico,
  UsuarioAutenticadoOrdemServico,
} from './interfaces/ordem-servico.interface';
import { OrdemServicoService } from './ordem-servico.service';
import { CurrentUser } from 'src/decorators/current-user.decorator/current-user.decorator';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';

@Controller('service-orders')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class OrdemServicoController {
  constructor(private readonly ordemServicoService: OrdemServicoService) {}

  @Post()
  async createOrdemServico(
    @Body() dto: CreateOrdemServicoDto,
    @CurrentUser() user: UsuarioAutenticadoOrdemServico,
  ) {
    return this.ordemServicoService.create(dto, this.obterEscopo(user));
  }

  @Get()
  async getAllByFilial(
    @CurrentUser() user: UsuarioAutenticadoOrdemServico,
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
      this.obterEscopo(user),
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
    @CurrentUser() user: UsuarioAutenticadoOrdemServico,
  ) {
    return this.ordemServicoService.findById(
      id,
      this.obterEscopo(user).empresaId,
    );
  }

  @Put(':id')
  async updateOrdemServico(
    @Param('id') id: string,
    @Body() dto: UpdateOrdemServicoDto,
    @CurrentUser() user: UsuarioAutenticadoOrdemServico,
  ) {
    return this.ordemServicoService.update(
      id,
      dto,
      this.obterEscopo(user).empresaId,
    );
  }

  @Delete(':id')
  async deleteOrdemServico(
    @Param('id') id: string,
    @CurrentUser() user: UsuarioAutenticadoOrdemServico,
  ) {
    return this.ordemServicoService.deleteById(
      id,
      this.obterEscopo(user).empresaId,
    );
  }

  private obterEscopo(
    user: UsuarioAutenticadoOrdemServico,
  ): EscopoOrdemServico {
    if (!user?.empresaId) {
      throw new ForbiddenException('Usuário sem empresa vinculada.');
    }

    return {
      empresaId: user.empresaId,
      filialId: user.pessoa?.filialId ?? undefined,
    };
  }
}

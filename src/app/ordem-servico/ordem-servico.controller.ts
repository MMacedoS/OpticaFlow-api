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
    @CurrentUser() user?: any,
  ) {
    if (!user || !user.pessoa || !user.pessoa.filialId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }

    return this.ordemServicoService.create(
      dto,
      user.pessoa.filialId,
      user.empresaId,
    );
  }

  @Get()
  async getAllByFilial(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('clienteId') clienteId?: string,
    @Query('atendimentoId') atendimentoId?: string,
    @Query('laboratorioId') laboratorioId?: string,
    @Query('status') status?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @CurrentUser() user?: any,
  ) {
    if (!user || !user.pessoa || !user.pessoa.filialId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }

    return this.ordemServicoService.findAllByFilial(
      user.pessoa.filialId,
      user.empresaId,
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
  async getOrdemServicoById(@Param('id') id: string) {
    return this.ordemServicoService.findById(id);
  }

  @Put(':id')
  async updateOrdemServico(
    @Param('id') id: string,
    @Body() dto: UpdateOrdemServicoDto,
  ) {
    return this.ordemServicoService.update(id, dto);
  }

  @Delete(':id')
  async deleteOrdemServico(@Param('id') id: string) {
    return this.ordemServicoService.deleteById(id);
  }
}

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
} from '@nestjs/common';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import {
  CreateOrdemServicoDto,
  UpdateOrdemServicoDto,
} from './dto/ordem-servico.dto';
import { OrdemServicoService } from './ordem-servico.service';

@Controller('ordem-servico')
@UseGuards(AuthGuard, AcessoGuard)
export class OrdemServicoController {
  constructor(private readonly ordemServicoService: OrdemServicoService) {}

  @Post()
  async createOrdemServico(@Body() dto: CreateOrdemServicoDto) {
    return this.ordemServicoService.create(dto);
  }

  @Get('empresa/:empresaId')
  async getAllByEmpresa(
    @Param('empresaId') empresaId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('clienteId') clienteId?: string,
    @Query('atendimentoId') atendimentoId?: string,
    @Query('laboratorioId') laboratorioId?: string,
    @Query('status') status?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.ordemServicoService.findAllByEmpresa(
      empresaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
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

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StatusFinanceiro, TipoFinanceiro } from '@prisma/client';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import {
  BaixarLancamentoDto,
  CreateFinanceiroLancamentoDto,
  UpdateFinanceiroLancamentoDto,
} from './dto/financeiro-lancamento.dto';
import { FinanceiroLancamentoService } from './financeiro-lancamento.service';

const tipoPipe = new ParseEnumPipe(TipoFinanceiro, {
  optional: true,
  exceptionFactory: () =>
    new BadRequestException('O tipo deve ser receita ou despesa.'),
});

const statusPipe = new ParseEnumPipe(StatusFinanceiro, {
  optional: true,
  exceptionFactory: () =>
    new BadRequestException('O status deve ser pendente, pago ou cancelado.'),
});

@Controller('financeiro-lancamento')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class FinanceiroLancamentoController {
  constructor(
    private readonly financeiroService: FinanceiroLancamentoService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateFinanceiroLancamentoDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.financeiroService.create(dto, escopo);
  }

  @Get()
  async findAll(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('tipo', tipoPipe) tipo?: TipoFinanceiro,
    @Query('status', statusPipe) status?: StatusFinanceiro,
    @Query('vencidos') vencidos?: string,
    @Query('categoria') categoria?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.financeiroService.findAll(escopo, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search: search ?? '',
      tipo,
      status,
      vencidos: vencidos === 'true',
      categoria,
      dataInicio,
      dataFim,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.financeiroService.findById(id, escopo);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFinanceiroLancamentoDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.financeiroService.update(id, dto, escopo);
  }

  @Post(':id/baixar')
  @HttpCode(HttpStatus.OK)
  async baixar(
    @Param('id') id: string,
    @Body() dto: BaixarLancamentoDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.financeiroService.baixar(id, dto, escopo);
  }

  @Post(':id/estornar')
  @HttpCode(HttpStatus.OK)
  async estornar(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.financeiroService.estornar(id, escopo);
  }

  @Post(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  async cancelar(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.financeiroService.cancelar(id, escopo);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.financeiroService.deleteById(id, escopo);
  }
}

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
  CreateFinanceiroLancamentoDto,
  UpdateFinanceiroLancamentoDto,
} from './dto/financeiro-lancamento.dto';
import { FinanceiroLancamentoService } from './financeiro-lancamento.service';

@Controller('financeiro-lancamento')
@UseGuards(AuthGuard, AcessoGuard)
export class FinanceiroLancamentoController {
  constructor(
    private readonly financeiroLancamentoService: FinanceiroLancamentoService,
  ) {}

  @Post()
  async createFinanceiroLancamento(@Body() dto: CreateFinanceiroLancamentoDto) {
    return this.financeiroLancamentoService.create(dto);
  }

  @Get('empresa/:empresaId')
  async getAllByEmpresa(
    @Param('empresaId') empresaId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('tipo') tipo?: string,
    @Query('status') status?: string,
    @Query('categoria') categoria?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.financeiroLancamentoService.findAllByEmpresa(
      empresaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      tipo,
      status,
      categoria,
      dataInicio,
      dataFim,
    );
  }

  @Get(':id')
  async getFinanceiroLancamentoById(@Param('id') id: string) {
    return this.financeiroLancamentoService.findById(id);
  }

  @Put(':id')
  async updateFinanceiroLancamento(
    @Param('id') id: string,
    @Body() dto: UpdateFinanceiroLancamentoDto,
  ) {
    return this.financeiroLancamentoService.update(id, dto);
  }

  @Delete(':id')
  async deleteFinanceiroLancamento(@Param('id') id: string) {
    return this.financeiroLancamentoService.deleteById(id);
  }
}

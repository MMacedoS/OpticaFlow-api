import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TipoMovimentoEstoque } from '@prisma/client';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import { CreateMovimentoEstoqueDto } from './dto/movimento-estoque.dto';
import { MovimentoEstoqueService } from './movimento-estoque.service';

const tipoOpcionalPipe = new ParseEnumPipe(TipoMovimentoEstoque, {
  optional: true,
  exceptionFactory: () =>
    new BadRequestException('O tipo deve ser entrada, saida ou ajuste.'),
});

/** Movimentacoes sao imutaveis: correcoes sao feitas com nova movimentacao. */
@Controller('movimento-estoque')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class MovimentoEstoqueController {
  constructor(private readonly movimentoService: MovimentoEstoqueService) {}

  @Post()
  async create(
    @Body() dto: CreateMovimentoEstoqueDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.movimentoService.create(dto, escopo);
  }

  @Get()
  async findAll(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('estoqueId') estoqueId?: string,
    @Query('produtoId') produtoId?: string,
    @Query('tipo', tipoOpcionalPipe) tipo?: TipoMovimentoEstoque,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.movimentoService.findAll(escopo, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      estoqueId,
      produtoId,
      tipo,
      dataInicio,
      dataFim,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.movimentoService.findById(id, escopo);
  }
}

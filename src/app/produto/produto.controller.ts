import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Status, TipoProduto } from '@prisma/client';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import {
  CreateProdutoDto,
  UpdateProdutoDto,
  UpdateStatusDto,
} from './dto/produto.dto';
import { ProdutoService } from './produto.service';

const tipoPipe = new ParseEnumPipe(TipoProduto, {
  optional: true,
  exceptionFactory: () => new BadRequestException('Tipo de produto inválido.'),
});

const statusPipe = new ParseEnumPipe(Status, {
  optional: true,
  exceptionFactory: () =>
    new BadRequestException('O status deve ser ativo ou inativo.'),
});

@Controller('produto')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class ProdutoController {
  constructor(private readonly produtoService: ProdutoService) {}

  @Post()
  async create(@Body() dto: CreateProdutoDto, @Escopo() escopo: EscopoUsuario) {
    return this.produtoService.create(dto, escopo);
  }

  @Get()
  async findAll(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('tipo', tipoPipe) tipo?: TipoProduto,
    @Query('ativo', statusPipe) ativo?: Status,
  ) {
    return this.produtoService.findAll(escopo, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search: search ?? '',
      tipo,
      ativo,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.produtoService.findById(id, escopo);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProdutoDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.produtoService.update(id, dto, escopo);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.produtoService.updateStatus(id, dto.status, escopo);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.produtoService.deleteById(id, escopo);
  }
}

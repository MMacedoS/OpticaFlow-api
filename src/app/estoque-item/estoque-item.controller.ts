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
} from '@nestjs/common';
import { TipoProduto } from '@prisma/client';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import {
  CreateEstoqueItemDto,
  UpdateEstoqueItemDto,
} from './dto/estoque-item.dto';
import { EstoqueItemService } from './estoque-item.service';

const tipoProdutoPipe = new ParseEnumPipe(TipoProduto, {
  optional: true,
  exceptionFactory: () => new BadRequestException('Tipo de produto inválido.'),
});

@Controller('estoque-item')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class EstoqueItemController {
  constructor(private readonly estoqueItemService: EstoqueItemService) {}

  @Post()
  async create(
    @Body() dto: CreateEstoqueItemDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.estoqueItemService.create(dto, escopo);
  }

  @Get()
  async findAll(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('estoqueId') estoqueId?: string,
    @Query('tipo', tipoProdutoPipe) tipo?: TipoProduto,
    @Query('abaixoMinimo') abaixoMinimo?: string,
  ) {
    return this.estoqueItemService.findAll(escopo, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search: search ?? '',
      estoqueId,
      tipo,
      abaixoMinimo: abaixoMinimo === 'true',
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.estoqueItemService.findById(id, escopo);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEstoqueItemDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.estoqueItemService.update(id, dto, escopo);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.estoqueItemService.deleteById(id, escopo);
  }
}

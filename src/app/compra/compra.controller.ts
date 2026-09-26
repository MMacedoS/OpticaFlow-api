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
import { StatusCompra } from '@prisma/client';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import { CompraService } from './compra.service';
import {
  CreateCompraDto,
  ReceberCompraDto,
  UpdateCompraDto,
} from './dto/compra.dto';

const statusPipe = new ParseEnumPipe(StatusCompra, {
  optional: true,
  exceptionFactory: () =>
    new BadRequestException(
      'O status deve ser rascunho, recebida ou cancelada.',
    ),
});

@Controller('compra')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class CompraController {
  constructor(private readonly compraService: CompraService) {}

  @Post()
  async create(@Body() dto: CreateCompraDto, @Escopo() escopo: EscopoUsuario) {
    return this.compraService.create(dto, escopo);
  }

  @Get()
  async findAll(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status', statusPipe) status?: StatusCompra,
    @Query('fornecedorId') fornecedorId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.compraService.findAll(escopo, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search: search ?? '',
      status,
      fornecedorId,
      dataInicio,
      dataFim,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.compraService.findById(id, escopo);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCompraDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.compraService.update(id, dto, escopo);
  }

  @Post(':id/receber')
  async receber(
    @Param('id') id: string,
    @Body() dto: ReceberCompraDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.compraService.receber(id, dto, escopo);
  }

  @Post(':id/cancelar')
  async cancelar(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.compraService.cancelar(id, escopo);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.compraService.deleteById(id, escopo);
  }
}

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
import { StatusVenda } from '@prisma/client';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import {
  CreateVendaDto,
  FinalizarVendaDto,
  UpdateVendaDto,
} from './dto/venda.dto';
import { VendaService } from './venda.service';

const statusPipe = new ParseEnumPipe(StatusVenda, {
  optional: true,
  exceptionFactory: () =>
    new BadRequestException(
      'O status deve ser aberta, finalizada ou cancelada.',
    ),
});

@Controller('venda')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class VendaController {
  constructor(private readonly vendaService: VendaService) {}

  @Post()
  async create(@Body() dto: CreateVendaDto, @Escopo() escopo: EscopoUsuario) {
    return this.vendaService.create(dto, escopo);
  }

  @Post('ordem-servico/:ordemServicoId')
  async createFromOrdemServico(
    @Param('ordemServicoId') ordemServicoId: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.vendaService.createFromOrdemServico(ordemServicoId, escopo);
  }

  @Get()
  async findAll(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status', statusPipe) status?: StatusVenda,
    @Query('clienteId') clienteId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.vendaService.findAll(escopo, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search: search ?? '',
      status,
      clienteId,
      dataInicio,
      dataFim,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.vendaService.findById(id, escopo);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVendaDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.vendaService.update(id, dto, escopo);
  }

  @Post(':id/finalizar')
  async finalizar(
    @Param('id') id: string,
    @Body() dto: FinalizarVendaDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.vendaService.finalizar(id, dto, escopo);
  }

  @Post(':id/cancelar')
  async cancelar(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.vendaService.cancelar(id, escopo);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.vendaService.deleteById(id, escopo);
  }
}

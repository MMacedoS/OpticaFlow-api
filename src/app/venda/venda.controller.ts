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
import { CreateVendaDto, UpdateVendaDto } from './dto/venda.dto';
import { VendaService } from './venda.service';

@Controller('venda')
@UseGuards(AuthGuard, AcessoGuard)
export class VendaController {
  constructor(private readonly vendaService: VendaService) {}

  @Post()
  async createVenda(@Body() dto: CreateVendaDto) {
    return this.vendaService.create(dto);
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
    @Query('status') status?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.vendaService.findAllByEmpresa(
      empresaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      clienteId,
      atendimentoId,
      status,
      dataInicio,
      dataFim,
    );
  }

  @Get(':id')
  async getVendaById(@Param('id') id: string) {
    return this.vendaService.findById(id);
  }

  @Put(':id')
  async updateVenda(@Param('id') id: string, @Body() dto: UpdateVendaDto) {
    return this.vendaService.update(id, dto);
  }

  @Delete(':id')
  async deleteVenda(@Param('id') id: string) {
    return this.vendaService.deleteById(id);
  }
}

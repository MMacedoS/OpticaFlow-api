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
import { CreateCompraDto, UpdateCompraDto } from './dto/compra.dto';
import { CompraService } from './compra.service';

@Controller('compra')
@UseGuards(AuthGuard, AcessoGuard)
export class CompraController {
  constructor(private readonly compraService: CompraService) {}

  @Post()
  async createCompra(@Body() dto: CreateCompraDto) {
    return this.compraService.create(dto);
  }

  @Get('empresa/:empresaId')
  async getAllByEmpresa(
    @Param('empresaId') empresaId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('fornecedorId') fornecedorId?: string,
    @Query('status') status?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.compraService.findAllByEmpresa(
      empresaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      fornecedorId,
      status,
      dataInicio,
      dataFim,
    );
  }

  @Get(':id')
  async getCompraById(@Param('id') id: string) {
    return this.compraService.findById(id);
  }

  @Put(':id')
  async updateCompra(@Param('id') id: string, @Body() dto: UpdateCompraDto) {
    return this.compraService.update(id, dto);
  }

  @Delete(':id')
  async deleteCompra(@Param('id') id: string) {
    return this.compraService.deleteById(id);
  }
}

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
import { TipoMovimentoEstoque } from '@prisma/client';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import {
  CreateMovimentoEstoqueDto,
  UpdateMovimentoEstoqueDto,
} from './dto/movimento-estoque.dto';
import { MovimentoEstoqueService } from './movimento-estoque.service';

@Controller('movimento-estoque')
@UseGuards(AuthGuard, AcessoGuard)
export class MovimentoEstoqueController {
  constructor(
    private readonly movimentoEstoqueService: MovimentoEstoqueService,
  ) {}

  @Post()
  async createMovimento(@Body() dto: CreateMovimentoEstoqueDto) {
    return this.movimentoEstoqueService.create(dto);
  }

  @Get('empresa/:empresaId')
  async getAllByEmpresa(
    @Param('empresaId') empresaId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tipo') tipo?: TipoMovimentoEstoque,
    @Query('estoqueId') estoqueId?: string,
    @Query('produtoId') produtoId?: string,
  ) {
    return this.movimentoEstoqueService.findAllByEmpresa(
      empresaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      tipo,
      estoqueId,
      produtoId,
    );
  }

  @Get(':id')
  async getMovimentoById(@Param('id') id: string) {
    return this.movimentoEstoqueService.findById(id);
  }

  @Put(':id')
  async updateMovimento(
    @Param('id') id: string,
    @Body() dto: UpdateMovimentoEstoqueDto,
  ) {
    return this.movimentoEstoqueService.update(id, dto);
  }

  @Delete(':id')
  async deleteMovimento(@Param('id') id: string) {
    return this.movimentoEstoqueService.deleteById(id);
  }
}

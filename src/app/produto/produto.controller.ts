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
import { TipoProduto } from '@prisma/client';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { CreateProdutoDto, UpdateProdutoDto } from './dto/produto.dto';
import { ProdutoService } from './produto.service';

@Controller('produto')
@UseGuards(AuthGuard, AcessoGuard)
export class ProdutoController {
  constructor(private readonly produtoService: ProdutoService) {}

  @Post()
  async createProduto(@Body() dto: CreateProdutoDto) {
    return this.produtoService.create(dto);
  }

  @Get('empresa/:empresaId')
  async getAllByEmpresa(
    @Param('empresaId') empresaId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('tipo') tipo?: TipoProduto,
    @Query('ativo') ativo?: string,
  ) {
    return this.produtoService.findAllByEmpresa(
      empresaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      tipo,
      this.parseBooleanQuery(ativo),
    );
  }

  @Get(':id')
  async getProdutoById(@Param('id') id: string) {
    return this.produtoService.findById(id);
  }

  @Put(':id')
  async updateProduto(@Param('id') id: string, @Body() dto: UpdateProdutoDto) {
    return this.produtoService.update(id, dto);
  }

  @Delete(':id')
  async deleteProduto(@Param('id') id: string) {
    return this.produtoService.deleteById(id);
  }

  private parseBooleanQuery(value?: string): boolean | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return undefined;
  }
}

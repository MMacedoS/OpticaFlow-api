import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TipoProduto } from '@prisma/client';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import {
  CreateProdutoDto,
  UpdateProdutoDto,
  UpdateStatusDto,
} from './dto/produto.dto';
import { ProdutoService } from './produto.service';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import { CurrentUser } from 'src/decorators/current-user.decorator/current-user.decorator';
import { Status } from '@prisma/client';

@Controller('products')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class ProdutoController {
  constructor(private readonly produtoService: ProdutoService) {}

  @Post()
  async createProduto(
    @Body() dto: CreateProdutoDto,
    @CurrentUser() user?: any,
  ) {
    if (!user || !user.empresaId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }
    dto.empresaId = user.empresaId;
    dto.filialId = user.pessoa?.filialId;
    return this.produtoService.create(dto);
  }

  @Get()
  async getAllByEmpresa(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('tipo') tipo?: TipoProduto,
    @Query('ativo') ativo?: Status,
    @CurrentUser() user?: any,
  ) {
    if (!user || !user.empresaId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }

    return this.produtoService.findAllByEmpresa(
      user.empresaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      tipo,
      ativo,
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

  @Patch(':id/status')
  async updateProdutoStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto, // Captura do corpo da requisição de forma segura
  ) {
    // Passa o valor do DTO diretamente para o parâmetro 'ativo' do Service
    return this.produtoService.updateStatus(id, dto.status);
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

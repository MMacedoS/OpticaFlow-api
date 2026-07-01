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
import { CreateEstoqueDto, UpdateEstoqueDto } from './dto/estoque.dto';
import { EstoqueService } from './estoque.service';

@Controller('estoque')
@UseGuards(AuthGuard, AcessoGuard)
export class EstoqueController {
  constructor(private readonly estoqueService: EstoqueService) {}

  @Post()
  async createEstoque(@Body() dto: CreateEstoqueDto) {
    return this.estoqueService.create(dto);
  }

  @Get('empresa/:empresaId')
  async getAllByEmpresa(
    @Param('empresaId') empresaId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('filialId') filialId?: string,
    @Query('search') search?: string,
  ) {
    return this.estoqueService.findAllByEmpresa(
      empresaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      filialId,
      search ?? '',
    );
  }

  @Get(':id')
  async getEstoqueById(@Param('id') id: string) {
    return this.estoqueService.findById(id);
  }

  @Put(':id')
  async updateEstoque(@Param('id') id: string, @Body() dto: UpdateEstoqueDto) {
    return this.estoqueService.update(id, dto);
  }

  @Delete(':id')
  async deleteEstoque(@Param('id') id: string) {
    return this.estoqueService.deleteById(id);
  }
}

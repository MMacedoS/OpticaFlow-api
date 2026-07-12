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
import {
  CreateEstoqueItemDto,
  UpdateEstoqueItemDto,
} from './dto/estoque-item.dto';
import { EstoqueItemService } from './estoque-item.service';

@Controller('estoque-item')
@UseGuards(AuthGuard, AcessoGuard)
export class EstoqueItemController {
  constructor(private readonly estoqueItemService: EstoqueItemService) {}

  @Post()
  async createEstoqueItem(@Body() dto: CreateEstoqueItemDto) {
    return this.estoqueItemService.create(dto);
  }

  @Get('estoque/:estoqueId')
  async getAllByEstoque(
    @Param('estoqueId') estoqueId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.estoqueItemService.findAllByEstoque(
      estoqueId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
    );
  }

  @Get(':id')
  async getEstoqueItemById(@Param('id') id: string) {
    return this.estoqueItemService.findById(id);
  }

  @Put(':id')
  async updateEstoqueItem(
    @Param('id') id: string,
    @Body() dto: UpdateEstoqueItemDto,
  ) {
    return this.estoqueItemService.update(id, dto);
  }

  @Delete(':id')
  async deleteEstoqueItem(@Param('id') id: string) {
    return this.estoqueItemService.deleteById(id);
  }
}

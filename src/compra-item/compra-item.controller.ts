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
  CreateCompraItemDto,
  UpdateCompraItemDto,
} from './dto/compra-item.dto';
import { CompraItemService } from './compra-item.service';

@Controller('compra-item')
@UseGuards(AuthGuard, AcessoGuard)
export class CompraItemController {
  constructor(private readonly compraItemService: CompraItemService) {}

  @Post()
  async createCompraItem(@Body() dto: CreateCompraItemDto) {
    return this.compraItemService.create(dto);
  }

  @Get('compra/:compraId')
  async getAllByCompra(
    @Param('compraId') compraId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.compraItemService.findAllByCompra(
      compraId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get(':id')
  async getCompraItemById(@Param('id') id: string) {
    return this.compraItemService.findById(id);
  }

  @Put(':id')
  async updateCompraItem(
    @Param('id') id: string,
    @Body() dto: UpdateCompraItemDto,
  ) {
    return this.compraItemService.update(id, dto);
  }

  @Delete(':id')
  async deleteCompraItem(@Param('id') id: string) {
    return this.compraItemService.deleteById(id);
  }
}

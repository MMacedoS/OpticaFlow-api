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
  CreateVendaItemDto,
  UpdateVendaItemDto,
} from './dto/venda-item.dto';
import { VendaItemService } from './venda-item.service';

@Controller('venda-item')
@UseGuards(AuthGuard, AcessoGuard)
export class VendaItemController {
  constructor(private readonly vendaItemService: VendaItemService) {}

  @Post()
  async createVendaItem(@Body() dto: CreateVendaItemDto) {
    return this.vendaItemService.create(dto);
  }

  @Get('venda/:vendaId')
  async getAllByVenda(
    @Param('vendaId') vendaId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.vendaItemService.findAllByVenda(
      vendaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get(':id')
  async getVendaItemById(@Param('id') id: string) {
    return this.vendaItemService.findById(id);
  }

  @Put(':id')
  async updateVendaItem(
    @Param('id') id: string,
    @Body() dto: UpdateVendaItemDto,
  ) {
    return this.vendaItemService.update(id, dto);
  }

  @Delete(':id')
  async deleteVendaItem(@Param('id') id: string) {
    return this.vendaItemService.deleteById(id);
  }
}

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
  CreateOrdemServicoItemDto,
  UpdateOrdemServicoItemDto,
} from './dto/ordem-servico-item.dto';
import { OrdemServicoItemService } from './ordem-servico-item.service';

@Controller('ordem-servico-item')
@UseGuards(AuthGuard, AcessoGuard)
export class OrdemServicoItemController {
  constructor(
    private readonly ordemServicoItemService: OrdemServicoItemService,
  ) {}

  @Post()
  async createOrdemServicoItem(@Body() dto: CreateOrdemServicoItemDto) {
    return this.ordemServicoItemService.create(dto);
  }

  @Get('ordem-servico/:ordemServicoId')
  async getAllByOrdemServico(
    @Param('ordemServicoId') ordemServicoId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordemServicoItemService.findAllByOrdemServico(
      ordemServicoId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get(':id')
  async getOrdemServicoItemById(@Param('id') id: string) {
    return this.ordemServicoItemService.findById(id);
  }

  @Put(':id')
  async updateOrdemServicoItem(
    @Param('id') id: string,
    @Body() dto: UpdateOrdemServicoItemDto,
  ) {
    return this.ordemServicoItemService.update(id, dto);
  }

  @Delete(':id')
  async deleteOrdemServicoItem(@Param('id') id: string) {
    return this.ordemServicoItemService.deleteById(id);
  }
}

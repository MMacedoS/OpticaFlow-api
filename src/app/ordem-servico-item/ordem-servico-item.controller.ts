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
  UseInterceptors,
} from '@nestjs/common';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import {
  CreateOrdemServicoItemDto,
  UpdateOrdemServicoItemDto,
} from './dto/ordem-servico-item.dto';
import { OrdemServicoItemService } from './ordem-servico-item.service';

@Controller('ordem-servico-item')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class OrdemServicoItemController {
  constructor(
    private readonly ordemServicoItemService: OrdemServicoItemService,
  ) {}

  @Post()
  async createOrdemServicoItem(
    @Body() dto: CreateOrdemServicoItemDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.ordemServicoItemService.create(dto, escopo);
  }

  @Get('ordem-servico/:ordemServicoId')
  async getAllByOrdemServico(
    @Param('ordemServicoId') ordemServicoId: string,
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordemServicoItemService.findAllByOrdemServico(
      ordemServicoId,
      escopo,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get(':id')
  async getOrdemServicoItemById(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.ordemServicoItemService.findById(id, escopo);
  }

  @Put(':id')
  async updateOrdemServicoItem(
    @Param('id') id: string,
    @Body() dto: UpdateOrdemServicoItemDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.ordemServicoItemService.update(id, dto, escopo);
  }

  @Delete(':id')
  async deleteOrdemServicoItem(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.ordemServicoItemService.deleteById(id, escopo);
  }
}

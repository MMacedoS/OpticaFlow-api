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
  CreateLaboratorioDto,
  UpdateLaboratorioDto,
} from './dto/laboratorio.dto';
import { LaboratorioService } from './laboratorio.service';

@Controller('laboratorio')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class LaboratorioController {
  constructor(private readonly laboratorioService: LaboratorioService) {}

  @Post()
  async createLaboratorio(
    @Body() dto: CreateLaboratorioDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.laboratorioService.create(dto, escopo);
  }

  @Get()
  async getAll(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('ativo') ativo?: string,
  ) {
    return this.laboratorioService.findAll(escopo, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search: search ?? '',
      ativo: ativo === undefined ? undefined : ativo === 'true',
    });
  }

  @Get(':id')
  async getLaboratorioById(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.laboratorioService.findById(id, escopo);
  }

  @Put(':id')
  async updateLaboratorio(
    @Param('id') id: string,
    @Body() dto: UpdateLaboratorioDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.laboratorioService.update(id, dto, escopo);
  }

  @Delete(':id')
  async deleteLaboratorio(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.laboratorioService.deleteById(id, escopo);
  }
}

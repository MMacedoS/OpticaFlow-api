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
  CreateResponsavelDto,
  UpdateResponsavelDto,
} from './dto/responsavel.dto';
import { ResponsavelService } from './responsavel.service';

@Controller('responsavel')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class ResponsavelController {
  constructor(private readonly responsavelService: ResponsavelService) {}

  @Post()
  async createResponsavel(
    @Body() dto: CreateResponsavelDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.responsavelService.create(dto, escopo);
  }

  @Get('filial/:filialId')
  async getAllByFilial(
    @Param('filialId') filialId: string,
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const responsaveis = await this.responsavelService.findAllByFilial(
      filialId,
      escopo,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
    );

    if (!responsaveis || responsaveis.length === 0) {
      return { error: 'Nenhum responsável encontrado' };
    }

    return responsaveis;
  }

  @Get(':id')
  async getResponsavelById(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.responsavelService.findById(id, escopo);
  }

  @Put(':id')
  async updateResponsavel(
    @Param('id') id: string,
    @Body() dto: UpdateResponsavelDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.responsavelService.update(id, dto, escopo);
  }

  @Delete(':id')
  async deleteResponsavel(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.responsavelService.deleteById(id, escopo);
  }
}

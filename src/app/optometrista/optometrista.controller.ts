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
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { resolverFiltroFilial } from 'src/common/escopo/filtro-filial';
import { PrismaService } from 'src/prisma/prisma.service';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { OptometristaService } from './optometrista.service';
import { CreateDto, UpdateDto } from './dto/optometrista.dto';
import { Status } from '@prisma/client';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import { CurrentUser } from 'src/decorators/current-user.decorator/current-user.decorator';

@Controller('optometrista')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class OptometristaController {
  constructor(
    private readonly optometristaService: OptometristaService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async createOptometrista(@Body() dto: CreateDto, @CurrentUser() user?: any) {
    if (!user || !user.pessoa || !user.pessoa.filialId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }

    dto.pessoa.filialId = user.pessoa.filialId;
    return this.optometristaService.create(dto);
  }

  @Get()
  async getAllByFilial(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
  ) {
    const filtroPessoa = await resolverFiltroFilial(
      this.prisma,
      escopo,
      filialId,
    );

    const optometristas = await this.optometristaService.findAllByFilial(
      filtroPessoa,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
    );

    return optometristas;
  }

  /** Lista completa (sem paginacao) para selects do frontend. */
  @Get('list')
  async getAllByFilialList(
    @Escopo() escopo: EscopoUsuario,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
  ) {
    const filtroPessoa = await resolverFiltroFilial(
      this.prisma,
      escopo,
      filialId,
    );

    return this.optometristaService.findAllByFilial(
      filtroPessoa,
      1,
      1000,
      search ?? '',
    );
  }

  @Get(':id')
  async getOptometristaById(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.optometristaService.findById(id, escopo);
  }

  @Put(':id')
  async updateOptometrista(
    @Param('id') id: string,
    @Body() dto: UpdateDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.optometristaService.update(id, dto, escopo);
  }

  @Patch(':id/status')
  async updateOptometristaStatus(
    @Param('id') id: string,
    @Body('status') status: Status,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.optometristaService.updateStatus(id, status, escopo);
  }

  @Delete(':id')
  async deleteOptometrista(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.optometristaService.deleteById(id, escopo);
  }
}

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
import { OftalmologistaService } from './oftalmologista.service';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import { CreateDto, UpdateDto } from './dto/oftalmologista.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator/current-user.decorator';
import { Status } from '@prisma/client';

@Controller('oftalmologista')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class OftalmologistaController {
  constructor(
    private readonly oftalmologistaService: OftalmologistaService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async createOftalmologista(
    @Body() dto: CreateDto,
    @CurrentUser() user?: any,
  ) {
    if (!user || !user.pessoa || !user.pessoa.filialId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }

    dto.pessoa.filialId = user.pessoa.filialId;
    return this.oftalmologistaService.create(dto);
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

    const oftalmologistas = await this.oftalmologistaService.findAllByFilial(
      filtroPessoa,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
    );

    return oftalmologistas;
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

    return this.oftalmologistaService.findAllByFilial(
      filtroPessoa,
      1,
      1000,
      search ?? '',
    );
  }

  @Get(':id')
  async getOftalmologistaById(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.oftalmologistaService.findById(id, escopo);
  }

  @Put(':id')
  async updateOftalmologista(
    @Param('id') id: string,
    @Body() dto: UpdateDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.oftalmologistaService.update(id, dto, escopo);
  }

  @Patch(':id/status')
  async updateOftalmologistaStatus(
    @Param('id') id: string,
    @Body('status') status: Status,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.oftalmologistaService.updateStatus(id, status, escopo);
  }

  @Delete(':id')
  async deleteOftalmologista(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.oftalmologistaService.deleteById(id, escopo);
  }
}

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
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import { PessoaService } from './pessoa.service';
import { CurrentUser } from 'src/decorators/current-user.decorator/current-user.decorator';
import { PessoaDto } from './dto/pessoa';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { Status } from '@prisma/client';

@Controller('pessoa')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class PessoaController {
  constructor(
    private readonly pessoaService: PessoaService,
    private readonly prisma: PrismaService,
  ) {}

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

    const pessoas = await this.pessoaService.findAllByFilial(
      filtroPessoa,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
    );

    return pessoas;
  }

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

    const pessoas = await this.pessoaService.findAllByFilial(
      filtroPessoa,
      1,
      1000,
      search ?? '',
    );

    return pessoas;
  }

  @Post()
  async create(@Body() dto: PessoaDto, @CurrentUser() user?: any) {
    if (!user || !user.pessoa || !user.pessoa.filialId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }
    dto.filialId = user.pessoa.filialId;
    return this.pessoaService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: PessoaDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.pessoaService.update(id, dto, escopo);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: Status,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.pessoaService.updateStatus(id, status, escopo);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.pessoaService.delete(id, escopo);
  }
}

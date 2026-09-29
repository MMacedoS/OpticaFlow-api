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
import { ClienteService } from './cliente.service';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { resolverFiltroFilial } from 'src/common/escopo/filtro-filial';
import { PrismaService } from 'src/prisma/prisma.service';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator/current-user.decorator';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import { ClienteDto, updateClienteDto } from './cliente.dto/cliente.dto';
import { Status } from '@prisma/client';

@Controller('cliente')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class ClienteController {
  constructor(
    private readonly clienteService: ClienteService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getAllClientes(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('filialId') filialId?: string,
  ) {
    const filtroPessoa = await resolverFiltroFilial(
      this.prisma,
      escopo,
      filialId,
    );

    return this.clienteService.findAllByFilialId(filtroPessoa, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search: search ?? '',
    });
  }

  @Post()
  async create(@Body() dto: ClienteDto, @CurrentUser() user?: any) {
    if (!user) {
      return { status: 401, message: 'Usuário não autenticado.' };
    }

    return this.clienteService.create(dto, user);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: updateClienteDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.clienteService.update(id, dto, escopo);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: Status,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.clienteService.updateStatus(id, status, escopo);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.clienteService.deleteById(id, escopo);
  }
}

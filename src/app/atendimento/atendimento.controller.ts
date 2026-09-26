import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { StatusAtendimento } from '@prisma/client';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import { AtendimentoService } from './atendimento.service';
import {
  CreateAtendimentoDto,
  UpdateAtendimentoDto,
} from './dto/atendimento.dto';

const statusInvalido = () =>
  new BadRequestException('Status de atendimento inválido.');

const statusOpcionalPipe = new ParseEnumPipe(StatusAtendimento, {
  optional: true,
  exceptionFactory: statusInvalido,
});

const statusObrigatorioPipe = new ParseEnumPipe(StatusAtendimento, {
  exceptionFactory: statusInvalido,
});

@Controller('atendimento')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class AtendimentoController {
  constructor(private readonly atendimentoService: AtendimentoService) {}

  @Post()
  async createAtendimento(
    @Body() dto: CreateAtendimentoDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.atendimentoService.create(dto, escopo);
  }

  @Get()
  async getAll(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status', statusOpcionalPipe) status?: StatusAtendimento,
    @Query('profissionalId') profissionalId?: string,
    @Query('pacienteId') pacienteId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.atendimentoService.findAll(escopo, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search: search ?? '',
      status,
      profissionalId,
      pacienteId,
      dataInicio,
      dataFim,
    });
  }

  @Get(':id')
  async getAtendimentoById(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.atendimentoService.findById(id, escopo);
  }

  @Put(':id')
  async updateAtendimento(
    @Param('id') id: string,
    @Body() dto: UpdateAtendimentoDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.atendimentoService.update(id, dto, escopo);
  }

  @Patch(':id/status')
  async updateAtendimentoStatus(
    @Param('id') id: string,
    @Body('status', statusObrigatorioPipe) status: StatusAtendimento,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.atendimentoService.updateStatus(id, status, escopo);
  }

  @Delete(':id')
  async deleteAtendimento(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.atendimentoService.deleteById(id, escopo);
  }
}

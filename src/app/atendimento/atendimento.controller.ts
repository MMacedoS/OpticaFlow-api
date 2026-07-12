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
import { StatusAtendimento } from '@prisma/client';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import {
  CreateAtendimentoDto,
  UpdateAtendimentoDto,
} from './dto/atendimento.dto';
import { AtendimentoService } from './atendimento.service';

@Controller('atendimento')
@UseGuards(AuthGuard, AcessoGuard)
export class AtendimentoController {
  constructor(private readonly atendimentoService: AtendimentoService) {}

  @Post()
  async createAtendimento(@Body() dto: CreateAtendimentoDto) {
    return this.atendimentoService.create(dto);
  }

  @Get('filial/:filialId')
  async getAllByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: StatusAtendimento,
    @Query('profissionalId') profissionalId?: string,
    @Query('pacienteId') pacienteId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const atendimentos = await this.atendimentoService.findAllByFilial(
      filialId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      status,
      profissionalId,
      pacienteId,
      dataInicio,
      dataFim,
    );

    if (!atendimentos || atendimentos.length === 0) {
      return { error: 'Nenhum atendimento encontrado' };
    }

    return atendimentos;
  }

  @Get(':id')
  async getAtendimentoById(@Param('id') id: string) {
    return this.atendimentoService.findById(id);
  }

  @Put(':id')
  async updateAtendimento(
    @Param('id') id: string,
    @Body() dto: UpdateAtendimentoDto,
  ) {
    return this.atendimentoService.update(id, dto);
  }

  @Delete(':id')
  async deleteAtendimento(@Param('id') id: string) {
    return this.atendimentoService.deleteById(id);
  }
}

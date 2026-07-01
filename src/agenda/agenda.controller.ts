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
import { StatusAgenda } from '@prisma/client';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { CreateAgendaDto, UpdateAgendaDto } from './dto/agenda.dto';
import { AgendaService } from './agenda.service';

@Controller('agenda')
@UseGuards(AuthGuard, AcessoGuard)
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post()
  async createAgenda(@Body() dto: CreateAgendaDto) {
    return this.agendaService.create(dto);
  }

  @Get('filial/:filialId')
  async getAllByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: StatusAgenda,
    @Query('profissionalId') profissionalId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const agendas = await this.agendaService.findAllByFilial(
      filialId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      status,
      profissionalId,
      dataInicio,
      dataFim,
    );

    if (!agendas || agendas.length === 0) {
      return { error: 'Nenhuma agenda encontrada' };
    }

    return agendas;
  }

  @Get(':id')
  async getAgendaById(@Param('id') id: string) {
    return this.agendaService.findById(id);
  }

  @Put(':id')
  async updateAgenda(@Param('id') id: string, @Body() dto: UpdateAgendaDto) {
    return this.agendaService.update(id, dto);
  }

  @Delete(':id')
  async deleteAgenda(@Param('id') id: string) {
    return this.agendaService.deleteById(id);
  }
}

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
import { StatusAgenda } from '@prisma/client';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { CreateAgendaDto, UpdateAgendaDto } from './dto/agenda.dto';
import { AgendaService } from './agenda.service';
import { CurrentUser } from 'src/decorators/current-user.decorator/current-user.decorator';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';

@Controller('schedules')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post()
  async createAgenda(@Body() dto: CreateAgendaDto, @CurrentUser() user?: any) {
    if (!user || !user.pessoa || !user.pessoa.filialId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }
    dto.filialId = user.pessoa.filialId;
    return this.agendaService.create(dto);
  }

  @Get()
  async getAllByFilial(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: StatusAgenda,
    @Query('profissionalId') profissionalId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @CurrentUser() user?: any,
  ) {
    if (!user || !user.pessoa || !user.pessoa.filialId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }

    const agendas = await this.agendaService.findAllByFilial(
      user.pessoa.filialId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      status,
      profissionalId,
      dataInicio,
      dataFim,
    );

    return agendas;
  }

  @Get(':id')
  async getAgendaById(@Param('id') id: string) {
    return this.agendaService.findById(id);
  }

  @Put(':id')
  async updateAgenda(@Param('id') id: string, @Body() dto: UpdateAgendaDto) {
    return this.agendaService.update(dto);
  }

  @Delete(':id')
  async deleteAgenda(@Param('id') id: string) {
    return this.agendaService.deleteById(id);
  }
}

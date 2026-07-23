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
import { StatusAtendimento } from '@prisma/client';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import {
  CreateAtendimentoDto,
  UpdateAtendimentoDto,
} from './dto/atendimento.dto';
import { AtendimentoService } from './atendimento.service';
import { CurrentUser } from 'src/decorators/current-user.decorator/current-user.decorator';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';

@Controller('Appointments')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class AtendimentoController {
  constructor(private readonly atendimentoService: AtendimentoService) {}

  @Post()
  async createAtendimento(@Body() dto: CreateAtendimentoDto) {
    return this.atendimentoService.create(dto);
  }

  @Get()
  async getAllByFilial(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: StatusAtendimento,
    @Query('profissionalId') profissionalId?: string,
    @Query('pacienteId') pacienteId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @CurrentUser() user?: any,
  ) {
    if (!user || !user.pessoa || !user.pessoa.filialId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }

    const atendimentos = await this.atendimentoService.findAllByFilial(
      user.pessoa.filialId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      status,
      profissionalId,
      pacienteId,
      dataInicio,
      dataFim,
    );

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

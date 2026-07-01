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
import { TipoReceita } from '@prisma/client';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import {
  CreateReceitaDto,
  CreateReceitaLenteContatoDto,
  CreateReceitaMedicamentoDto,
  CreateReceitaOculosDto,
  UpdateReceitaDto,
  UpdateReceitaLenteContatoDto,
  UpdateReceitaMedicamentoDto,
  UpdateReceitaOculosDto,
} from './dto/receita.dto';
import { ReceitaService } from './receita.service';

@Controller('receita')
@UseGuards(AuthGuard, AcessoGuard)
export class ReceitaController {
  constructor(private readonly receitaService: ReceitaService) {}

  @Post()
  async createReceita(@Body() dto: CreateReceitaDto) {
    return this.receitaService.create(dto);
  }

  @Get('filial/:filialId')
  async getAllByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('pacienteId') pacienteId?: string,
    @Query('profissionalId') profissionalId?: string,
    @Query('atendimentoId') atendimentoId?: string,
    @Query('prontuarioId') prontuarioId?: string,
    @Query('tipo') tipo?: TipoReceita,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const receitas = await this.receitaService.findAllByFilial(
      filialId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      pacienteId,
      profissionalId,
      atendimentoId,
      prontuarioId,
      tipo,
      dataInicio,
      dataFim,
    );

    if (!receitas || receitas.length === 0) {
      return { error: 'Nenhuma receita encontrada' };
    }

    return receitas;
  }

  @Get('profissional/:profissionalId')
  async getAllByProfissional(
    @Param('profissionalId') profissionalId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('pacienteId') pacienteId?: string,
    @Query('atendimentoId') atendimentoId?: string,
    @Query('prontuarioId') prontuarioId?: string,
    @Query('tipo') tipo?: TipoReceita,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const receitas = await this.receitaService.findAllByProfissional(
      profissionalId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      pacienteId,
      atendimentoId,
      prontuarioId,
      tipo,
      dataInicio,
      dataFim,
    );

    if (!receitas || receitas.length === 0) {
      return { error: 'Nenhuma receita encontrada' };
    }

    return receitas;
  }

  @Get('filial/:filialId/oculos')
  async getAllOculosByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('profissionalId') profissionalId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.receitaService.findAllOculos(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('profissional/:profissionalId/oculos')
  async getAllOculosByProfissional(
    @Param('profissionalId') profissionalId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.receitaService.findAllOculos(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('filial/:filialId/lente-contato')
  async getAllLentesContatoByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('profissionalId') profissionalId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.receitaService.findAllLentesContato(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('profissional/:profissionalId/lente-contato')
  async getAllLentesContatoByProfissional(
    @Param('profissionalId') profissionalId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.receitaService.findAllLentesContato(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('filial/:filialId/medicamento')
  async getAllMedicamentosByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('profissionalId') profissionalId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.receitaService.findAllMedicamentos(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('profissional/:profissionalId/medicamento')
  async getAllMedicamentosByProfissional(
    @Param('profissionalId') profissionalId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.receitaService.findAllMedicamentos(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Post(':receitaId/oculos')
  async createReceitaOculos(
    @Param('receitaId') receitaId: string,
    @Body() dto: CreateReceitaOculosDto,
  ) {
    return this.receitaService.createOculos(receitaId, dto);
  }

  @Get(':receitaId/oculos')
  async getReceitaOculos(@Param('receitaId') receitaId: string) {
    return this.receitaService.findOculosByReceitaId(receitaId);
  }

  @Put(':receitaId/oculos')
  async updateReceitaOculos(
    @Param('receitaId') receitaId: string,
    @Body() dto: UpdateReceitaOculosDto,
  ) {
    return this.receitaService.updateOculos(receitaId, dto);
  }

  @Delete(':receitaId/oculos')
  async deleteReceitaOculos(@Param('receitaId') receitaId: string) {
    return this.receitaService.deleteOculosByReceitaId(receitaId);
  }

  @Post(':receitaId/lente-contato')
  async createReceitaLenteContato(
    @Param('receitaId') receitaId: string,
    @Body() dto: CreateReceitaLenteContatoDto,
  ) {
    return this.receitaService.createLenteContato(receitaId, dto);
  }

  @Get(':receitaId/lente-contato')
  async getReceitaLenteContato(@Param('receitaId') receitaId: string) {
    return this.receitaService.findLenteContatoByReceitaId(receitaId);
  }

  @Put(':receitaId/lente-contato')
  async updateReceitaLenteContato(
    @Param('receitaId') receitaId: string,
    @Body() dto: UpdateReceitaLenteContatoDto,
  ) {
    return this.receitaService.updateLenteContato(receitaId, dto);
  }

  @Delete(':receitaId/lente-contato')
  async deleteReceitaLenteContato(@Param('receitaId') receitaId: string) {
    return this.receitaService.deleteLenteContatoByReceitaId(receitaId);
  }

  @Post(':receitaId/medicamento')
  async createReceitaMedicamento(
    @Param('receitaId') receitaId: string,
    @Body() dto: CreateReceitaMedicamentoDto,
  ) {
    return this.receitaService.createMedicamento(receitaId, dto);
  }

  @Get(':receitaId/medicamento')
  async getReceitaMedicamento(@Param('receitaId') receitaId: string) {
    return this.receitaService.findMedicamentoByReceitaId(receitaId);
  }

  @Put(':receitaId/medicamento')
  async updateReceitaMedicamento(
    @Param('receitaId') receitaId: string,
    @Body() dto: UpdateReceitaMedicamentoDto,
  ) {
    return this.receitaService.updateMedicamento(receitaId, dto);
  }

  @Delete(':receitaId/medicamento')
  async deleteReceitaMedicamento(@Param('receitaId') receitaId: string) {
    return this.receitaService.deleteMedicamentoByReceitaId(receitaId);
  }

  @Get(':id')
  async getReceitaById(@Param('id') id: string) {
    return this.receitaService.findById(id);
  }

  @Put(':id')
  async updateReceita(@Param('id') id: string, @Body() dto: UpdateReceitaDto) {
    return this.receitaService.update(id, dto);
  }

  @Delete(':id')
  async deleteReceita(@Param('id') id: string) {
    return this.receitaService.deleteById(id);
  }
}

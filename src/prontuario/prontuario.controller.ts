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
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import {
  CreateProntuarioAnamneseDto,
  CreateProntuarioAcuidadeVisualDto,
  CreateProntuarioBiomicroscopiaDto,
  CreateProntuarioCeratometriaDto,
  CreateProntuarioDiagnosticoDto,
  CreateProntuarioDto,
  CreateProntuarioEvolucaoClinicaDto,
  CreateProntuarioExameComplementarDto,
  CreateProntuarioFundoscopiaDto,
  CreateProntuarioPressaoIntraocularDto,
  CreateProntuarioRefracaoDto,
  UpdateProntuarioAnamneseDto,
  UpdateProntuarioAcuidadeVisualDto,
  UpdateProntuarioBiomicroscopiaDto,
  UpdateProntuarioCeratometriaDto,
  UpdateProntuarioDiagnosticoDto,
  UpdateProntuarioDto,
  UpdateProntuarioEvolucaoClinicaDto,
  UpdateProntuarioExameComplementarDto,
  UpdateProntuarioFundoscopiaDto,
  UpdateProntuarioPressaoIntraocularDto,
  UpdateProntuarioRefracaoDto,
} from './dto/prontuario.dto';
import { ProntuarioService } from './prontuario.service';

@Controller('prontuario')
@UseGuards(AuthGuard, AcessoGuard)
export class ProntuarioController {
  constructor(private readonly prontuarioService: ProntuarioService) {}

  @Post()
  async createProntuario(@Body() dto: CreateProntuarioDto) {
    return this.prontuarioService.create(dto);
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
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const prontuarios = await this.prontuarioService.findAllByFilial(
      filialId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      pacienteId,
      profissionalId,
      atendimentoId,
      dataInicio,
      dataFim,
    );

    if (!prontuarios || prontuarios.length === 0) {
      return { error: 'Nenhum prontuário encontrado' };
    }

    return prontuarios;
  }

  @Get('filial/:filialId/anamnese')
  async getAllAnamnesesByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('profissionalId') profissionalId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllAnamneses(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('profissional/:profissionalId/anamnese')
  async getAllAnamnesesByProfissional(
    @Param('profissionalId') profissionalId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllAnamneses(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('filial/:filialId/acuidade-visual')
  async getAllAcuidadesVisuaisByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('profissionalId') profissionalId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllAcuidadesVisuais(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('profissional/:profissionalId/acuidade-visual')
  async getAllAcuidadesVisuaisByProfissional(
    @Param('profissionalId') profissionalId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllAcuidadesVisuais(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('filial/:filialId/refracao')
  async getAllRefracoesByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('profissionalId') profissionalId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllRefracoes(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('profissional/:profissionalId/refracao')
  async getAllRefracoesByProfissional(
    @Param('profissionalId') profissionalId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllRefracoes(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('filial/:filialId/ceratometria')
  async getAllCeratometriasByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('profissionalId') profissionalId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllCeratometrias(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('profissional/:profissionalId/ceratometria')
  async getAllCeratometriasByProfissional(
    @Param('profissionalId') profissionalId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllCeratometrias(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('filial/:filialId/biomicroscopia')
  async getAllBiomicroscopiasByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('profissionalId') profissionalId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllBiomicroscopias(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('profissional/:profissionalId/biomicroscopia')
  async getAllBiomicroscopiasByProfissional(
    @Param('profissionalId') profissionalId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllBiomicroscopias(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('filial/:filialId/fundoscopia')
  async getAllFundoscopiasByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('profissionalId') profissionalId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllFundoscopias(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('profissional/:profissionalId/fundoscopia')
  async getAllFundoscopiasByProfissional(
    @Param('profissionalId') profissionalId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllFundoscopias(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('filial/:filialId/pressao-intraocular')
  async getAllPressoesIntraocularesByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('profissionalId') profissionalId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllPressoesIntraoculares(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('profissional/:profissionalId/pressao-intraocular')
  async getAllPressoesIntraocularesByProfissional(
    @Param('profissionalId') profissionalId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllPressoesIntraoculares(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('filial/:filialId/diagnosticos')
  async getAllDiagnosticosByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('profissionalId') profissionalId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllDiagnosticos(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('profissional/:profissionalId/diagnosticos')
  async getAllDiagnosticosByProfissional(
    @Param('profissionalId') profissionalId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllDiagnosticos(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('filial/:filialId/exames-complementares')
  async getAllExamesComplementaresByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('profissionalId') profissionalId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllExamesComplementares(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('profissional/:profissionalId/exames-complementares')
  async getAllExamesComplementaresByProfissional(
    @Param('profissionalId') profissionalId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllExamesComplementares(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('filial/:filialId/evolucoes-clinicas')
  async getAllEvolucoesClinicasByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('profissionalId') profissionalId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllEvolucoesClinicas(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Get('profissional/:profissionalId/evolucoes-clinicas')
  async getAllEvolucoesClinicasByProfissional(
    @Param('profissionalId') profissionalId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.prontuarioService.findAllEvolucoesClinicas(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      profissionalId,
      dataInicio,
      dataFim,
    );
  }

  @Post(':prontuarioId/anamnese')
  async createProntuarioAnamnese(
    @Param('prontuarioId') prontuarioId: string,
    @Body() dto: CreateProntuarioAnamneseDto,
  ) {
    return this.prontuarioService.createAnamnese(prontuarioId, dto);
  }

  @Get(':prontuarioId/anamnese')
  async getProntuarioAnamnese(@Param('prontuarioId') prontuarioId: string) {
    return this.prontuarioService.findAnamneseByProntuarioId(prontuarioId);
  }

  @Put(':prontuarioId/anamnese')
  async updateProntuarioAnamnese(
    @Param('prontuarioId') prontuarioId: string,
    @Body() dto: UpdateProntuarioAnamneseDto,
  ) {
    return this.prontuarioService.updateAnamnese(prontuarioId, dto);
  }

  @Delete(':prontuarioId/anamnese')
  async deleteProntuarioAnamnese(@Param('prontuarioId') prontuarioId: string) {
    return this.prontuarioService.deleteAnamneseByProntuarioId(prontuarioId);
  }

  @Post(':prontuarioId/acuidade-visual')
  async createProntuarioAcuidadeVisual(
    @Param('prontuarioId') prontuarioId: string,
    @Body() dto: CreateProntuarioAcuidadeVisualDto,
  ) {
    return this.prontuarioService.createAcuidadeVisual(prontuarioId, dto);
  }

  @Get(':prontuarioId/acuidade-visual')
  async getProntuarioAcuidadeVisual(
    @Param('prontuarioId') prontuarioId: string,
  ) {
    return this.prontuarioService.findAcuidadeVisualByProntuarioId(
      prontuarioId,
    );
  }

  @Put(':prontuarioId/acuidade-visual')
  async updateProntuarioAcuidadeVisual(
    @Param('prontuarioId') prontuarioId: string,
    @Body() dto: UpdateProntuarioAcuidadeVisualDto,
  ) {
    return this.prontuarioService.updateAcuidadeVisual(prontuarioId, dto);
  }

  @Delete(':prontuarioId/acuidade-visual')
  async deleteProntuarioAcuidadeVisual(
    @Param('prontuarioId') prontuarioId: string,
  ) {
    return this.prontuarioService.deleteAcuidadeVisualByProntuarioId(
      prontuarioId,
    );
  }

  @Post(':prontuarioId/refracao')
  async createProntuarioRefracao(
    @Param('prontuarioId') prontuarioId: string,
    @Body() dto: CreateProntuarioRefracaoDto,
  ) {
    return this.prontuarioService.createRefracao(prontuarioId, dto);
  }

  @Get(':prontuarioId/refracao')
  async getProntuarioRefracao(@Param('prontuarioId') prontuarioId: string) {
    return this.prontuarioService.findRefracaoByProntuarioId(prontuarioId);
  }

  @Put(':prontuarioId/refracao')
  async updateProntuarioRefracao(
    @Param('prontuarioId') prontuarioId: string,
    @Body() dto: UpdateProntuarioRefracaoDto,
  ) {
    return this.prontuarioService.updateRefracao(prontuarioId, dto);
  }

  @Delete(':prontuarioId/refracao')
  async deleteProntuarioRefracao(@Param('prontuarioId') prontuarioId: string) {
    return this.prontuarioService.deleteRefracaoByProntuarioId(prontuarioId);
  }

  @Post(':prontuarioId/ceratometria')
  async createProntuarioCeratometria(
    @Param('prontuarioId') prontuarioId: string,
    @Body() dto: CreateProntuarioCeratometriaDto,
  ) {
    return this.prontuarioService.createCeratometria(prontuarioId, dto);
  }

  @Get(':prontuarioId/ceratometria')
  async getProntuarioCeratometria(@Param('prontuarioId') prontuarioId: string) {
    return this.prontuarioService.findCeratometriaByProntuarioId(prontuarioId);
  }

  @Put(':prontuarioId/ceratometria')
  async updateProntuarioCeratometria(
    @Param('prontuarioId') prontuarioId: string,
    @Body() dto: UpdateProntuarioCeratometriaDto,
  ) {
    return this.prontuarioService.updateCeratometria(prontuarioId, dto);
  }

  @Delete(':prontuarioId/ceratometria')
  async deleteProntuarioCeratometria(
    @Param('prontuarioId') prontuarioId: string,
  ) {
    return this.prontuarioService.deleteCeratometriaByProntuarioId(
      prontuarioId,
    );
  }

  @Post(':prontuarioId/biomicroscopia')
  async createProntuarioBiomicroscopia(
    @Param('prontuarioId') prontuarioId: string,
    @Body() dto: CreateProntuarioBiomicroscopiaDto,
  ) {
    return this.prontuarioService.createBiomicroscopia(prontuarioId, dto);
  }

  @Get(':prontuarioId/biomicroscopia')
  async getProntuarioBiomicroscopia(
    @Param('prontuarioId') prontuarioId: string,
  ) {
    return this.prontuarioService.findBiomicroscopiaByProntuarioId(
      prontuarioId,
    );
  }

  @Put(':prontuarioId/biomicroscopia')
  async updateProntuarioBiomicroscopia(
    @Param('prontuarioId') prontuarioId: string,
    @Body() dto: UpdateProntuarioBiomicroscopiaDto,
  ) {
    return this.prontuarioService.updateBiomicroscopia(prontuarioId, dto);
  }

  @Delete(':prontuarioId/biomicroscopia')
  async deleteProntuarioBiomicroscopia(
    @Param('prontuarioId') prontuarioId: string,
  ) {
    return this.prontuarioService.deleteBiomicroscopiaByProntuarioId(
      prontuarioId,
    );
  }

  @Post(':prontuarioId/fundoscopia')
  async createProntuarioFundoscopia(
    @Param('prontuarioId') prontuarioId: string,
    @Body() dto: CreateProntuarioFundoscopiaDto,
  ) {
    return this.prontuarioService.createFundoscopia(prontuarioId, dto);
  }

  @Get(':prontuarioId/fundoscopia')
  async getProntuarioFundoscopia(@Param('prontuarioId') prontuarioId: string) {
    return this.prontuarioService.findFundoscopiaByProntuarioId(prontuarioId);
  }

  @Put(':prontuarioId/fundoscopia')
  async updateProntuarioFundoscopia(
    @Param('prontuarioId') prontuarioId: string,
    @Body() dto: UpdateProntuarioFundoscopiaDto,
  ) {
    return this.prontuarioService.updateFundoscopia(prontuarioId, dto);
  }

  @Delete(':prontuarioId/fundoscopia')
  async deleteProntuarioFundoscopia(
    @Param('prontuarioId') prontuarioId: string,
  ) {
    return this.prontuarioService.deleteFundoscopiaByProntuarioId(prontuarioId);
  }

  @Post(':prontuarioId/pressao-intraocular')
  async createProntuarioPressaoIntraocular(
    @Param('prontuarioId') prontuarioId: string,
    @Body() dto: CreateProntuarioPressaoIntraocularDto,
  ) {
    return this.prontuarioService.createPressaoIntraocular(prontuarioId, dto);
  }

  @Get(':prontuarioId/pressao-intraocular')
  async getProntuarioPressaoIntraocular(
    @Param('prontuarioId') prontuarioId: string,
  ) {
    return this.prontuarioService.findPressaoIntraocularByProntuarioId(
      prontuarioId,
    );
  }

  @Put(':prontuarioId/pressao-intraocular')
  async updateProntuarioPressaoIntraocular(
    @Param('prontuarioId') prontuarioId: string,
    @Body() dto: UpdateProntuarioPressaoIntraocularDto,
  ) {
    return this.prontuarioService.updatePressaoIntraocular(prontuarioId, dto);
  }

  @Delete(':prontuarioId/pressao-intraocular')
  async deleteProntuarioPressaoIntraocular(
    @Param('prontuarioId') prontuarioId: string,
  ) {
    return this.prontuarioService.deletePressaoIntraocularByProntuarioId(
      prontuarioId,
    );
  }

  @Post(':prontuarioId/diagnosticos')
  async createProntuarioDiagnostico(
    @Param('prontuarioId') prontuarioId: string,
    @Body() dto: CreateProntuarioDiagnosticoDto,
  ) {
    return this.prontuarioService.createDiagnostico(prontuarioId, dto);
  }

  @Get(':prontuarioId/diagnosticos')
  async getProntuarioDiagnosticos(@Param('prontuarioId') prontuarioId: string) {
    return this.prontuarioService.findDiagnosticosByProntuarioId(prontuarioId);
  }

  @Put(':prontuarioId/diagnosticos/:diagnosticoId')
  async updateProntuarioDiagnostico(
    @Param('prontuarioId') prontuarioId: string,
    @Param('diagnosticoId') diagnosticoId: string,
    @Body() dto: UpdateProntuarioDiagnosticoDto,
  ) {
    return this.prontuarioService.updateDiagnostico(
      prontuarioId,
      diagnosticoId,
      dto,
    );
  }

  @Delete(':prontuarioId/diagnosticos/:diagnosticoId')
  async deleteProntuarioDiagnostico(
    @Param('prontuarioId') prontuarioId: string,
    @Param('diagnosticoId') diagnosticoId: string,
  ) {
    return this.prontuarioService.deleteDiagnostico(
      prontuarioId,
      diagnosticoId,
    );
  }

  @Post(':prontuarioId/exames-complementares')
  async createProntuarioExameComplementar(
    @Param('prontuarioId') prontuarioId: string,
    @Body() dto: CreateProntuarioExameComplementarDto,
  ) {
    return this.prontuarioService.createExameComplementar(prontuarioId, dto);
  }

  @Get(':prontuarioId/exames-complementares')
  async getProntuarioExamesComplementares(
    @Param('prontuarioId') prontuarioId: string,
  ) {
    return this.prontuarioService.findExamesComplementaresByProntuarioId(
      prontuarioId,
    );
  }

  @Put(':prontuarioId/exames-complementares/:exameComplementarId')
  async updateProntuarioExameComplementar(
    @Param('prontuarioId') prontuarioId: string,
    @Param('exameComplementarId') exameComplementarId: string,
    @Body() dto: UpdateProntuarioExameComplementarDto,
  ) {
    return this.prontuarioService.updateExameComplementar(
      prontuarioId,
      exameComplementarId,
      dto,
    );
  }

  @Delete(':prontuarioId/exames-complementares/:exameComplementarId')
  async deleteProntuarioExameComplementar(
    @Param('prontuarioId') prontuarioId: string,
    @Param('exameComplementarId') exameComplementarId: string,
  ) {
    return this.prontuarioService.deleteExameComplementar(
      prontuarioId,
      exameComplementarId,
    );
  }

  @Post(':prontuarioId/evolucoes-clinicas')
  async createProntuarioEvolucaoClinica(
    @Param('prontuarioId') prontuarioId: string,
    @Body() dto: CreateProntuarioEvolucaoClinicaDto,
  ) {
    return this.prontuarioService.createEvolucaoClinica(prontuarioId, dto);
  }

  @Get(':prontuarioId/evolucoes-clinicas')
  async getProntuarioEvolucoesClinicas(
    @Param('prontuarioId') prontuarioId: string,
  ) {
    return this.prontuarioService.findEvolucoesClinicasByProntuarioId(
      prontuarioId,
    );
  }

  @Put(':prontuarioId/evolucoes-clinicas/:evolucaoClinicaId')
  async updateProntuarioEvolucaoClinica(
    @Param('prontuarioId') prontuarioId: string,
    @Param('evolucaoClinicaId') evolucaoClinicaId: string,
    @Body() dto: UpdateProntuarioEvolucaoClinicaDto,
  ) {
    return this.prontuarioService.updateEvolucaoClinica(
      prontuarioId,
      evolucaoClinicaId,
      dto,
    );
  }

  @Delete(':prontuarioId/evolucoes-clinicas/:evolucaoClinicaId')
  async deleteProntuarioEvolucaoClinica(
    @Param('prontuarioId') prontuarioId: string,
    @Param('evolucaoClinicaId') evolucaoClinicaId: string,
  ) {
    return this.prontuarioService.deleteEvolucaoClinica(
      prontuarioId,
      evolucaoClinicaId,
    );
  }

  @Get(':id')
  async getProntuarioById(@Param('id') id: string) {
    return this.prontuarioService.findById(id);
  }

  @Put(':id')
  async updateProntuario(
    @Param('id') id: string,
    @Body() dto: UpdateProntuarioDto,
  ) {
    return this.prontuarioService.update(id, dto);
  }

  @Delete(':id')
  async deleteProntuario(@Param('id') id: string) {
    return this.prontuarioService.deleteById(id);
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  PipeTransform,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import {
  CreateProntuarioDto,
  ProntuarioAcuidadeVisualDto,
  ProntuarioAnamneseDto,
  ProntuarioCeratometriaDto,
  ProntuarioDescricaoDto,
  ProntuarioDiagnosticoDto,
  ProntuarioEvolucaoClinicaDto,
  ProntuarioExameComplementarDto,
  ProntuarioPressaoIntraocularDto,
  ProntuarioRefracaoDto,
  UpdateProntuarioDto,
} from './dto/prontuario.dto';
import type { SecaoLista, SecaoUnica } from './interfaces/prontuario.interface';
import { ProntuarioService } from './prontuario.service';

const SECOES_UNICAS: SecaoUnica[] = [
  'anamnese',
  'acuidade_visual',
  'refracao',
  'ceratometria',
  'biomicroscopia',
  'fundoscopia',
  'pressao_intraocular',
];

const SECOES_LISTA: SecaoLista[] = [
  'diagnosticos',
  'exames_complementares',
  'evolucoes_clinicas',
];

/** Converte o segmento da URL (ex.: acuidade-visual) no nome da secao. */
class SecaoPipe<T extends string> implements PipeTransform<string, T> {
  constructor(private readonly permitidas: T[]) {}

  transform(valor: string): T {
    const secao = valor.replace(/-/g, '_') as T;

    if (!this.permitidas.includes(secao)) {
      throw new BadRequestException(`Seção "${valor}" inválida.`);
    }

    return secao;
  }
}

@Controller('prontuario')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class ProntuarioController {
  constructor(private readonly prontuarioService: ProntuarioService) {}

  @Post()
  async create(
    @Body() dto: CreateProntuarioDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.prontuarioService.create(dto, escopo);
  }

  @Get()
  async findAll(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('pacienteId') pacienteId?: string,
  ) {
    return this.prontuarioService.findAll(escopo, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      pacienteId,
    });
  }

  @Get('atendimento/:atendimentoId')
  async findByAtendimento(
    @Param('atendimentoId') atendimentoId: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.prontuarioService.findByAtendimento(atendimentoId, escopo);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.prontuarioService.findById(id, escopo);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProntuarioDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.prontuarioService.update(id, dto, escopo);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.prontuarioService.deleteById(id, escopo);
  }

  @Put(':id/anamnese')
  async salvarAnamnese(
    @Param('id') id: string,
    @Body() dto: ProntuarioAnamneseDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.prontuarioService.salvarSecao(id, 'anamnese', dto, escopo);
  }

  @Put(':id/acuidade-visual')
  async salvarAcuidadeVisual(
    @Param('id') id: string,
    @Body() dto: ProntuarioAcuidadeVisualDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.prontuarioService.salvarSecao(
      id,
      'acuidade_visual',
      dto,
      escopo,
    );
  }

  @Put(':id/refracao')
  async salvarRefracao(
    @Param('id') id: string,
    @Body() dto: ProntuarioRefracaoDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.prontuarioService.salvarSecao(id, 'refracao', dto, escopo);
  }

  @Put(':id/ceratometria')
  async salvarCeratometria(
    @Param('id') id: string,
    @Body() dto: ProntuarioCeratometriaDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.prontuarioService.salvarSecao(id, 'ceratometria', dto, escopo);
  }

  @Put(':id/biomicroscopia')
  async salvarBiomicroscopia(
    @Param('id') id: string,
    @Body() dto: ProntuarioDescricaoDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.prontuarioService.salvarSecao(
      id,
      'biomicroscopia',
      dto,
      escopo,
    );
  }

  @Put(':id/fundoscopia')
  async salvarFundoscopia(
    @Param('id') id: string,
    @Body() dto: ProntuarioDescricaoDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.prontuarioService.salvarSecao(id, 'fundoscopia', dto, escopo);
  }

  @Put(':id/pressao-intraocular')
  async salvarPressaoIntraocular(
    @Param('id') id: string,
    @Body() dto: ProntuarioPressaoIntraocularDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.prontuarioService.salvarSecao(
      id,
      'pressao_intraocular',
      dto,
      escopo,
    );
  }

  @Post(':id/diagnosticos')
  async adicionarDiagnostico(
    @Param('id') id: string,
    @Body() dto: ProntuarioDiagnosticoDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.prontuarioService.adicionarItem(
      id,
      'diagnosticos',
      dto,
      escopo,
    );
  }

  @Put(':id/diagnosticos/:itemId')
  async atualizarDiagnostico(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: ProntuarioDiagnosticoDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.prontuarioService.atualizarItem(
      id,
      'diagnosticos',
      itemId,
      dto,
      escopo,
    );
  }

  @Post(':id/exames-complementares')
  async adicionarExame(
    @Param('id') id: string,
    @Body() dto: ProntuarioExameComplementarDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.prontuarioService.adicionarItem(
      id,
      'exames_complementares',
      dto,
      escopo,
    );
  }

  @Put(':id/exames-complementares/:itemId')
  async atualizarExame(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: ProntuarioExameComplementarDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.prontuarioService.atualizarItem(
      id,
      'exames_complementares',
      itemId,
      dto,
      escopo,
    );
  }

  @Post(':id/evolucoes-clinicas')
  async adicionarEvolucao(
    @Param('id') id: string,
    @Body() dto: ProntuarioEvolucaoClinicaDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.prontuarioService.adicionarItem(
      id,
      'evolucoes_clinicas',
      dto,
      escopo,
    );
  }

  @Put(':id/evolucoes-clinicas/:itemId')
  async atualizarEvolucao(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: ProntuarioEvolucaoClinicaDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.prontuarioService.atualizarItem(
      id,
      'evolucoes_clinicas',
      itemId,
      dto,
      escopo,
    );
  }

  @Delete(':id/:secao/:itemId')
  async removerItem(
    @Param('id') id: string,
    @Param('secao', new SecaoPipe(SECOES_LISTA)) secao: SecaoLista,
    @Param('itemId') itemId: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.prontuarioService.removerItem(id, secao, itemId, escopo);
  }

  @Delete(':id/:secao')
  async removerSecao(
    @Param('id') id: string,
    @Param('secao', new SecaoPipe(SECOES_UNICAS)) secao: SecaoUnica,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.prontuarioService.removerSecao(id, secao, escopo);
  }
}

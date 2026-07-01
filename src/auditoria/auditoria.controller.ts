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
import { CreateAuditoriaDto, UpdateAuditoriaDto } from './dto/auditoria.dto';
import { AuditoriaService } from './auditoria.service';

@Controller('auditoria')
@UseGuards(AuthGuard, AcessoGuard)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Post()
  async createAuditoria(@Body() dto: CreateAuditoriaDto) {
    return this.auditoriaService.create(dto);
  }

  @Get('empresa/:empresaId')
  async getAllByEmpresa(
    @Param('empresaId') empresaId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('usuarioId') usuarioId?: string,
    @Query('atendimentoId') atendimentoId?: string,
    @Query('entidade') entidade?: string,
    @Query('entidadeId') entidadeId?: string,
    @Query('acao') acao?: string,
    @Query('ip') ip?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.auditoriaService.findAllByEmpresa(
      empresaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      usuarioId,
      atendimentoId,
      entidade,
      entidadeId,
      acao,
      ip,
      dataInicio,
      dataFim,
    );
  }

  @Get(':id')
  async getAuditoriaById(@Param('id') id: string) {
    return this.auditoriaService.findById(id);
  }

  @Put(':id')
  async updateAuditoria(
    @Param('id') id: string,
    @Body() dto: UpdateAuditoriaDto,
  ) {
    return this.auditoriaService.update(id, dto);
  }

  @Delete(':id')
  async deleteAuditoria(@Param('id') id: string) {
    return this.auditoriaService.deleteById(id);
  }
}

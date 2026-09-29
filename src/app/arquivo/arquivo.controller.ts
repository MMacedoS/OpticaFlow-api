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
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import { CreateArquivoDto, UpdateArquivoDto } from './dto/arquivo.dto';
import { ArquivoService } from './arquivo.service';

@Controller('arquivo')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class ArquivoController {
  constructor(private readonly arquivoService: ArquivoService) {}

  @Post()
  async createArquivo(
    @Body() dto: CreateArquivoDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.arquivoService.create(dto, escopo);
  }

  @Get('empresa/:empresaId')
  async getAllByEmpresa(
    @Param('empresaId') empresaId: string,
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('pessoaId') pessoaId?: string,
    @Query('atendimentoId') atendimentoId?: string,
    @Query('prontuarioId') prontuarioId?: string,
    @Query('enviadoPorId') enviadoPorId?: string,
    @Query('mimeType') mimeType?: string,
  ) {
    return this.arquivoService.findAllByEmpresa(
      empresaId,
      escopo,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      pessoaId,
      atendimentoId,
      prontuarioId,
      enviadoPorId,
      mimeType,
    );
  }

  @Get(':id')
  async getArquivoById(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.arquivoService.findById(id, escopo);
  }

  @Put(':id')
  async updateArquivo(
    @Param('id') id: string,
    @Body() dto: UpdateArquivoDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.arquivoService.update(id, dto, escopo);
  }

  @Delete(':id')
  async deleteArquivo(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.arquivoService.deleteById(id, escopo);
  }
}

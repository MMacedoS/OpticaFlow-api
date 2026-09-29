import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { CreateConvenioDto, UpdateConvenioDto } from './dto/convenio.dto';
import { ConvenioService } from './convenio.service';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';

@Controller('convenio')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class ConvenioController {
  constructor(private readonly convenioService: ConvenioService) {}

  @Post()
  async createConvenio(
    @Body() dto: CreateConvenioDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.convenioService.create(dto, escopo);
  }

  @Get()
  async getAllByEmpresa(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('ativo') ativo?: string,
    @Query('empresaId') empresaIdInformada?: string,
  ) {
    // Usuario comum lista a propria empresa; superadmin informa a empresa.
    const empresaId = escopo.superadmin ? empresaIdInformada : escopo.empresaId;

    if (!empresaId) {
      throw new BadRequestException('Informe a empresa dos convênios.');
    }

    return this.convenioService.findAllByEmpresa(
      empresaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      this.parseBooleanQuery(ativo),
    );
  }

  @Get('all')
  async getAll(@Escopo() escopo: EscopoUsuario) {
    return this.convenioService.findAll(escopo);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return await this.convenioService.updateStatus(id, status, escopo);
  }

  @Get(':id')
  async getConvenioById(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.convenioService.findById(id, escopo);
  }

  @Put(':id')
  async updateConvenio(
    @Param('id') id: string,
    @Body() dto: UpdateConvenioDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.convenioService.update(id, dto, escopo);
  }

  @Delete(':id')
  async deleteConvenio(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.convenioService.deleteById(id, escopo);
  }

  private parseBooleanQuery(value?: string): boolean | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return undefined;
  }
}

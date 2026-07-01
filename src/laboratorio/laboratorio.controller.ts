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
  CreateLaboratorioDto,
  UpdateLaboratorioDto,
} from './dto/laboratorio.dto';
import { LaboratorioService } from './laboratorio.service';

@Controller('laboratorio')
@UseGuards(AuthGuard, AcessoGuard)
export class LaboratorioController {
  constructor(private readonly laboratorioService: LaboratorioService) {}

  @Post()
  async createLaboratorio(@Body() dto: CreateLaboratorioDto) {
    return this.laboratorioService.create(dto);
  }

  @Get('empresa/:empresaId')
  async getAllByEmpresa(
    @Param('empresaId') empresaId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('ativo') ativo?: string,
  ) {
    return this.laboratorioService.findAllByEmpresa(
      empresaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      this.parseBooleanQuery(ativo),
    );
  }

  @Get(':id')
  async getLaboratorioById(@Param('id') id: string) {
    return this.laboratorioService.findById(id);
  }

  @Put(':id')
  async updateLaboratorio(
    @Param('id') id: string,
    @Body() dto: UpdateLaboratorioDto,
  ) {
    return this.laboratorioService.update(id, dto);
  }

  @Delete(':id')
  async deleteLaboratorio(@Param('id') id: string) {
    return this.laboratorioService.deleteById(id);
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

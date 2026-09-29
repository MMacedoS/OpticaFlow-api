import {
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
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import { CreateEmpresaDto } from './dto/createEmpresa.dto';
import { UpdateEmpresaDto } from './dto/updateEmpresa.dto';
import { EmpresaService } from './empresa.service';

@Controller('empresa')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Get()
  async getAllEmpresas(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.empresaService.findAll(
      escopo,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ? search : '',
      status ? status : '',
    );
  }

  @Post()
  async createEmpresa(
    @Body() data: CreateEmpresaDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.empresaService.create(data, escopo);
  }

  @Put(':id')
  async updateEmpresa(
    @Param('id') id: string,
    @Body() data: UpdateEmpresaDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.empresaService.update(id, data, escopo);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.empresaService.updateStatus(id, status, escopo);
  }

  @Delete(':id')
  async deleteEmpresa(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.empresaService.deleteById(id, escopo);
  }
}

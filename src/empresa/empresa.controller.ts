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
} from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { CreateEmpresaDto } from './dto/createEmpresa.dto';
import { UpdateEmpresaDto } from './dto/updateEmpresa.dto';

@Controller('empresas')
@UseGuards(AuthGuard, AcessoGuard)
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Get()
  async getAllEmpresas(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const empresas = await this.empresaService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ? search : '',
      status ? status : '',
    );

    return empresas;
  }

  @Post()
  async createEmpresa(@Body() data: CreateEmpresaDto) {
    return await this.empresaService.create(data);
  }

  @Put(':id')
  async updateEmpresa(@Param('id') id: string, @Body() data: UpdateEmpresaDto) {
    return await this.empresaService.update(id, data);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return await this.empresaService.updateStatus(id, status);
  }

  @Delete(':id')
  async deleteEmpresa(@Param('id') id: string) {
    return await this.empresaService.deleteById(id);
  }
}

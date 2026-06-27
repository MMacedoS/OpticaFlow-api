import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EmpresaDto } from './dto/empresa.dto';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';

@Controller('empresa')
@UseGuards(AuthGuard, AcessoGuard)
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Get()
  async getAllEmpresas(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const empresas = await this.empresaService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ? search : '',
    );

    if (!empresas || empresas.length === 0) {
      return { error: 'Nenhuma empresa encontrada' };
    }

    return empresas;
  }

  @Post()
  async createEmpresa(@Body() data: EmpresaDto) {
    return await this.empresaService.create(data);
  }

  @Delete(':id')
  async deleteEmpresa(@Param('id') id: string) {
    return await this.empresaService.deleteById(id);
  }
}

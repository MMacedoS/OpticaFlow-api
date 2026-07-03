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
  async createEmpresa(@Body() data: EmpresaDto) {
    return await this.empresaService.create(data);
  }

  @Delete(':id')
  async deleteEmpresa(@Param('id') id: string) {
    return await this.empresaService.deleteById(id);
  }
}

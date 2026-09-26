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
import { CreateFornecedorDto, UpdateFornecedorDto } from './dto/fornecedor.dto';
import { FornecedorService } from './fornecedor.service';

@Controller('fornecedor')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class FornecedorController {
  constructor(private readonly fornecedorService: FornecedorService) {}

  @Post()
  async createFornecedor(
    @Body() dto: CreateFornecedorDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.fornecedorService.create(dto, escopo);
  }

  @Get()
  async getAll(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('ativo') ativo?: string,
  ) {
    return this.fornecedorService.findAll(escopo, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search: search ?? '',
      ativo: ativo === undefined ? undefined : ativo === 'true',
    });
  }

  @Get(':id')
  async getFornecedorById(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.fornecedorService.findById(id, escopo);
  }

  @Put(':id')
  async updateFornecedor(
    @Param('id') id: string,
    @Body() dto: UpdateFornecedorDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.fornecedorService.update(id, dto, escopo);
  }

  @Delete(':id')
  async deleteFornecedor(
    @Param('id') id: string,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.fornecedorService.deleteById(id, escopo);
  }
}

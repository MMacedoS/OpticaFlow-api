import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import { CreateEstoqueDto, UpdateEstoqueDto } from './dto/estoque.dto';
import { EstoqueService } from './estoque.service';

@Controller('estoque')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class EstoqueController {
  constructor(private readonly estoqueService: EstoqueService) {}

  @Post()
  async create(@Body() dto: CreateEstoqueDto, @Escopo() escopo: EscopoUsuario) {
    return this.estoqueService.create(dto, escopo);
  }

  @Get()
  async findAll(@Escopo() escopo: EscopoUsuario) {
    return this.estoqueService.findAll(escopo);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.estoqueService.findById(id, escopo);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEstoqueDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.estoqueService.update(id, dto, escopo);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.estoqueService.deleteById(id, escopo);
  }
}

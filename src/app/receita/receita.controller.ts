import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TipoReceita } from '@prisma/client';
import { Escopo } from 'src/common/escopo/escopo.decorator';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import { CreateReceitaDto, UpdateReceitaDto } from './dto/receita.dto';
import { ReceitaService } from './receita.service';

const tipoOpcionalPipe = new ParseEnumPipe(TipoReceita, {
  optional: true,
  exceptionFactory: () =>
    new BadRequestException(
      'tipo deve ser oculos, lente_contato ou medicamento.',
    ),
});

@Controller('receita')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class ReceitaController {
  constructor(private readonly receitaService: ReceitaService) {}

  @Post()
  async create(@Body() dto: CreateReceitaDto, @Escopo() escopo: EscopoUsuario) {
    return this.receitaService.create(dto, escopo);
  }

  @Get()
  async findAll(
    @Escopo() escopo: EscopoUsuario,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('pacienteId') pacienteId?: string,
    @Query('prontuarioId') prontuarioId?: string,
    @Query('tipo', tipoOpcionalPipe) tipo?: TipoReceita,
  ) {
    return this.receitaService.findAll(escopo, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      pacienteId,
      prontuarioId,
      tipo,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.receitaService.findById(id, escopo);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReceitaDto,
    @Escopo() escopo: EscopoUsuario,
  ) {
    return this.receitaService.update(id, dto, escopo);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Escopo() escopo: EscopoUsuario) {
    return this.receitaService.deleteById(id, escopo);
  }
}

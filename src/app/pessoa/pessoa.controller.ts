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
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import { PessoaService } from './pessoa.service';
import { CurrentUser } from 'src/decorators/current-user.decorator/current-user.decorator';
import { PessoaDto } from './dto/pessoa';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { Status } from '@prisma/client';

@Controller('peoples')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class PessoaController {
  constructor(private readonly pessoaService: PessoaService) {}

  @Get()
  async getAllByFilial(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    if (!user || !user.pessoa || !user.pessoa.filialId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }
    const pessoas = await this.pessoaService.findAllByFilial(
      user.pessoa.filialId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
    );

    return pessoas;
  }

  @Get('list')
  async getAllByFilialList(
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    if (!user || !user.pessoa || !user.pessoa.filialId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }
    const pessoas = await this.pessoaService.findAllByFilial(
      user.pessoa.filialId,
      1,
      1000,
      search ?? '',
    );

    return pessoas;
  }

  @Post()
  async create(@Body() dto: PessoaDto, @CurrentUser() user?: any) {
    if (!user || !user.pessoa || !user.pessoa.filialId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }
    dto.filialId = user.pessoa.filialId;
    return this.pessoaService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: PessoaDto) {
    return this.pessoaService.update(id, dto);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() status: Status) {
    return this.pessoaService.updateStatus(id, status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.pessoaService.delete(id);
  }
}

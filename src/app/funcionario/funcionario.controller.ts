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
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { FuncionarioService } from './funcionario.service';
import { FuncionarioDto, UpdateFuncionarioDto } from './dto/funcionario.dto';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user.interceptor.ts/enrich-user.interceptor.ts';
import { CurrentUser } from 'src/decorators/current-user.decorator.ts/current-user.decorator.ts';

@Controller('employees')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class FuncionarioController {
  constructor(private readonly funcionarioService: FuncionarioService) {}

  @Post()
  async createFuncionario(
    @Body() dto: FuncionarioDto,
    @CurrentUser() user?: any,
  ) {
    if (!user || !user.pessoa || !user.pessoa.filialId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }

    dto.pessoa.filialId = user.pessoa.filialId;

    return this.funcionarioService.create(dto);
  }

  @Get()
  async getAllFuncionario(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @CurrentUser() user?: any,
  ) {
    if (!user || !user.pessoa || !user.pessoa.filialId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }

    return this.funcionarioService.findAllByFilialId(user.pessoa.filialId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search: search ?? '',
    });
  }

  // @Get('filial/:filialId')
  // async getAllByFilial(
  //   @Param('filialId') filialId: string,
  //   @Query('page') page?: string,
  //   @Query('limit') limit?: string,
  //   @Query('search') search?: string,
  // ) {
  //   const funcionarios = await this.funcionarioService.findAllByFilialId(
  //     filialId,
  //     page ? parseInt(page, 10) : 1,
  //     limit ? parseInt(limit, 10) : 10,
  //     search ?? '',
  //   );

  //   if (!funcionarios || funcionarios.length === 0) {
  //     return { error: 'Nenhum funcionário encontrado' };
  //   }

  //   return funcionarios;
  // }

  @Get(':id')
  async getFuncionarioById(@Param('id') id: string) {
    return this.funcionarioService.findById(id);
  }

  @Put(':id')
  async updateFuncionario(
    @Param('id') id: string,
    @Body() dto: UpdateFuncionarioDto,
  ) {
    return this.funcionarioService.update(id, dto);
  }

  @Delete(':id')
  async deleteFuncionario(@Param('id') id: string) {
    return this.funcionarioService.deleteById(id);
  }
}

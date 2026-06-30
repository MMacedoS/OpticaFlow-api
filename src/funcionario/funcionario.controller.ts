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
  CreateFuncionarioDto,
  UpdateFuncionarioDto,
} from './dto/funcionario.dto';
import { FuncionarioService } from './funcionario.service';

@Controller('funcionario')
@UseGuards(AuthGuard, AcessoGuard)
export class FuncionarioController {
  constructor(private readonly funcionarioService: FuncionarioService) {}

  @Post()
  async createFuncionario(@Body() dto: CreateFuncionarioDto) {
    return this.funcionarioService.create(dto);
  }

  @Get('filial/:filialId')
  async getAllByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const funcionarios = await this.funcionarioService.findAllByFilial(
      filialId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
    );

    if (!funcionarios || funcionarios.length === 0) {
      return { error: 'Nenhum funcionário encontrado' };
    }

    return funcionarios;
  }

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

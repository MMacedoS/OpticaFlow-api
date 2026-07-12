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
import { ClienteService } from './cliente.service';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator.ts/current-user.decorator.ts';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user.interceptor.ts/enrich-user.interceptor.ts';
import { ClienteDto, updateClienteDto } from './cliente.dto/cliente.dto';

@Controller('customers')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  @Get()
  async getAllClientes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @CurrentUser() user?: any,
  ) {
    if (!user || !user.pessoa || !user.pessoa.filialId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }

    return this.clienteService.findAllByFilialId(user.pessoa.filialId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search: search ?? '',
    });
  }

  @Post()
  async create(@Body() dto: ClienteDto, @CurrentUser() user?: any) {
    console.log('Current User:', user);
    if (!user) {
      return { status: 401, message: 'Usuário não autenticado.' };
    }

    return this.clienteService.create(dto, user);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: updateClienteDto,
    @CurrentUser() user?: any,
  ) {
    if (!user) {
      return { status: 401, message: 'Usuário não autenticado.' };
    }

    return this.clienteService.update(id, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user?: any,
  ) {
    if (!user) {
      return { status: 401, message: 'Usuário não autenticado.' };
    }

    return this.clienteService.updateStatus(id, status as any);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user?: any) {
    if (!user) {
      return { status: 401, message: 'Usuário não autenticado.' };
    }

    return this.clienteService.deleteById(id);
  }
}

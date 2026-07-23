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
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { OptometristaService } from './optometrista.service';
import { CreateDto, UpdateDto } from './dto/optometrista.dto';
import { Status } from '@prisma/client';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user/enrich-user.interceptor.ts';
import { CurrentUser } from 'src/decorators/current-user.decorator/current-user.decorator';

@Controller('optometrists')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class OptometristaController {
  constructor(private readonly optometristaService: OptometristaService) {}

  @Post()
  async createOptometrista(@Body() dto: CreateDto, @CurrentUser() user?: any) {
    if (!user || !user.pessoa || !user.pessoa.filialId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }

    dto.pessoa.filialId = user.pessoa.filialId;
    return this.optometristaService.create(dto);
  }

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
    const optometristas = await this.optometristaService.findAllByFilial(
      user.pessoa.filialId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
    );

    return optometristas;
  }

  @Get('list')
  async getAllByFilialList(
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    if (!user || !user.pessoa || !user.pessoa.filialId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }
    const optometristas = await this.optometristaService.findAllByFilial(
      user.pessoa.filialId,
      1,
      1000,
      search ?? '',
    );

    return optometristas;
  }

  @Get(':id')
  async getOptometristaById(@Param('id') id: string) {
    return this.optometristaService.findById(id);
  }

  @Put(':id')
  async updateOptometrista(@Param('id') id: string, @Body() dto: UpdateDto) {
    return this.optometristaService.update(id, dto);
  }

  @Patch(':id/status')
  async updateOptometristaStatus(
    @Param('id') id: string,
    @Body('status') status: Status,
  ) {
    return this.optometristaService.updateStatus(id, status);
  }

  @Delete(':id')
  async deleteOptometrista(@Param('id') id: string) {
    return this.optometristaService.deleteById(id);
  }
}

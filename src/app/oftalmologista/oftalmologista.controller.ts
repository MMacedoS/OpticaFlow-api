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
import { OftalmologistaService } from './oftalmologista.service';
import { EnrichUserInterceptor } from 'src/interceptors/enrich-user.interceptor.ts/enrich-user.interceptor.ts';
import { CreateDto, UpdateDto } from './dto/oftalmologista.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator.ts/current-user.decorator.ts';

@Controller('ophthalmologists')
@UseGuards(AuthGuard, AcessoGuard)
@UseInterceptors(EnrichUserInterceptor)
export class OftalmologistaController {
  constructor(private readonly oftalmologistaService: OftalmologistaService) {}

  @Post()
  async createOftalmologista(
    @Body() dto: CreateDto,
    @CurrentUser() user?: any,
  ) {
    if (!user || !user.pessoa || !user.pessoa.filialId) {
      return { status: 401, message: 'Usuário não autenticado ou sem filial.' };
    }

    dto.pessoa.filialId = user.pessoa.filialId;
    return this.oftalmologistaService.create(dto);
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

    const oftalmologistas = await this.oftalmologistaService.findAllByFilial(
      user.pessoa.filialId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
    );

    return oftalmologistas;
  }

  @Get(':id')
  async getOftalmologistaById(@Param('id') id: string) {
    return this.oftalmologistaService.findById(id);
  }

  @Put(':id')
  async updateOftalmologista(@Param('id') id: string, @Body() dto: UpdateDto) {
    return this.oftalmologistaService.update(id, dto);
  }

  @Delete(':id')
  async deleteOftalmologista(@Param('id') id: string) {
    return this.oftalmologistaService.deleteById(id);
  }
}

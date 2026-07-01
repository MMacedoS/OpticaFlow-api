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
  CreateResponsavelDto,
  UpdateResponsavelDto,
} from './dto/responsavel.dto';
import { ResponsavelService } from './responsavel.service';

@Controller('responsavel')
@UseGuards(AuthGuard, AcessoGuard)
export class ResponsavelController {
  constructor(private readonly responsavelService: ResponsavelService) {}

  @Post()
  async createResponsavel(@Body() dto: CreateResponsavelDto) {
    return this.responsavelService.create(dto);
  }

  @Get('filial/:filialId')
  async getAllByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const responsaveis = await this.responsavelService.findAllByFilial(
      filialId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
    );

    if (!responsaveis || responsaveis.length === 0) {
      return { error: 'Nenhum responsável encontrado' };
    }

    return responsaveis;
  }

  @Get(':id')
  async getResponsavelById(@Param('id') id: string) {
    return this.responsavelService.findById(id);
  }

  @Put(':id')
  async updateResponsavel(
    @Param('id') id: string,
    @Body() dto: UpdateResponsavelDto,
  ) {
    return this.responsavelService.update(id, dto);
  }

  @Delete(':id')
  async deleteResponsavel(@Param('id') id: string) {
    return this.responsavelService.deleteById(id);
  }
}

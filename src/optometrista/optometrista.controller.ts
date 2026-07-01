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
  CreateOptometristaDto,
  UpdateOptometristaDto,
} from './dto/optometrista.dto';
import { OptometristaService } from './optometrista.service';

@Controller('optometrista')
@UseGuards(AuthGuard, AcessoGuard)
export class OptometristaController {
  constructor(private readonly optometristaService: OptometristaService) {}

  @Post()
  async createOptometrista(@Body() dto: CreateOptometristaDto) {
    return this.optometristaService.create(dto);
  }

  @Get('filial/:filialId')
  async getAllByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const optometristas = await this.optometristaService.findAllByFilial(
      filialId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
    );

    if (!optometristas || optometristas.length === 0) {
      return { error: 'Nenhum optometrista encontrado' };
    }

    return optometristas;
  }

  @Get(':id')
  async getOptometristaById(@Param('id') id: string) {
    return this.optometristaService.findById(id);
  }

  @Put(':id')
  async updateOptometrista(
    @Param('id') id: string,
    @Body() dto: UpdateOptometristaDto,
  ) {
    return this.optometristaService.update(id, dto);
  }

  @Delete(':id')
  async deleteOptometrista(@Param('id') id: string) {
    return this.optometristaService.deleteById(id);
  }
}

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
  CreateOftalmologistaDto,
  UpdateOftalmologistaDto,
} from './dto/oftalmologista.dto';
import { OftalmologistaService } from './oftalmologista.service';

@Controller('oftalmologista')
@UseGuards(AuthGuard, AcessoGuard)
export class OftalmologistaController {
  constructor(private readonly oftalmologistaService: OftalmologistaService) {}

  @Post()
  async createOftalmologista(@Body() dto: CreateOftalmologistaDto) {
    return this.oftalmologistaService.create(dto);
  }

  @Get('filial/:filialId')
  async getAllByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const oftalmologistas = await this.oftalmologistaService.findAllByFilial(
      filialId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
    );

    if (!oftalmologistas || oftalmologistas.length === 0) {
      return { error: 'Nenhum oftalmologista encontrado' };
    }

    return oftalmologistas;
  }

  @Get(':id')
  async getOftalmologistaById(@Param('id') id: string) {
    return this.oftalmologistaService.findById(id);
  }

  @Put(':id')
  async updateOftalmologista(
    @Param('id') id: string,
    @Body() dto: UpdateOftalmologistaDto,
  ) {
    return this.oftalmologistaService.update(id, dto);
  }

  @Delete(':id')
  async deleteOftalmologista(@Param('id') id: string) {
    return this.oftalmologistaService.deleteById(id);
  }
}

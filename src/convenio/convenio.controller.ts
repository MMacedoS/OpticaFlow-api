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
import { CreateConvenioDto, UpdateConvenioDto } from './dto/convenio.dto';
import { ConvenioService } from './convenio.service';

@Controller('convenio')
@UseGuards(AuthGuard, AcessoGuard)
export class ConvenioController {
  constructor(private readonly convenioService: ConvenioService) {}

  @Post()
  async createConvenio(@Body() dto: CreateConvenioDto) {
    return this.convenioService.create(dto);
  }

  @Get('empresa/:empresaId')
  async getAllByEmpresa(
    @Param('empresaId') empresaId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('ativo') ativo?: string,
  ) {
    return this.convenioService.findAllByEmpresa(
      empresaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      this.parseBooleanQuery(ativo),
    );
  }

  @Get(':id')
  async getConvenioById(@Param('id') id: string) {
    return this.convenioService.findById(id);
  }

  @Put(':id')
  async updateConvenio(
    @Param('id') id: string,
    @Body() dto: UpdateConvenioDto,
  ) {
    return this.convenioService.update(id, dto);
  }

  @Delete(':id')
  async deleteConvenio(@Param('id') id: string) {
    return this.convenioService.deleteById(id);
  }

  private parseBooleanQuery(value?: string): boolean | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return undefined;
  }
}

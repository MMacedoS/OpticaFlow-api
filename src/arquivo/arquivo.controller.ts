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
import { CreateArquivoDto, UpdateArquivoDto } from './dto/arquivo.dto';
import { ArquivoService } from './arquivo.service';

@Controller('arquivo')
@UseGuards(AuthGuard, AcessoGuard)
export class ArquivoController {
  constructor(private readonly arquivoService: ArquivoService) {}

  @Post()
  async createArquivo(@Body() dto: CreateArquivoDto) {
    return this.arquivoService.create(dto);
  }

  @Get('empresa/:empresaId')
  async getAllByEmpresa(
    @Param('empresaId') empresaId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('pessoaId') pessoaId?: string,
    @Query('atendimentoId') atendimentoId?: string,
    @Query('prontuarioId') prontuarioId?: string,
    @Query('enviadoPorId') enviadoPorId?: string,
    @Query('mimeType') mimeType?: string,
  ) {
    return this.arquivoService.findAllByEmpresa(
      empresaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      pessoaId,
      atendimentoId,
      prontuarioId,
      enviadoPorId,
      mimeType,
    );
  }

  @Get(':id')
  async getArquivoById(@Param('id') id: string) {
    return this.arquivoService.findById(id);
  }

  @Put(':id')
  async updateArquivo(@Param('id') id: string, @Body() dto: UpdateArquivoDto) {
    return this.arquivoService.update(id, dto);
  }

  @Delete(':id')
  async deleteArquivo(@Param('id') id: string) {
    return this.arquivoService.deleteById(id);
  }
}

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
import { FilialService } from './filial.service';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import {
  ConfigFilialDto,
  ContatoFilialDto,
  CreateFilialDto,
  EnderecoFilialDto,
} from './dto/filial.dto';

@Controller('filial')
@UseGuards(AuthGuard, AcessoGuard)
export class FilialController {
  constructor(private readonly filialService: FilialService) {}

  @Post()
  async createFilial(@Body() dto: CreateFilialDto) {
    return this.filialService.create(dto);
  }

  @Get('empresa/:empresaId')
  async getAllByEmpresa(
    @Param('empresaId') empresaId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.filialService.findAllByEmpresa(
      empresaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
    );
  }

  @Get(':id')
  async getFilialById(@Param('id') id: string) {
    return this.filialService.findById(id);
  }

  @Put(':id')
  async updateFilial(
    @Param('id') id: string,
    @Body() dto: Partial<CreateFilialDto>,
  ) {
    return this.filialService.update(id, dto);
  }

  @Delete(':id')
  async deleteFilial(@Param('id') id: string) {
    return this.filialService.deleteById(id);
  }

  // ─── Endereço ─────────────────────────────────────────────────────────────

  @Post(':id/endereco')
  async addEndereco(@Param('id') id: string, @Body() dto: EnderecoFilialDto) {
    return this.filialService.addEndereco(id, dto);
  }

  @Put(':id/endereco/:enderecoId')
  async updateEndereco(
    @Param('id') id: string,
    @Param('enderecoId') enderecoId: string,
    @Body() dto: Partial<EnderecoFilialDto>,
  ) {
    return this.filialService.updateEndereco(id, enderecoId, dto);
  }

  @Delete(':id/endereco/:enderecoId')
  async deleteEndereco(
    @Param('id') id: string,
    @Param('enderecoId') enderecoId: string,
  ) {
    return this.filialService.deleteEndereco(id, enderecoId);
  }

  // ─── Contato ──────────────────────────────────────────────────────────────

  @Post(':id/contato')
  async addContato(@Param('id') id: string, @Body() dto: ContatoFilialDto) {
    return this.filialService.addContato(id, dto);
  }

  @Put(':id/contato/:contatoId')
  async updateContato(
    @Param('id') id: string,
    @Param('contatoId') contatoId: string,
    @Body() dto: Partial<ContatoFilialDto>,
  ) {
    return this.filialService.updateContato(id, contatoId, dto);
  }

  @Delete(':id/contato/:contatoId')
  async deleteContato(
    @Param('id') id: string,
    @Param('contatoId') contatoId: string,
  ) {
    return this.filialService.deleteContato(id, contatoId);
  }

  // ─── Config ───────────────────────────────────────────────────────────────

  @Put(':id/config')
  async upsertConfig(@Param('id') id: string, @Body() dto: ConfigFilialDto) {
    return this.filialService.upsertConfig(id, dto);
  }
}

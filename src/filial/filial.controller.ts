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
  Req,
  UseGuards,
} from '@nestjs/common';
import { FilialService } from './filial.service';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { ConfigFilialDto, CreateFilialDto } from './dto/filial.dto';
import {
  ContatoEmpresaDto,
  EnderecoEmpresaDto,
} from 'src/empresa/dto/createEmpresa.dto';
import { UsuarioService } from 'src/usuario/usuario.service';
import { UpdateFilialDto } from './dto/update.dto';
import { Status } from '@prisma/client';

@Controller('filiais')
@UseGuards(AuthGuard, AcessoGuard)
export class FilialController {
  constructor(
    private readonly filialService: FilialService,
    private readonly usuarioService: UsuarioService,
  ) {}

  @Get()
  async getAllFiliais(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Req()
    request?: {
      user?: {
        sub: string;
      };
    },
  ) {
    const usuarioId = request?.user?.sub;

    if (!usuarioId) {
      return { status: 401, message: 'Usuário não autenticado.' };
    }

    return this.filialService.findAllByEmpresa(
      usuarioId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
    );
  }

  @Post()
  async createFilial(
    @Body() dto: CreateFilialDto,
    @Req()
    request?: {
      user?: {
        sub: string;
      };
    },
  ) {
    const usuarioId = request?.user?.sub;

    if (!usuarioId) {
      return { status: 401, message: 'Usuário não autenticado.' };
    }

    const usuario = await this.usuarioService.findById(usuarioId);

    if (!usuario) {
      return { status: 401, message: 'Usuário não encontrado.' };
    }

    if (!usuario.empresaId) {
      return {
        status: 401,
        message: 'Usuário não está associado a uma empresa.',
      };
    }

    dto.empresaId = usuario.empresaId;

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
  async updateFilial(@Param('id') id: string, @Body() dto: UpdateFilialDto) {
    return this.filialService.update(id, dto);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.filialService.updateStatus(id, status as Status);
  }

  @Delete(':id')
  async deleteFilial(@Param('id') id: string) {
    return this.filialService.deleteById(id);
  }

  // ─── Config ───────────────────────────────────────────────────────────────

  @Put(':id/config')
  async upsertConfig(@Param('id') id: string, @Body() dto: ConfigFilialDto) {
    return this.filialService.upsertConfig(id, dto);
  }
}

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
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { CreateConvenioDto, UpdateConvenioDto } from './dto/convenio.dto';
import { ConvenioService } from './convenio.service';
import { UsuarioService } from 'src/usuario/usuario.service';

@Controller('agreements')
@UseGuards(AuthGuard, AcessoGuard)
export class ConvenioController {
  constructor(
    private readonly convenioService: ConvenioService,
    private readonly usuarioService: UsuarioService,
  ) {}

  @Post()
  async createConvenio(
    @Body() dto: CreateConvenioDto,
    @Req()
    request?: {
      user?: {
        sub: string;
      };
    },
  ) {
    if (!dto.empresaId) {
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
    }
    return this.convenioService.create(dto);
  }

  @Get()
  async getAllByEmpresa(
    @Param('empresaId') empresaId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('ativo') ativo?: string,
    @Req()
    request?: {
      user?: {
        sub: string;
      };
    },
  ) {
    if (!empresaId) {
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

      empresaId = usuario.empresaId;
    }

    return this.convenioService.findAllByEmpresa(
      empresaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      this.parseBooleanQuery(ativo),
    );
  }

  @Get('all')
  async getAll() {
    return this.convenioService.findAll();
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return await this.convenioService.updateStatus(id, status);
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

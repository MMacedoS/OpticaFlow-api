import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AcessoService } from './acesso.service';
import { CreatePermissaoDto } from './dto/create-permissao.dto';
import { CreateAcessoDto } from './dto/create-acesso.dto';
import { VincularPermissoesDto } from './dto/vincular-permissoes.dto';
import { AtribuirAcessoUsuarioDto } from './dto/atribuir-acesso-usuario.dto';

@Controller('acesso')
@UseGuards(AuthGuard, AcessoGuard)
export class AcessoController {
  constructor(private readonly acessoService: AcessoService) {}

  @Get('meus')
  async listarMeusAcessos(
    @Req()
    request: {
      user?: {
        sub: string;
      };
    },
  ) {
    const usuarioId = request.user?.sub;

    if (!usuarioId) {
      return { status: 401, message: 'Usuário não autenticado.' };
    }

    return this.acessoService.listarAtribuicoesDoUsuario(usuarioId);
  }

  @Post('permissao')
  async createPermissao(@Body() data: CreatePermissaoDto) {
    return this.acessoService.createPermissao(data);
  }

  @Get('permissao')
  async listarPermissoes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('empresaId') empresaId?: string,
  ) {
    const permissoes = await this.acessoService.listarPermissoes(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ? search : '',
      empresaId,
    );

    if (!permissoes || permissoes.length === 0) {
      return { error: 'Nenhuma permissão encontrada' };
    }

    return permissoes;
  }

  @Post()
  async createAcesso(@Body() data: CreateAcessoDto) {
    return this.acessoService.createAcesso(data);
  }

  @Get()
  async listarAcessos(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('empresaId') empresaId?: string,
  ) {
    const acessos = await this.acessoService.listarAcessos(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ? search : '',
      empresaId,
    );

    if (!acessos || acessos.length === 0) {
      return { error: 'Nenhum acesso encontrado' };
    }

    return acessos;
  }

  @Post(':acessoId/permissao')
  async vincularPermissoes(
    @Param('acessoId') acessoId: string,
    @Body() data: VincularPermissoesDto,
  ) {
    return this.acessoService.vincularPermissoes(acessoId, data);
  }

  @Post('atribuicao')
  async atribuirAcessoUsuario(@Body() data: AtribuirAcessoUsuarioDto) {
    return this.acessoService.atribuirAcessoUsuario(data);
  }

  @Get('usuario/:usuarioId')
  async listarAtribuicoesDoUsuario(@Param('usuarioId') usuarioId: string) {
    return this.acessoService.listarAtribuicoesDoUsuario(usuarioId);
  }
}

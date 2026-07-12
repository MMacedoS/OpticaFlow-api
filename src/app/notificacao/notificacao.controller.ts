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
import { CanalNotificacao } from '@prisma/client';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import {
  CreateNotificacaoDto,
  UpdateNotificacaoDto,
} from './dto/notificacao.dto';
import { NotificacaoService } from './notificacao.service';

@Controller('notificacao')
@UseGuards(AuthGuard, AcessoGuard)
export class NotificacaoController {
  constructor(private readonly notificacaoService: NotificacaoService) {}

  @Post()
  async createNotificacao(@Body() dto: CreateNotificacaoDto) {
    return this.notificacaoService.create(dto);
  }

  @Get('empresa/:empresaId')
  async getAllByEmpresa(
    @Param('empresaId') empresaId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filialId') filialId?: string,
    @Query('pessoaId') pessoaId?: string,
    @Query('usuarioDestinoId') usuarioDestinoId?: string,
    @Query('usuarioRemetenteId') usuarioRemetenteId?: string,
    @Query('canal') canal?: CanalNotificacao,
    @Query('lida') lida?: string,
  ) {
    return this.notificacaoService.findAllByEmpresa(
      empresaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
      filialId,
      pessoaId,
      usuarioDestinoId,
      usuarioRemetenteId,
      canal,
      lida === undefined ? undefined : lida === 'true',
    );
  }

  @Get(':id')
  async getNotificacaoById(@Param('id') id: string) {
    return this.notificacaoService.findById(id);
  }

  @Put(':id')
  async updateNotificacao(
    @Param('id') id: string,
    @Body() dto: UpdateNotificacaoDto,
  ) {
    return this.notificacaoService.update(id, dto);
  }

  @Put(':id/marcar-lida')
  async marcarComoLida(@Param('id') id: string) {
    return this.notificacaoService.marcarComoLida(id);
  }

  @Put(':id/marcar-nao-lida')
  async marcarComoNaoLida(@Param('id') id: string) {
    return this.notificacaoService.marcarComoNaoLida(id);
  }

  @Delete(':id')
  async deleteNotificacao(@Param('id') id: string) {
    return this.notificacaoService.deleteById(id);
  }
}

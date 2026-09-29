import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsuarioModule } from '../usuario/usuario.module';
import { NotificacaoController } from './notificacao.controller';
import { NotificacaoService } from './notificacao.service';

@Module({
  providers: [NotificacaoService, AcessoGuard],
  controllers: [NotificacaoController],
  imports: [forwardRef(() => AuthModule), PrismaModule, UsuarioModule],
  exports: [NotificacaoService],
})
export class NotificacaoModule {}

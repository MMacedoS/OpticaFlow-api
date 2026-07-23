import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AtendimentoController } from './atendimento.controller';
import { AtendimentoService } from './atendimento.service';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  providers: [AtendimentoService, AcessoGuard],
  controllers: [AtendimentoController],
  imports: [forwardRef(() => AuthModule), PrismaModule, UsuarioModule],
  exports: [AtendimentoService],
})
export class AtendimentoModule {}

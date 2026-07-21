import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  providers: [AgendaService, AcessoGuard],
  controllers: [AgendaController],
  imports: [forwardRef(() => AuthModule), PrismaModule, UsuarioModule],
  exports: [AgendaService],
})
export class AgendaModule {}

import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsuarioModule } from '../usuario/usuario.module';
import { RelatorioController } from './relatorio.controller';
import { RelatorioService } from './relatorio.service';

@Module({
  providers: [RelatorioService, AcessoGuard],
  controllers: [RelatorioController],
  imports: [forwardRef(() => AuthModule), PrismaModule, UsuarioModule],
})
export class RelatorioModule {}

import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LaboratorioController } from './laboratorio.controller';
import { LaboratorioService } from './laboratorio.service';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  providers: [LaboratorioService, AcessoGuard],
  controllers: [LaboratorioController],
  imports: [forwardRef(() => AuthModule), PrismaModule, UsuarioModule],
  exports: [LaboratorioService],
})
export class LaboratorioModule {}

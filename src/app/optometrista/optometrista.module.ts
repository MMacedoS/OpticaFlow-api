import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OptometristaController } from './optometrista.controller';
import { OptometristaService } from './optometrista.service';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  providers: [OptometristaService, AcessoGuard],
  controllers: [OptometristaController],
  imports: [forwardRef(() => AuthModule), PrismaModule, UsuarioModule],
  exports: [OptometristaService],
})
export class OptometristaModule {}

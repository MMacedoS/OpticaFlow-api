import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsuarioModule } from '../usuario/usuario.module';
import { ResponsavelController } from './responsavel.controller';
import { ResponsavelService } from './responsavel.service';

@Module({
  providers: [ResponsavelService, AcessoGuard],
  controllers: [ResponsavelController],
  imports: [forwardRef(() => AuthModule), PrismaModule, UsuarioModule],
  exports: [ResponsavelService],
})
export class ResponsavelModule {}

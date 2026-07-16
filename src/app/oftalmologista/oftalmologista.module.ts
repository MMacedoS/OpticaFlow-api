import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OftalmologistaController } from './oftalmologista.controller';
import { OftalmologistaService } from './oftalmologista.service';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  providers: [OftalmologistaService, AcessoGuard],
  controllers: [OftalmologistaController],
  imports: [forwardRef(() => AuthModule), PrismaModule, UsuarioModule],
  exports: [OftalmologistaService],
})
export class OftalmologistaModule {}

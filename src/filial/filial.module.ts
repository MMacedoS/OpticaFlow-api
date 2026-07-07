import { forwardRef, Module } from '@nestjs/common';
import { FilialService } from './filial.service';
import { FilialController } from './filial.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { UsuarioModule } from 'src/usuario/usuario.module';

@Module({
  providers: [FilialService, AcessoGuard],
  controllers: [FilialController],
  imports: [forwardRef(() => AuthModule), PrismaModule, UsuarioModule],
  exports: [FilialService],
})
export class FilialModule {}

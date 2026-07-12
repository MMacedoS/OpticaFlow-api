import { forwardRef, Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';

@Module({
  providers: [UsuarioService, AcessoGuard],
  controllers: [UsuarioController],
  imports: [
    forwardRef(() => AuthModule), // Use forwardRef to resolve circular dependency
    PrismaModule,
  ],
  exports: [UsuarioService],
})
export class UsuarioModule {}

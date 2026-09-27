import { forwardRef, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuditoriaInterceptor } from 'src/interceptors/auditoria/auditoria.interceptor';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsuarioModule } from '../usuario/usuario.module';
import { AuditoriaController } from './auditoria.controller';
import { AuditoriaService } from './auditoria.service';

@Module({
  providers: [
    AuditoriaService,
    AcessoGuard,
    { provide: APP_INTERCEPTOR, useClass: AuditoriaInterceptor },
  ],
  controllers: [AuditoriaController],
  imports: [forwardRef(() => AuthModule), PrismaModule, UsuarioModule],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}

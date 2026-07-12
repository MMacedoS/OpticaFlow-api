import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditoriaController } from './auditoria.controller';
import { AuditoriaService } from './auditoria.service';

@Module({
  providers: [AuditoriaService, AcessoGuard],
  controllers: [AuditoriaController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}

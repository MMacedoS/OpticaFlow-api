import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LaboratorioController } from './laboratorio.controller';
import { LaboratorioService } from './laboratorio.service';

@Module({
  providers: [LaboratorioService, AcessoGuard],
  controllers: [LaboratorioController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [LaboratorioService],
})
export class LaboratorioModule {}

import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';

@Module({
  providers: [AgendaService, AcessoGuard],
  controllers: [AgendaController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [AgendaService],
})
export class AgendaModule {}

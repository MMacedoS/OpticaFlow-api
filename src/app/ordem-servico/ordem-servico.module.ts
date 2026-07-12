import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OrdemServicoController } from './ordem-servico.controller';
import { OrdemServicoService } from './ordem-servico.service';

@Module({
  providers: [OrdemServicoService, AcessoGuard],
  controllers: [OrdemServicoController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [OrdemServicoService],
})
export class OrdemServicoModule {}

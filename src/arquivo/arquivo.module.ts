import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ArquivoController } from './arquivo.controller';
import { ArquivoService } from './arquivo.service';

@Module({
  providers: [ArquivoService, AcessoGuard],
  controllers: [ArquivoController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [ArquivoService],
})
export class ArquivoModule {}

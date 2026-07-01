import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConvenioController } from './convenio.controller';
import { ConvenioService } from './convenio.service';

@Module({
  providers: [ConvenioService, AcessoGuard],
  controllers: [ConvenioController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [ConvenioService],
})
export class ConvenioModule {}

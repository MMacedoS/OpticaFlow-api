import { forwardRef, Module } from '@nestjs/common';
import { FilialService } from './filial.service';
import { FilialController } from './filial.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';

@Module({
  providers: [FilialService, AcessoGuard],
  controllers: [FilialController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [FilialService],
})
export class FilialModule {}

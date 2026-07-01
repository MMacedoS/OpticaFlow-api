import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ResponsavelController } from './responsavel.controller';
import { ResponsavelService } from './responsavel.service';

@Module({
  providers: [ResponsavelService, AcessoGuard],
  controllers: [ResponsavelController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [ResponsavelService],
})
export class ResponsavelModule {}

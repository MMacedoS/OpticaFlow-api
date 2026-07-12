import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OptometristaController } from './optometrista.controller';
import { OptometristaService } from './optometrista.service';

@Module({
  providers: [OptometristaService, AcessoGuard],
  controllers: [OptometristaController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [OptometristaService],
})
export class OptometristaModule {}

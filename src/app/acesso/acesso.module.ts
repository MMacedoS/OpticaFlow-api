import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AcessoService } from './acesso.service';
import { AcessoController } from './acesso.controller';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';

@Module({
  imports: [
    forwardRef(() => AuthModule), // Use forwardRef to resolve circular dependency
    PrismaModule,
  ],
  providers: [AcessoService, AcessoGuard],
  controllers: [AcessoController],
  exports: [AcessoService],
})
export class AcessoModule {}

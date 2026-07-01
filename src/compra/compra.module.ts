import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CompraController } from './compra.controller';
import { CompraService } from './compra.service';

@Module({
  providers: [CompraService, AcessoGuard],
  controllers: [CompraController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [CompraService],
})
export class CompraModule {}

import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CompraItemController } from './compra-item.controller';
import { CompraItemService } from './compra-item.service';

@Module({
  providers: [CompraItemService, AcessoGuard],
  controllers: [CompraItemController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [CompraItemService],
})
export class CompraItemModule {}

import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VendaItemController } from './venda-item.controller';
import { VendaItemService } from './venda-item.service';

@Module({
  providers: [VendaItemService, AcessoGuard],
  controllers: [VendaItemController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [VendaItemService],
})
export class VendaItemModule {}

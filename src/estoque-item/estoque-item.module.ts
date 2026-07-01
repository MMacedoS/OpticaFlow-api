import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EstoqueItemController } from './estoque-item.controller';
import { EstoqueItemService } from './estoque-item.service';

@Module({
  providers: [EstoqueItemService, AcessoGuard],
  controllers: [EstoqueItemController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [EstoqueItemService],
})
export class EstoqueItemModule {}

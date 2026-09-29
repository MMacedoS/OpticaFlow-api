import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MovimentoEstoqueModule } from '../movimento-estoque/movimento-estoque.module';
import { OrdemServicoItemController } from './ordem-servico-item.controller';
import { OrdemServicoItemService } from './ordem-servico-item.service';

@Module({
  providers: [OrdemServicoItemService, AcessoGuard],
  controllers: [OrdemServicoItemController],
  imports: [forwardRef(() => AuthModule), PrismaModule, MovimentoEstoqueModule],
  exports: [OrdemServicoItemService],
})
export class OrdemServicoItemModule {}

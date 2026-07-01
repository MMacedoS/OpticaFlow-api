import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProdutoController } from './produto.controller';
import { ProdutoService } from './produto.service';

@Module({
  providers: [ProdutoService, AcessoGuard],
  controllers: [ProdutoController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [ProdutoService],
})
export class ProdutoModule {}

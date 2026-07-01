import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MovimentoEstoqueController } from './movimento-estoque.controller';
import { MovimentoEstoqueService } from './movimento-estoque.service';

@Module({
  providers: [MovimentoEstoqueService, AcessoGuard],
  controllers: [MovimentoEstoqueController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [MovimentoEstoqueService],
})
export class MovimentoEstoqueModule {}

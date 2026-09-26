import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MovimentoEstoqueController } from './movimento-estoque.controller';
import { MovimentoEstoqueService } from './movimento-estoque.service';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  providers: [MovimentoEstoqueService, AcessoGuard],
  controllers: [MovimentoEstoqueController],
  imports: [forwardRef(() => AuthModule), PrismaModule, UsuarioModule],
  exports: [MovimentoEstoqueService],
})
export class MovimentoEstoqueModule {}

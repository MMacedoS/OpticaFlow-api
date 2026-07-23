import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProdutoController } from './produto.controller';
import { ProdutoService } from './produto.service';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  providers: [ProdutoService, AcessoGuard],
  controllers: [ProdutoController],
  imports: [forwardRef(() => AuthModule), PrismaModule, UsuarioModule],
  exports: [ProdutoService],
})
export class ProdutoModule {}

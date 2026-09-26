import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CompraController } from './compra.controller';
import { CompraService } from './compra.service';
import { MovimentoEstoqueModule } from '../movimento-estoque/movimento-estoque.module';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  providers: [CompraService, AcessoGuard],
  controllers: [CompraController],
  imports: [
    forwardRef(() => AuthModule),
    PrismaModule,
    UsuarioModule,
    MovimentoEstoqueModule,
  ],
  exports: [CompraService],
})
export class CompraModule {}

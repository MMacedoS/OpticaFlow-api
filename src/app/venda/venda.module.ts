import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VendaController } from './venda.controller';
import { VendaService } from './venda.service';
import { MovimentoEstoqueModule } from '../movimento-estoque/movimento-estoque.module';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  providers: [VendaService, AcessoGuard],
  controllers: [VendaController],
  imports: [
    forwardRef(() => AuthModule),
    PrismaModule,
    UsuarioModule,
    MovimentoEstoqueModule,
  ],
  exports: [VendaService],
})
export class VendaModule {}

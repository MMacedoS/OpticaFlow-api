import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EstoqueController } from './estoque.controller';
import { EstoqueService } from './estoque.service';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  providers: [EstoqueService, AcessoGuard],
  controllers: [EstoqueController],
  imports: [forwardRef(() => AuthModule), PrismaModule, UsuarioModule],
  exports: [EstoqueService],
})
export class EstoqueModule {}

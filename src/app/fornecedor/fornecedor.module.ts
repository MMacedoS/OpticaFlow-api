import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FornecedorController } from './fornecedor.controller';
import { FornecedorService } from './fornecedor.service';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  providers: [FornecedorService, AcessoGuard],
  controllers: [FornecedorController],
  imports: [forwardRef(() => AuthModule), PrismaModule, UsuarioModule],
  exports: [FornecedorService],
})
export class FornecedorModule {}

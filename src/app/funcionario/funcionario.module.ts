import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FuncionarioController } from './funcionario.controller';
import { FuncionarioService } from './funcionario.service';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  providers: [FuncionarioService, AcessoGuard],
  controllers: [FuncionarioController],
  imports: [forwardRef(() => AuthModule), PrismaModule, UsuarioModule],
  exports: [FuncionarioService],
})
export class FuncionarioModule {}

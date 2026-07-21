import { forwardRef, Module } from '@nestjs/common';
import { PessoaService } from './pessoa.service';
import { PessoaController } from './pessoa.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsuarioModule } from '../usuario/usuario.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';

@Module({
  providers: [PessoaService, AcessoGuard],
  controllers: [PessoaController],
  imports: [forwardRef(() => AuthModule), PrismaModule, UsuarioModule],
  exports: [PessoaService],
})
export class PessoaModule {}

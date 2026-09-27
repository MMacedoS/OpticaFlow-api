import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FinanceiroLancamentoController } from './financeiro-lancamento.controller';
import { FinanceiroLancamentoService } from './financeiro-lancamento.service';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  providers: [FinanceiroLancamentoService, AcessoGuard],
  controllers: [FinanceiroLancamentoController],
  imports: [forwardRef(() => AuthModule), PrismaModule, UsuarioModule],
  exports: [FinanceiroLancamentoService],
})
export class FinanceiroLancamentoModule {}

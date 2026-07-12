import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FinanceiroLancamentoController } from './financeiro-lancamento.controller';
import { FinanceiroLancamentoService } from './financeiro-lancamento.service';

@Module({
  providers: [FinanceiroLancamentoService, AcessoGuard],
  controllers: [FinanceiroLancamentoController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [FinanceiroLancamentoService],
})
export class FinanceiroLancamentoModule {}

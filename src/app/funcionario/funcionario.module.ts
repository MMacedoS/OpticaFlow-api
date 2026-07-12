import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FuncionarioController } from './funcionario.controller';
import { FuncionarioService } from './funcionario.service';

@Module({
  providers: [FuncionarioService, AcessoGuard],
  controllers: [FuncionarioController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [FuncionarioService],
})
export class FuncionarioModule {}

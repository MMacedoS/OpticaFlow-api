import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FornecedorController } from './fornecedor.controller';
import { FornecedorService } from './fornecedor.service';

@Module({
  providers: [FornecedorService, AcessoGuard],
  controllers: [FornecedorController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [FornecedorService],
})
export class FornecedorModule {}

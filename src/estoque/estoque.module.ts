import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EstoqueController } from './estoque.controller';
import { EstoqueService } from './estoque.service';

@Module({
  providers: [EstoqueService, AcessoGuard],
  controllers: [EstoqueController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [EstoqueService],
})
export class EstoqueModule {}

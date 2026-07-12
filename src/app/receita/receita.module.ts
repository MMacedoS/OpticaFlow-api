import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ReceitaController } from './receita.controller';
import { ReceitaService } from './receita.service';

@Module({
  providers: [ReceitaService, AcessoGuard],
  controllers: [ReceitaController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [ReceitaService],
})
export class ReceitaModule {}

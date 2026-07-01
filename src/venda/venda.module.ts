import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VendaController } from './venda.controller';
import { VendaService } from './venda.service';

@Module({
  providers: [VendaService, AcessoGuard],
  controllers: [VendaController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [VendaService],
})
export class VendaModule {}

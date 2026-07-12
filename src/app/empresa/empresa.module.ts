import { forwardRef, Module } from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { EmpresaController } from './empresa.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/app/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';

@Module({
  providers: [EmpresaService, AcessoGuard],
  controllers: [EmpresaController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [EmpresaService],
})
export class EmpresaModule {}

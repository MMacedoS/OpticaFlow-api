import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProntuarioController } from './prontuario.controller';
import { ProntuarioService } from './prontuario.service';

@Module({
  providers: [ProntuarioService, AcessoGuard],
  controllers: [ProntuarioController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [ProntuarioService],
})
export class ProntuarioModule {}

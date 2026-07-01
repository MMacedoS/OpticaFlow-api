import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OftalmologistaController } from './oftalmologista.controller';
import { OftalmologistaService } from './oftalmologista.service';

@Module({
  providers: [OftalmologistaService, AcessoGuard],
  controllers: [OftalmologistaController],
  imports: [forwardRef(() => AuthModule), PrismaModule],
  exports: [OftalmologistaService],
})
export class OftalmologistaModule {}

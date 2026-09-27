import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsuarioModule } from '../usuario/usuario.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  providers: [DashboardService],
  controllers: [DashboardController],
  imports: [forwardRef(() => AuthModule), PrismaModule, UsuarioModule],
})
export class DashboardModule {}

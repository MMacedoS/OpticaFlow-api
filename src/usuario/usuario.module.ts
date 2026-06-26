import { Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  providers: [UsuarioService],
  controllers: [UsuarioController],
  imports: [PrismaModule],
})
export class UsuarioModule {}

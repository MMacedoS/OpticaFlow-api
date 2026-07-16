import { forwardRef, Module } from '@nestjs/common';
import { ClienteService } from './cliente.service';
import { ClienteController } from './cliente.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FilialModule } from 'src/app/filial/filial.module';
import { UsuarioModule } from 'src/app/usuario/usuario.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  providers: [ClienteService],
  imports: [
    forwardRef(() => AuthModule),
    PrismaModule,
    FilialModule,
    UsuarioModule,
  ],
  controllers: [ClienteController],
})
export class ClienteModule {}

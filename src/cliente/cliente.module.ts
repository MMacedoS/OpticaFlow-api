import { forwardRef, Module } from '@nestjs/common';
import { ClienteService } from './cliente.service';
import { ClienteController } from './cliente.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FilialModule } from 'src/filial/filial.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsuarioModule } from 'src/usuario/usuario.module';

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

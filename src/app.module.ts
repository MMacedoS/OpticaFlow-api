import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PessoaModule } from './pessoa/pessoa.module';
import { UsuarioModule } from './usuario/usuario.module';

@Module({
  imports: [PrismaModule, PessoaModule, UsuarioModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

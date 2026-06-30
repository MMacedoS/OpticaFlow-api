import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PessoaModule } from './pessoa/pessoa.module';
import { UsuarioModule } from './usuario/usuario.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { EmpresaModule } from './empresa/empresa.module';
import { AcessoModule } from './acesso/acesso.module';
import { FilialModule } from './filial/filial.module';
import { FuncionarioModule } from './funcionario/funcionario.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    PessoaModule,
    UsuarioModule,
    AuthModule,
    EmpresaModule,
    AcessoModule,
    FilialModule,
    FuncionarioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

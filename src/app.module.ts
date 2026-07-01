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
import { OptometristaModule } from './optometrista/optometrista.module';
import { OftalmologistaModule } from './oftalmologista/oftalmologista.module';
import { ResponsavelModule } from './responsavel/responsavel.module';
import { FornecedorModule } from './fornecedor/fornecedor.module';
import { AgendaModule } from './agenda/agenda.module';
import { AtendimentoModule } from './atendimento/atendimento.module';
import { ProntuarioModule } from './prontuario/prontuario.module';
import { ReceitaModule } from './receita/receita.module';
import { ProdutoModule } from './produto/produto.module';

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
    OptometristaModule,
    OftalmologistaModule,
    ResponsavelModule,
    FornecedorModule,
    AgendaModule,
    AtendimentoModule,
    ProntuarioModule,
    ReceitaModule,
    ProdutoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

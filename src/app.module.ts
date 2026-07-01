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
import { EstoqueModule } from './estoque/estoque.module';
import { EstoqueItemModule } from './estoque-item/estoque-item.module';
import { MovimentoEstoqueModule } from './movimento-estoque/movimento-estoque.module';
import { CompraModule } from './compra/compra.module';
import { CompraItemModule } from './compra-item/compra-item.module';
import { VendaModule } from './venda/venda.module';
import { VendaItemModule } from './venda-item/venda-item.module';
import { LaboratorioModule } from './laboratorio/laboratorio.module';
import { OrdemServicoModule } from './ordem-servico/ordem-servico.module';
import { OrdemServicoItemModule } from './ordem-servico-item/ordem-servico-item.module';
import { ConvenioModule } from './convenio/convenio.module';

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
    EstoqueModule,
    EstoqueItemModule,
    MovimentoEstoqueModule,
    CompraModule,
    CompraItemModule,
    VendaModule,
    VendaItemModule,
    LaboratorioModule,
    OrdemServicoModule,
    OrdemServicoItemModule,
    ConvenioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

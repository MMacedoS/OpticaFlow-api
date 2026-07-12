import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsuarioModule } from './app/usuario/usuario.module';
import { AuthModule } from './app/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { EmpresaModule } from './app/empresa/empresa.module';
import { AcessoModule } from './app/acesso/acesso.module';
import { FilialModule } from './app/filial/filial.module';
import { FuncionarioModule } from './app/funcionario/funcionario.module';
import { OptometristaModule } from './app/optometrista/optometrista.module';
import { OftalmologistaModule } from './app/oftalmologista/oftalmologista.module';
import { ResponsavelModule } from './app/responsavel/responsavel.module';
import { FornecedorModule } from './app/fornecedor/fornecedor.module';
import { AgendaModule } from './app/agenda/agenda.module';
import { AtendimentoModule } from './app/atendimento/atendimento.module';
import { ProntuarioModule } from './app/prontuario/prontuario.module';
import { ReceitaModule } from './app/receita/receita.module';
import { ProdutoModule } from './app/produto/produto.module';
import { EstoqueModule } from './app/estoque/estoque.module';
import { EstoqueItemModule } from './app/estoque-item/estoque-item.module';
import { MovimentoEstoqueModule } from './app/movimento-estoque/movimento-estoque.module';
import { CompraModule } from './app/compra/compra.module';
import { CompraItemModule } from './app/compra-item/compra-item.module';
import { VendaModule } from './app/venda/venda.module';
import { VendaItemModule } from './app/venda-item/venda-item.module';
import { LaboratorioModule } from './app/laboratorio/laboratorio.module';
import { OrdemServicoModule } from './app/ordem-servico/ordem-servico.module';
import { OrdemServicoItemModule } from './app/ordem-servico-item/ordem-servico-item.module';
import { ConvenioModule } from './app/convenio/convenio.module';
import { FinanceiroLancamentoModule } from './app/financeiro-lancamento/financeiro-lancamento.module';
import { ArquivoModule } from './app/arquivo/arquivo.module';
import { NotificacaoModule } from './app/notificacao/notificacao.module';
import { AuditoriaModule } from './app/auditoria/auditoria.module';
import { ClienteModule } from './app/cliente/cliente.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
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
    FinanceiroLancamentoModule,
    ArquivoModule,
    NotificacaoModule,
    AuditoriaModule,
    ClienteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

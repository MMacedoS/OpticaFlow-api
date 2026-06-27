/*
  Warnings:

  - A unique constraint covering the columns `[empresaId,modulo,acao]` on the table `Permissao` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StatusAgenda" AS ENUM ('agendado', 'confirmado', 'cancelado', 'concluido', 'falta');

-- CreateEnum
CREATE TYPE "StatusAtendimento" AS ENUM ('em_espera', 'em_andamento', 'concluido', 'cancelado');

-- CreateEnum
CREATE TYPE "TipoReceita" AS ENUM ('oculos', 'lente_contato', 'medicamento');

-- CreateEnum
CREATE TYPE "TipoProduto" AS ENUM ('armacao', 'lente', 'acessorio', 'servico');

-- CreateEnum
CREATE TYPE "TipoMovimentoEstoque" AS ENUM ('entrada', 'saida', 'ajuste');

-- CreateEnum
CREATE TYPE "StatusOrdemServico" AS ENUM ('aberta', 'em_producao', 'pronta', 'entregue', 'cancelada');

-- CreateEnum
CREATE TYPE "TipoFinanceiro" AS ENUM ('receita', 'despesa');

-- CreateEnum
CREATE TYPE "CanalNotificacao" AS ENUM ('sistema', 'email', 'whatsapp', 'sms');

-- AlterTable
ALTER TABLE "Acesso" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "convenioId" TEXT,
ADD COLUMN     "numero_convenio" TEXT;

-- AlterTable
ALTER TABLE "Permissao" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "empresaId" TEXT;

-- CreateTable
CREATE TABLE "Agenda" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "filialId" TEXT NOT NULL,
    "pessoaId" TEXT,
    "profissionalId" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "duracaoMin" INTEGER,
    "status" "StatusAgenda" NOT NULL DEFAULT 'agendado',
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atendimento" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "filialId" TEXT NOT NULL,
    "agendaId" TEXT,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT,
    "clienteId" TEXT,
    "convenioId" TEXT,
    "dataAtendimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusAtendimento" NOT NULL DEFAULT 'em_espera',
    "queixa_principal" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prontuario" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "filialId" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT,
    "resumo_clinico" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prontuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProntuarioAnamnese" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "historico_pessoal" TEXT,
    "historico_familiar" TEXT,
    "alergias" TEXT,
    "medicamentos_uso" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProntuarioAnamnese_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProntuarioAcuidadeVisual" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "od_sem_correcao" TEXT,
    "oe_sem_correcao" TEXT,
    "od_com_correcao" TEXT,
    "oe_com_correcao" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProntuarioAcuidadeVisual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProntuarioRefracao" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "od_esferico" TEXT,
    "od_cilindrico" TEXT,
    "od_eixo" TEXT,
    "oe_esferico" TEXT,
    "oe_cilindrico" TEXT,
    "oe_eixo" TEXT,
    "dp" TEXT,
    "adicao" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProntuarioRefracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProntuarioCeratometria" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "od_k1" TEXT,
    "od_k2" TEXT,
    "oe_k1" TEXT,
    "oe_k2" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProntuarioCeratometria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProntuarioBiomicroscopia" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProntuarioBiomicroscopia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProntuarioFundoscopia" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProntuarioFundoscopia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProntuarioPressaoIntraocular" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "od_mmhg" DOUBLE PRECISION,
    "oe_mmhg" DOUBLE PRECISION,
    "horario" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProntuarioPressaoIntraocular_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProntuarioDiagnostico" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "versao" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProntuarioDiagnostico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProntuarioExameComplementar" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "exame" TEXT NOT NULL,
    "resultado" TEXT,
    "dataExame" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProntuarioExameComplementar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProntuarioEvolucaoClinica" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataEvolucao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProntuarioEvolucaoClinica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receita" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "filialId" TEXT NOT NULL,
    "atendimentoId" TEXT,
    "prontuarioId" TEXT,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT,
    "tipo" "TipoReceita" NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceitaOculos" (
    "id" TEXT NOT NULL,
    "receitaId" TEXT NOT NULL,
    "od_esferico" TEXT,
    "od_cilindrico" TEXT,
    "od_eixo" TEXT,
    "oe_esferico" TEXT,
    "oe_cilindrico" TEXT,
    "oe_eixo" TEXT,
    "dp" TEXT,
    "adicao" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "ReceitaOculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceitaLenteContato" (
    "id" TEXT NOT NULL,
    "receitaId" TEXT NOT NULL,
    "od_curva_base" TEXT,
    "od_diametro" TEXT,
    "od_grau" TEXT,
    "oe_curva_base" TEXT,
    "oe_diametro" TEXT,
    "oe_grau" TEXT,
    "material" TEXT,
    "marca" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "ReceitaLenteContato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceitaMedicamento" (
    "id" TEXT NOT NULL,
    "receitaId" TEXT NOT NULL,
    "medicamento" TEXT NOT NULL,
    "dosagem" TEXT,
    "posologia" TEXT,
    "duracao" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "ReceitaMedicamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "tipo" "TipoProduto" NOT NULL,
    "categoria" TEXT,
    "descricao" TEXT,
    "preco_custo" DOUBLE PRECISION,
    "preco_venda" DOUBLE PRECISION NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estoque" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "filialId" TEXT NOT NULL,
    "nome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstoqueItem" (
    "id" TEXT NOT NULL,
    "estoqueId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimo" DOUBLE PRECISION,
    "maximo" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstoqueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentoEstoque" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "estoqueId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "tipo" "TipoMovimentoEstoque" NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT,
    "referencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimentoEstoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compra" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "filialId" TEXT NOT NULL,
    "fornecedorId" TEXT,
    "dataCompra" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT,
    "valor_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompraItem" (
    "id" TEXT NOT NULL,
    "compraId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "valor_unitario" DOUBLE PRECISION NOT NULL,
    "desconto" DOUBLE PRECISION,

    CONSTRAINT "CompraItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venda" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "filialId" TEXT NOT NULL,
    "clienteId" TEXT,
    "atendimentoId" TEXT,
    "dataVenda" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT,
    "valor_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendaItem" (
    "id" TEXT NOT NULL,
    "vendaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "valor_unitario" DOUBLE PRECISION NOT NULL,
    "desconto" DOUBLE PRECISION,

    CONSTRAINT "VendaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Laboratorio" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Laboratorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemServico" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "filialId" TEXT NOT NULL,
    "atendimentoId" TEXT,
    "clienteId" TEXT,
    "laboratorioId" TEXT,
    "numero" TEXT,
    "status" "StatusOrdemServico" NOT NULL DEFAULT 'aberta',
    "descricao" TEXT,
    "previsao_entrega" TIMESTAMP(3),
    "data_entrega" TIMESTAMP(3),
    "valor_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdemServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemServicoItem" (
    "id" TEXT NOT NULL,
    "ordemServicoId" TEXT NOT NULL,
    "produtoId" TEXT,
    "descricao_servico" TEXT,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "valor_unitario" DOUBLE PRECISION NOT NULL,
    "desconto" DOUBLE PRECISION,

    CONSTRAINT "OrdemServicoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Convenio" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "registro" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Convenio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceiroLancamento" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "filialId" TEXT,
    "atendimentoId" TEXT,
    "vendaId" TEXT,
    "compraId" TEXT,
    "ordemServicoId" TEXT,
    "criadoPorId" TEXT,
    "tipo" "TipoFinanceiro" NOT NULL,
    "categoria" TEXT,
    "descricao" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "vencimento" TIMESTAMP(3),
    "pagoEm" TIMESTAMP(3),
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceiroLancamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Arquivo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "filialId" TEXT,
    "pessoaId" TEXT,
    "atendimentoId" TEXT,
    "prontuarioId" TEXT,
    "enviadoPorId" TEXT,
    "nome" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mime_type" TEXT,
    "tamanho" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Arquivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "filialId" TEXT,
    "pessoaId" TEXT,
    "usuarioDestinoId" TEXT,
    "usuarioRemetenteId" TEXT,
    "canal" "CanalNotificacao" NOT NULL DEFAULT 'sistema',
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lidaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "filialId" TEXT,
    "usuarioId" TEXT,
    "atendimentoId" TEXT,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "acao" TEXT NOT NULL,
    "dados_antes" JSONB,
    "dados_depois" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Agenda_empresaId_dataHora_idx" ON "Agenda"("empresaId", "dataHora");

-- CreateIndex
CREATE INDEX "Agenda_filialId_dataHora_idx" ON "Agenda"("filialId", "dataHora");

-- CreateIndex
CREATE INDEX "Agenda_pessoaId_idx" ON "Agenda"("pessoaId");

-- CreateIndex
CREATE INDEX "Agenda_profissionalId_idx" ON "Agenda"("profissionalId");

-- CreateIndex
CREATE UNIQUE INDEX "Atendimento_agendaId_key" ON "Atendimento"("agendaId");

-- CreateIndex
CREATE INDEX "Atendimento_empresaId_dataAtendimento_idx" ON "Atendimento"("empresaId", "dataAtendimento");

-- CreateIndex
CREATE INDEX "Atendimento_filialId_dataAtendimento_idx" ON "Atendimento"("filialId", "dataAtendimento");

-- CreateIndex
CREATE INDEX "Atendimento_pacienteId_idx" ON "Atendimento"("pacienteId");

-- CreateIndex
CREATE INDEX "Atendimento_profissionalId_idx" ON "Atendimento"("profissionalId");

-- CreateIndex
CREATE INDEX "Atendimento_clienteId_idx" ON "Atendimento"("clienteId");

-- CreateIndex
CREATE INDEX "Atendimento_convenioId_idx" ON "Atendimento"("convenioId");

-- CreateIndex
CREATE UNIQUE INDEX "Prontuario_atendimentoId_key" ON "Prontuario"("atendimentoId");

-- CreateIndex
CREATE INDEX "Prontuario_empresaId_idx" ON "Prontuario"("empresaId");

-- CreateIndex
CREATE INDEX "Prontuario_filialId_idx" ON "Prontuario"("filialId");

-- CreateIndex
CREATE INDEX "Prontuario_pacienteId_idx" ON "Prontuario"("pacienteId");

-- CreateIndex
CREATE INDEX "Prontuario_profissionalId_idx" ON "Prontuario"("profissionalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProntuarioAnamnese_prontuarioId_key" ON "ProntuarioAnamnese"("prontuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ProntuarioAcuidadeVisual_prontuarioId_key" ON "ProntuarioAcuidadeVisual"("prontuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ProntuarioRefracao_prontuarioId_key" ON "ProntuarioRefracao"("prontuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ProntuarioCeratometria_prontuarioId_key" ON "ProntuarioCeratometria"("prontuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ProntuarioBiomicroscopia_prontuarioId_key" ON "ProntuarioBiomicroscopia"("prontuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ProntuarioFundoscopia_prontuarioId_key" ON "ProntuarioFundoscopia"("prontuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ProntuarioPressaoIntraocular_prontuarioId_key" ON "ProntuarioPressaoIntraocular"("prontuarioId");

-- CreateIndex
CREATE INDEX "ProntuarioDiagnostico_prontuarioId_idx" ON "ProntuarioDiagnostico"("prontuarioId");

-- CreateIndex
CREATE INDEX "ProntuarioDiagnostico_codigo_versao_idx" ON "ProntuarioDiagnostico"("codigo", "versao");

-- CreateIndex
CREATE INDEX "ProntuarioExameComplementar_prontuarioId_idx" ON "ProntuarioExameComplementar"("prontuarioId");

-- CreateIndex
CREATE INDEX "ProntuarioEvolucaoClinica_prontuarioId_dataEvolucao_idx" ON "ProntuarioEvolucaoClinica"("prontuarioId", "dataEvolucao");

-- CreateIndex
CREATE INDEX "Receita_empresaId_tipo_idx" ON "Receita"("empresaId", "tipo");

-- CreateIndex
CREATE INDEX "Receita_filialId_idx" ON "Receita"("filialId");

-- CreateIndex
CREATE INDEX "Receita_atendimentoId_idx" ON "Receita"("atendimentoId");

-- CreateIndex
CREATE INDEX "Receita_prontuarioId_idx" ON "Receita"("prontuarioId");

-- CreateIndex
CREATE INDEX "Receita_pacienteId_idx" ON "Receita"("pacienteId");

-- CreateIndex
CREATE INDEX "Receita_profissionalId_idx" ON "Receita"("profissionalId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceitaOculos_receitaId_key" ON "ReceitaOculos"("receitaId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceitaLenteContato_receitaId_key" ON "ReceitaLenteContato"("receitaId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceitaMedicamento_receitaId_key" ON "ReceitaMedicamento"("receitaId");

-- CreateIndex
CREATE INDEX "Produto_empresaId_tipo_idx" ON "Produto"("empresaId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Produto_empresaId_sku_key" ON "Produto"("empresaId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Estoque_empresaId_filialId_key" ON "Estoque"("empresaId", "filialId");

-- CreateIndex
CREATE INDEX "EstoqueItem_produtoId_idx" ON "EstoqueItem"("produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "EstoqueItem_estoqueId_produtoId_key" ON "EstoqueItem"("estoqueId", "produtoId");

-- CreateIndex
CREATE INDEX "MovimentoEstoque_empresaId_createdAt_idx" ON "MovimentoEstoque"("empresaId", "createdAt");

-- CreateIndex
CREATE INDEX "MovimentoEstoque_estoqueId_createdAt_idx" ON "MovimentoEstoque"("estoqueId", "createdAt");

-- CreateIndex
CREATE INDEX "MovimentoEstoque_produtoId_createdAt_idx" ON "MovimentoEstoque"("produtoId", "createdAt");

-- CreateIndex
CREATE INDEX "Compra_empresaId_dataCompra_idx" ON "Compra"("empresaId", "dataCompra");

-- CreateIndex
CREATE INDEX "Compra_filialId_dataCompra_idx" ON "Compra"("filialId", "dataCompra");

-- CreateIndex
CREATE INDEX "Compra_fornecedorId_idx" ON "Compra"("fornecedorId");

-- CreateIndex
CREATE INDEX "CompraItem_compraId_idx" ON "CompraItem"("compraId");

-- CreateIndex
CREATE INDEX "CompraItem_produtoId_idx" ON "CompraItem"("produtoId");

-- CreateIndex
CREATE INDEX "Venda_empresaId_dataVenda_idx" ON "Venda"("empresaId", "dataVenda");

-- CreateIndex
CREATE INDEX "Venda_filialId_dataVenda_idx" ON "Venda"("filialId", "dataVenda");

-- CreateIndex
CREATE INDEX "Venda_clienteId_idx" ON "Venda"("clienteId");

-- CreateIndex
CREATE INDEX "Venda_atendimentoId_idx" ON "Venda"("atendimentoId");

-- CreateIndex
CREATE INDEX "VendaItem_vendaId_idx" ON "VendaItem"("vendaId");

-- CreateIndex
CREATE INDEX "VendaItem_produtoId_idx" ON "VendaItem"("produtoId");

-- CreateIndex
CREATE INDEX "Laboratorio_empresaId_idx" ON "Laboratorio"("empresaId");

-- CreateIndex
CREATE INDEX "OrdemServico_empresaId_status_idx" ON "OrdemServico"("empresaId", "status");

-- CreateIndex
CREATE INDEX "OrdemServico_filialId_idx" ON "OrdemServico"("filialId");

-- CreateIndex
CREATE INDEX "OrdemServico_clienteId_idx" ON "OrdemServico"("clienteId");

-- CreateIndex
CREATE INDEX "OrdemServico_atendimentoId_idx" ON "OrdemServico"("atendimentoId");

-- CreateIndex
CREATE INDEX "OrdemServico_laboratorioId_idx" ON "OrdemServico"("laboratorioId");

-- CreateIndex
CREATE INDEX "OrdemServicoItem_ordemServicoId_idx" ON "OrdemServicoItem"("ordemServicoId");

-- CreateIndex
CREATE INDEX "OrdemServicoItem_produtoId_idx" ON "OrdemServicoItem"("produtoId");

-- CreateIndex
CREATE INDEX "Convenio_empresaId_idx" ON "Convenio"("empresaId");

-- CreateIndex
CREATE INDEX "FinanceiroLancamento_empresaId_tipo_createdAt_idx" ON "FinanceiroLancamento"("empresaId", "tipo", "createdAt");

-- CreateIndex
CREATE INDEX "FinanceiroLancamento_filialId_idx" ON "FinanceiroLancamento"("filialId");

-- CreateIndex
CREATE INDEX "FinanceiroLancamento_atendimentoId_idx" ON "FinanceiroLancamento"("atendimentoId");

-- CreateIndex
CREATE INDEX "FinanceiroLancamento_vendaId_idx" ON "FinanceiroLancamento"("vendaId");

-- CreateIndex
CREATE INDEX "FinanceiroLancamento_compraId_idx" ON "FinanceiroLancamento"("compraId");

-- CreateIndex
CREATE INDEX "FinanceiroLancamento_ordemServicoId_idx" ON "FinanceiroLancamento"("ordemServicoId");

-- CreateIndex
CREATE INDEX "FinanceiroLancamento_criadoPorId_idx" ON "FinanceiroLancamento"("criadoPorId");

-- CreateIndex
CREATE INDEX "Arquivo_empresaId_createdAt_idx" ON "Arquivo"("empresaId", "createdAt");

-- CreateIndex
CREATE INDEX "Arquivo_filialId_idx" ON "Arquivo"("filialId");

-- CreateIndex
CREATE INDEX "Arquivo_pessoaId_idx" ON "Arquivo"("pessoaId");

-- CreateIndex
CREATE INDEX "Arquivo_atendimentoId_idx" ON "Arquivo"("atendimentoId");

-- CreateIndex
CREATE INDEX "Arquivo_prontuarioId_idx" ON "Arquivo"("prontuarioId");

-- CreateIndex
CREATE INDEX "Arquivo_enviadoPorId_idx" ON "Arquivo"("enviadoPorId");

-- CreateIndex
CREATE INDEX "Notificacao_empresaId_createdAt_idx" ON "Notificacao"("empresaId", "createdAt");

-- CreateIndex
CREATE INDEX "Notificacao_usuarioDestinoId_lidaEm_idx" ON "Notificacao"("usuarioDestinoId", "lidaEm");

-- CreateIndex
CREATE INDEX "Notificacao_filialId_idx" ON "Notificacao"("filialId");

-- CreateIndex
CREATE INDEX "Notificacao_pessoaId_idx" ON "Notificacao"("pessoaId");

-- CreateIndex
CREATE INDEX "Auditoria_empresaId_createdAt_idx" ON "Auditoria"("empresaId", "createdAt");

-- CreateIndex
CREATE INDEX "Auditoria_filialId_idx" ON "Auditoria"("filialId");

-- CreateIndex
CREATE INDEX "Auditoria_usuarioId_idx" ON "Auditoria"("usuarioId");

-- CreateIndex
CREATE INDEX "Auditoria_atendimentoId_idx" ON "Auditoria"("atendimentoId");

-- CreateIndex
CREATE INDEX "Auditoria_entidade_entidadeId_idx" ON "Auditoria"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "Acesso_empresaId_idx" ON "Acesso"("empresaId");

-- CreateIndex
CREATE INDEX "Cliente_convenioId_idx" ON "Cliente"("convenioId");

-- CreateIndex
CREATE INDEX "Permissao_empresaId_idx" ON "Permissao"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Permissao_empresaId_modulo_acao_key" ON "Permissao"("empresaId", "modulo", "acao");

-- CreateIndex
CREATE INDEX "Usuario_empresaId_idx" ON "Usuario"("empresaId");

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_convenioId_fkey" FOREIGN KEY ("convenioId") REFERENCES "Convenio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acesso" ADD CONSTRAINT "Acesso_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permissao" ADD CONSTRAINT "Permissao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agenda" ADD CONSTRAINT "Agenda_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agenda" ADD CONSTRAINT "Agenda_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agenda" ADD CONSTRAINT "Agenda_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agenda" ADD CONSTRAINT "Agenda_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "Agenda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Pessoa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_convenioId_fkey" FOREIGN KEY ("convenioId") REFERENCES "Convenio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prontuario" ADD CONSTRAINT "Prontuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prontuario" ADD CONSTRAINT "Prontuario_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prontuario" ADD CONSTRAINT "Prontuario_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "Atendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prontuario" ADD CONSTRAINT "Prontuario_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Pessoa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prontuario" ADD CONSTRAINT "Prontuario_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioAnamnese" ADD CONSTRAINT "ProntuarioAnamnese_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "Prontuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioAcuidadeVisual" ADD CONSTRAINT "ProntuarioAcuidadeVisual_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "Prontuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioRefracao" ADD CONSTRAINT "ProntuarioRefracao_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "Prontuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioCeratometria" ADD CONSTRAINT "ProntuarioCeratometria_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "Prontuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioBiomicroscopia" ADD CONSTRAINT "ProntuarioBiomicroscopia_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "Prontuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioFundoscopia" ADD CONSTRAINT "ProntuarioFundoscopia_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "Prontuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioPressaoIntraocular" ADD CONSTRAINT "ProntuarioPressaoIntraocular_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "Prontuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioDiagnostico" ADD CONSTRAINT "ProntuarioDiagnostico_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "Prontuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioExameComplementar" ADD CONSTRAINT "ProntuarioExameComplementar_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "Prontuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioEvolucaoClinica" ADD CONSTRAINT "ProntuarioEvolucaoClinica_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "Prontuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receita" ADD CONSTRAINT "Receita_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receita" ADD CONSTRAINT "Receita_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receita" ADD CONSTRAINT "Receita_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "Atendimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receita" ADD CONSTRAINT "Receita_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "Prontuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receita" ADD CONSTRAINT "Receita_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Pessoa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receita" ADD CONSTRAINT "Receita_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceitaOculos" ADD CONSTRAINT "ReceitaOculos_receitaId_fkey" FOREIGN KEY ("receitaId") REFERENCES "Receita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceitaLenteContato" ADD CONSTRAINT "ReceitaLenteContato_receitaId_fkey" FOREIGN KEY ("receitaId") REFERENCES "Receita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceitaMedicamento" ADD CONSTRAINT "ReceitaMedicamento_receitaId_fkey" FOREIGN KEY ("receitaId") REFERENCES "Receita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estoque" ADD CONSTRAINT "Estoque_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estoque" ADD CONSTRAINT "Estoque_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueItem" ADD CONSTRAINT "EstoqueItem_estoqueId_fkey" FOREIGN KEY ("estoqueId") REFERENCES "Estoque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueItem" ADD CONSTRAINT "EstoqueItem_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoEstoque" ADD CONSTRAINT "MovimentoEstoque_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoEstoque" ADD CONSTRAINT "MovimentoEstoque_estoqueId_fkey" FOREIGN KEY ("estoqueId") REFERENCES "Estoque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoEstoque" ADD CONSTRAINT "MovimentoEstoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraItem" ADD CONSTRAINT "CompraItem_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraItem" ADD CONSTRAINT "CompraItem_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venda" ADD CONSTRAINT "Venda_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venda" ADD CONSTRAINT "Venda_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venda" ADD CONSTRAINT "Venda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venda" ADD CONSTRAINT "Venda_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "Atendimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendaItem" ADD CONSTRAINT "VendaItem_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "Venda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendaItem" ADD CONSTRAINT "VendaItem_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laboratorio" ADD CONSTRAINT "Laboratorio_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "Atendimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_laboratorioId_fkey" FOREIGN KEY ("laboratorioId") REFERENCES "Laboratorio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServicoItem" ADD CONSTRAINT "OrdemServicoItem_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServicoItem" ADD CONSTRAINT "OrdemServicoItem_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convenio" ADD CONSTRAINT "Convenio_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceiroLancamento" ADD CONSTRAINT "FinanceiroLancamento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceiroLancamento" ADD CONSTRAINT "FinanceiroLancamento_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceiroLancamento" ADD CONSTRAINT "FinanceiroLancamento_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "Atendimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceiroLancamento" ADD CONSTRAINT "FinanceiroLancamento_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "Venda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceiroLancamento" ADD CONSTRAINT "FinanceiroLancamento_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceiroLancamento" ADD CONSTRAINT "FinanceiroLancamento_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceiroLancamento" ADD CONSTRAINT "FinanceiroLancamento_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arquivo" ADD CONSTRAINT "Arquivo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arquivo" ADD CONSTRAINT "Arquivo_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arquivo" ADD CONSTRAINT "Arquivo_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arquivo" ADD CONSTRAINT "Arquivo_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "Atendimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arquivo" ADD CONSTRAINT "Arquivo_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "Prontuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arquivo" ADD CONSTRAINT "Arquivo_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_usuarioDestinoId_fkey" FOREIGN KEY ("usuarioDestinoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_usuarioRemetenteId_fkey" FOREIGN KEY ("usuarioRemetenteId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "Atendimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

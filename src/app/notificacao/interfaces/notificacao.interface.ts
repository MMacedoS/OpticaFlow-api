import { CanalNotificacao } from '@prisma/client';

export interface NotificacaoResumo {
  id: string;
  empresaId: string;
  filialId: string | null;
  pessoaId: string | null;
  usuarioDestinoId: string | null;
  usuarioRemetenteId: string | null;
  canal: CanalNotificacao;
  titulo: string;
  mensagem: string;
  lidaEm: Date | null;
  createdAt: Date;
}

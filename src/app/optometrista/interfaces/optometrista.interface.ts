import { Usuario } from 'src/app/usuario/interface/usuario.interface';

export interface OptometristaResumo {
  id: string;
  pessoaId: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  filialId: string;
  usuario: {
    id: string;
    email: string;
    username: string | null;
    empresaId: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Optometrista {
  id: string;
  pessoaId: string;
  registro_profissional: string | null;
  createdAt: Date;
  updatedAt: Date;
  pessoa: {
    id: string;
    nome: string;
    cpf: string | null;
    email: string | null;
    usuario: Usuario | null;
  };
}

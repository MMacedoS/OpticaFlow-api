export interface EscopoUsuario {
  superadmin: boolean;
  /** Id do usuario autenticado (auditoria de quem criou/alterou). */
  usuarioId?: string;
  empresaId?: string;
  filialId?: string;
}

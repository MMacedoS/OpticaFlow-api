export interface EscopoUsuario {
  superadmin: boolean;
  /** Id do usuario autenticado (auditoria de quem criou/alterou). */
  usuarioId?: string;
  empresaId?: string;
  filialId?: string;
  /**
   * Id do usuario quando ele e optometrista/oftalmologista: consultas,
   * agendas, prontuarios e receitas ficam restritos aos dele.
   */
  profissionalId?: string;
}

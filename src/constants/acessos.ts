export class ControleAcesso {
  static #restricoes = {
    funcionario: [
      'empresa',
      'usuario',
      'filial',
      'funcionario',
      'prontuario',
      'receita',
      'financeiro-lancamento',
      'acesso',
    ],
    gerente: ['empresa', 'usuario', 'filial'],
    administrador: [],
  };

  static getRestricoes(cargo) {
    const cargoFormatado = cargo?.toLowerCase();

    // Cargo desconhecido recebe as restricoes de funcionario (antes: acesso total).
    return this.#restricoes[cargoFormatado] ?? this.#restricoes.funcionario;
  }
}

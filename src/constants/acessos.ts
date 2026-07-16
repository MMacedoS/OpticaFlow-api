export class ControleAcesso {
  static #restricoes = {
    funcionario: [
      'empresa',
      'usuario',
      'filial',
      'funcionario',
      'prontuario',
      'receita',
      'financeiro-lacamento',
      'acesso',
    ],
    gerente: ['empresa', 'usuario', 'filial'],
    optometrista: ['prontuario', 'receita', 'atendimento', 'agenda'],
    oftalmologista: ['prontuario', 'receita', 'atendimento', 'agenda'],
    administrador: [],
  };

  static getRestricoes(cargo) {
    const cargoFormatado = cargo?.toLowerCase();

    return this.#restricoes[cargoFormatado] || [];
  }
}

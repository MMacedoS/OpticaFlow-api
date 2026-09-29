// Os testes rodam no mesmo fuso da API em producao.
export default function definirFusoHorario() {
  process.env.TZ = 'America/Sao_Paulo';
}

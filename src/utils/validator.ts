export function getSenhaBase(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

export function prepareNumeroOrdemServico(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Últimos dois dígitos do ano
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Mês com dois dígitos
  const day = now.getDate().toString().padStart(2, '0'); // Dia com dois dígitos
  const randomNumber = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0'); // Número aleatório de 4 dígitos

  return `${year}${month}${day}-${randomNumber}`;
}

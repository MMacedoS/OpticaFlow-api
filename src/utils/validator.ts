export function getSenhaBase(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

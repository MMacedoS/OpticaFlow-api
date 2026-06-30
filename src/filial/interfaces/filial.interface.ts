export interface FilialResponse {
  id: string;
  nome: string;
  cnpj?: string | null;
  empresaId: string;
  enderecos: EnderecoFilialResponse[];
  contatos: ContatoFilialResponse[];
  config?: ConfigFilialResponse | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnderecoFilialResponse {
  id: string;
  cep: string;
  numero?: string | null;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  pais: string;
  principal?: boolean | null;
}

export interface ContatoFilialResponse {
  id: string;
  tipo: string;
  Contato: string;
  principal: boolean;
}

export interface ConfigFilialResponse {
  id: string;
  timezone?: string | null;
  moeda?: string | null;
}

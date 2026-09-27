export type FormatoValor = 'numero' | 'moeda' | 'percentual' | 'dias';

export interface Periodo {
  inicio: Date;
  /** Exclusivo (dia seguinte ao ultimo dia do periodo). */
  fim: Date;
}

export interface IndicadorRelatorio {
  label: string;
  valor: number;
  formato: FormatoValor;
}

export interface GrupoRelatorio {
  titulo: string;
  formato: FormatoValor;
  /** Serie por dia (grafico de linha do tempo) em vez de ranking. */
  serie?: boolean;
  itens: { label: string; valor: number; quantidade?: number }[];
}

export interface ColunaRelatorio {
  chave: string;
  label: string;
  formato: 'texto' | 'data' | 'dataHora' | 'moeda' | 'numero';
}

export interface Relatorio {
  titulo: string;
  periodo: { inicio: string; fim: string };
  indicadores: IndicadorRelatorio[];
  grupos: GrupoRelatorio[];
  linhas: {
    colunas: ColunaRelatorio[];
    itens: Record<string, string | number | Date | null>[];
    total: number;
    truncado: boolean;
  };
}

export interface FiltroRelatorio {
  dataInicio?: string;
  dataFim?: string;
  filialId?: string;
}

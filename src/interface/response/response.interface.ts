export interface ResponseJson {
  status: number;
  message: string;
  data?: any;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

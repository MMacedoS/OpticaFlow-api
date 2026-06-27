import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'API REST de Gestão de Usuários e Pessoas - OpticaFlow';
  }
}

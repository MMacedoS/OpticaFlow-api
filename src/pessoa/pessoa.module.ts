import { Module } from '@nestjs/common';
import { PessoaService } from './pessoa.service';

@Module({
  providers: [PessoaService]
})
export class PessoaModule {}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AcessoGuard } from 'src/guards/acesso/acesso.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { CreateFornecedorDto, UpdateFornecedorDto } from './dto/fornecedor.dto';
import { FornecedorService } from './fornecedor.service';

@Controller('fornecedor')
@UseGuards(AuthGuard, AcessoGuard)
export class FornecedorController {
  constructor(private readonly fornecedorService: FornecedorService) {}

  @Post()
  async createFornecedor(@Body() dto: CreateFornecedorDto) {
    return this.fornecedorService.create(dto);
  }

  @Get('filial/:filialId')
  async getAllByFilial(
    @Param('filialId') filialId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const fornecedores = await this.fornecedorService.findAllByFilial(
      filialId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search ?? '',
    );

    if (!fornecedores || fornecedores.length === 0) {
      return { error: 'Nenhum fornecedor encontrado' };
    }

    return fornecedores;
  }

  @Get(':id')
  async getFornecedorById(@Param('id') id: string) {
    return this.fornecedorService.findById(id);
  }

  @Put(':id')
  async updateFornecedor(
    @Param('id') id: string,
    @Body() dto: UpdateFornecedorDto,
  ) {
    return this.fornecedorService.update(id, dto);
  }

  @Delete(':id')
  async deleteFornecedor(@Param('id') id: string) {
    return this.fornecedorService.deleteById(id);
  }
}

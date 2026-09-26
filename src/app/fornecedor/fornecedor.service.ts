import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Fornecedor, Prisma } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFornecedorDto, UpdateFornecedorDto } from './dto/fornecedor.dto';
import {
  FiltroFornecedor,
  FornecedorResumo,
} from './interfaces/fornecedor.interface';

@Injectable()
export class FornecedorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateFornecedorDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const empresaId = await this.resolverEmpresa(dto.empresaId, escopo);

    if (dto.cnpj) {
      await this.garantirCnpjDisponivel(empresaId, dto.cnpj);
    }

    const fornecedor = await this.prisma.fornecedor.create({
      data: {
        empresaId,
        razao_social: dto.razao_social,
        nome_fantasia: dto.nome_fantasia,
        cnpj: dto.cnpj,
        email: dto.email,
        telefone: dto.telefone,
        observacoes: dto.observacoes,
        ativo: dto.ativo ?? true,
      },
    });

    return {
      status: 201,
      message: 'Fornecedor criado com sucesso.',
      data: this.mapResumo(fornecedor),
    };
  }

  async findAll(
    escopo: EscopoUsuario,
    filtro: FiltroFornecedor,
  ): Promise<ResponseJson> {
    const page = Math.max(1, filtro.page);
    const limit = Math.max(1, filtro.limit);
    const search = filtro.search.trim();
    const searchDigits = search.replace(/\D/g, '');

    const where: Prisma.FornecedorWhereInput = {
      ...(escopo.empresaId && { empresaId: escopo.empresaId }),
      ...(typeof filtro.ativo === 'boolean' && { ativo: filtro.ativo }),
      ...(search && {
        OR: [
          { razao_social: { contains: search, mode: 'insensitive' } },
          { nome_fantasia: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          ...(searchDigits ? [{ cnpj: { contains: searchDigits } }] : []),
        ],
      }),
    };

    const [fornecedores, total] = await this.prisma.$transaction([
      this.prisma.fornecedor.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy: { razao_social: 'asc' },
      }),
      this.prisma.fornecedor.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Fornecedores listados com sucesso.',
      data: {
        fornecedores: fornecedores.map((fornecedor) =>
          this.mapResumo(fornecedor),
        ),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const fornecedor = await this.buscarNoEscopo(id, escopo);

    return {
      status: 200,
      message: 'Fornecedor encontrado.',
      data: this.mapResumo(fornecedor),
    };
  }

  async update(
    id: string,
    dto: UpdateFornecedorDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const fornecedor = await this.buscarNoEscopo(id, escopo);

    if (dto.cnpj && dto.cnpj !== fornecedor.cnpj) {
      await this.garantirCnpjDisponivel(fornecedor.empresaId, dto.cnpj, id);
    }

    const fornecedorAtualizado = await this.prisma.fornecedor.update({
      where: { id },
      data: {
        razao_social: dto.razao_social,
        nome_fantasia: dto.nome_fantasia,
        cnpj: dto.cnpj,
        email: dto.email,
        telefone: dto.telefone,
        observacoes: dto.observacoes,
        ativo: dto.ativo,
      },
    });

    return {
      status: 200,
      message: 'Fornecedor atualizado com sucesso.',
      data: this.mapResumo(fornecedorAtualizado),
    };
  }

  async deleteById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    await this.buscarNoEscopo(id, escopo);

    const comprasVinculadas = await this.prisma.compra.count({
      where: { fornecedorId: id },
    });

    if (comprasVinculadas > 0) {
      throw new ConflictException(
        'Não é possível excluir fornecedor com compras vinculadas. Inative-o.',
      );
    }

    await this.prisma.fornecedor.delete({ where: { id } });

    return {
      status: 200,
      message: 'Fornecedor deletado com sucesso.',
    };
  }

  private async buscarNoEscopo(
    id: string,
    escopo: EscopoUsuario,
  ): Promise<Fornecedor> {
    const fornecedor = await this.prisma.fornecedor.findFirst({
      where: { id, ...(escopo.empresaId && { empresaId: escopo.empresaId }) },
    });

    if (!fornecedor) {
      throw new NotFoundException('Fornecedor não encontrado.');
    }

    return fornecedor;
  }

  private async resolverEmpresa(
    empresaIdInformada: string | undefined,
    escopo: EscopoUsuario,
  ): Promise<string> {
    if (escopo.empresaId) {
      return escopo.empresaId;
    }

    if (!empresaIdInformada) {
      throw new BadRequestException('Informe a empresa do fornecedor.');
    }

    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaIdInformada },
      select: { id: true },
    });

    if (!empresa) {
      throw new UnprocessableEntityException('Empresa não encontrada.');
    }

    return empresa.id;
  }

  private async garantirCnpjDisponivel(
    empresaId: string,
    cnpj: string,
    ignorarId?: string,
  ): Promise<void> {
    const existente = await this.prisma.fornecedor.findFirst({
      where: {
        empresaId,
        cnpj,
        ...(ignorarId && { NOT: { id: ignorarId } }),
      },
      select: { id: true },
    });

    if (existente) {
      throw new ConflictException(
        'Já existe um fornecedor com este CNPJ nesta empresa.',
      );
    }
  }

  private mapResumo(fornecedor: Fornecedor): FornecedorResumo {
    return {
      id: fornecedor.id,
      empresaId: fornecedor.empresaId,
      razao_social: fornecedor.razao_social,
      nome_fantasia: fornecedor.nome_fantasia,
      cnpj: fornecedor.cnpj,
      email: fornecedor.email,
      telefone: fornecedor.telefone,
      observacoes: fornecedor.observacoes,
      ativo: fornecedor.ativo,
      createdAt: fornecedor.createdAt,
      updatedAt: fornecedor.updatedAt,
    };
  }
}

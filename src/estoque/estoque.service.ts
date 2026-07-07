import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEstoqueDto, UpdateEstoqueDto } from './dto/estoque.dto';
import { EstoqueResumo } from './interfaces/estoque.interface';

@Injectable()
export class EstoqueService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEstoqueDto): Promise<ResponseJson> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: dto.empresaId },
      select: { id: true },
    });

    if (!empresa) {
      return { status: 422, message: 'Empresa não encontrada.' };
    }

    const filial = await this.prisma.filial.findUnique({
      where: { id: dto.filialId },
      select: { id: true, empresaId: true },
    });

    if (!filial || filial.empresaId !== dto.empresaId) {
      return {
        status: 422,
        message: 'Filial não encontrada para a empresa informada.',
      };
    }

    const estoqueExistente = await this.prisma.estoque.findUnique({
      where: {
        empresaId_filialId: {
          empresaId: dto.empresaId,
          filialId: dto.filialId,
        },
      },
      select: { id: true },
    });

    if (estoqueExistente) {
      return {
        status: 400,
        message: 'Já existe um estoque para esta filial nesta empresa.',
      };
    }

    try {
      const estoque = await this.prisma.estoque.create({
        data: {
          empresaId: dto.empresaId,
          filialId: dto.filialId,
          nome: dto.nome,
        },
      });

      return {
        status: 201,
        message: 'Estoque criado com sucesso.',
        data: estoque,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          status: 422,
          message: 'Estoque já existe com estes dados.',
        };
      }

      throw error;
    }
  }

  async findAllByEmpresa(
    empresaId: string,
    page: number = 1,
    limit: number = 10,
    filialId?: string,
    search: string = '',
  ): Promise<ResponseJson> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true },
    });

    if (!empresa) {
      return { status: 422, message: 'Empresa não encontrada.' };
    }

    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.EstoqueWhereInput = {
      empresaId,
      ...(filialId && { filialId }),
      ...(search
        ? {
            OR: [
              { nome: { contains: search, mode: 'insensitive' } },
              { filial: { nome: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [estoques, total] = await this.prisma.$transaction([
      this.prisma.estoque.findMany({
        skip,
        take: limitNumber,
        where,
        include: {
          filial: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.estoque.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Estoques listados com sucesso.',
      data: {
        stocks: estoques,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
    };
  }

  async findById(id: string): Promise<ResponseJson> {
    const estoque = await this.prisma.estoque.findUnique({
      where: { id },
      include: {
        filial: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!estoque) {
      return { status: 422, message: 'Estoque não encontrado.' };
    }

    return {
      status: 200,
      message: 'Estoque encontrado.',
      data: estoque,
    };
  }

  async update(id: string, dto: UpdateEstoqueDto): Promise<ResponseJson> {
    const estoque = await this.prisma.estoque.findUnique({
      where: { id },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
      },
    });

    if (!estoque) {
      return { status: 422, message: 'Estoque não encontrado.' };
    }

    if (dto.filialId && dto.filialId !== estoque.filialId) {
      const filial = await this.prisma.filial.findUnique({
        where: { id: dto.filialId },
        select: { id: true, empresaId: true },
      });

      if (!filial || filial.empresaId !== estoque.empresaId) {
        return {
          status: 422,
          message: 'Filial não encontrada para a empresa deste estoque.',
        };
      }

      const estoqueNaFilial = await this.prisma.estoque.findUnique({
        where: {
          empresaId_filialId: {
            empresaId: estoque.empresaId,
            filialId: dto.filialId,
          },
        },
        select: { id: true },
      });

      if (estoqueNaFilial && estoqueNaFilial.id !== estoque.id) {
        return {
          status: 400,
          message: 'Já existe um estoque para esta filial nesta empresa.',
        };
      }
    }

    const estoqueAtualizado = await this.prisma.estoque.update({
      where: { id },
      data: {
        filialId: dto.filialId,
        nome: dto.nome,
      },
    });

    return {
      status: 200,
      message: 'Estoque atualizado com sucesso.',
      data: estoqueAtualizado,
    };
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const estoque = await this.prisma.estoque.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!estoque) {
      return { status: 422, message: 'Estoque não encontrado.' };
    }

    await this.prisma.estoque.delete({
      where: { id },
    });

    return {
      status: 200,
      message: 'Estoque deletado com sucesso.',
    };
  }
}

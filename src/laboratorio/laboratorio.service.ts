import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateLaboratorioDto,
  UpdateLaboratorioDto,
} from './dto/laboratorio.dto';
import { LaboratorioResumo } from './interfaces/laboratorio.interface';

@Injectable()
export class LaboratorioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLaboratorioDto): Promise<ResponseJson> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: dto.empresaId },
      select: { id: true },
    });

    if (!empresa) {
      return { status: 422, message: 'Empresa não encontrada.' };
    }

    const laboratorioExistente = await this.prisma.laboratorio.findFirst({
      where: {
        empresaId: dto.empresaId,
        nome: { equals: dto.nome, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (laboratorioExistente) {
      return {
        status: 400,
        message: 'Já existe um laboratório com este nome para esta empresa.',
      };
    }

    try {
      const laboratorio = await this.prisma.laboratorio.create({
        data: {
          empresaId: dto.empresaId,
          nome: dto.nome,
          cnpj: dto.cnpj,
          email: dto.email,
          telefone: dto.telefone,
          ativo: dto.ativo ?? true,
        },
      });

      return {
        status: 201,
        message: 'Laboratório criado com sucesso.',
        data: laboratorio,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          status: 422,
          message: 'Laboratório já existe com estes dados.',
        };
      }

      throw error;
    }
  }

  async findAllByEmpresa(
    empresaId: string,
    page: number = 1,
    limit: number = 10,
    search: string = '',
    ativo?: boolean,
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

    const where: Prisma.LaboratorioWhereInput = {
      empresaId,
      ...(typeof ativo === 'boolean' && { ativo }),
      ...(search
        ? {
            OR: [
              { nome: { contains: search, mode: 'insensitive' } },
              { cnpj: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { telefone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [laboratorios, total] = await this.prisma.$transaction([
      this.prisma.laboratorio.findMany({
        skip,
        take: limitNumber,
        where,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.laboratorio.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Laboratórios listados com sucesso.',
      data: laboratorios.map((laboratorio) => this.mapResumo(laboratorio)),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findById(id: string): Promise<ResponseJson> {
    const laboratorio = await this.prisma.laboratorio.findUnique({
      where: { id },
    });

    if (!laboratorio) {
      return { status: 422, message: 'Laboratório não encontrado.' };
    }

    return {
      status: 200,
      message: 'Laboratório encontrado.',
      data: laboratorio,
    };
  }

  async update(id: string, dto: UpdateLaboratorioDto): Promise<ResponseJson> {
    const laboratorio = await this.prisma.laboratorio.findUnique({
      where: { id },
      select: {
        id: true,
        empresaId: true,
        nome: true,
      },
    });

    if (!laboratorio) {
      return { status: 422, message: 'Laboratório não encontrado.' };
    }

    if (dto.nome && dto.nome.toLowerCase() !== laboratorio.nome.toLowerCase()) {
      const laboratorioComNome = await this.prisma.laboratorio.findFirst({
        where: {
          empresaId: laboratorio.empresaId,
          nome: { equals: dto.nome, mode: 'insensitive' },
        },
        select: { id: true },
      });

      if (laboratorioComNome && laboratorioComNome.id !== laboratorio.id) {
        return {
          status: 400,
          message: 'Já existe um laboratório com este nome para esta empresa.',
        };
      }
    }

    const laboratorioAtualizado = await this.prisma.laboratorio.update({
      where: { id },
      data: {
        nome: dto.nome,
        cnpj: dto.cnpj,
        email: dto.email,
        telefone: dto.telefone,
        ativo: dto.ativo,
      },
    });

    return {
      status: 200,
      message: 'Laboratório atualizado com sucesso.',
      data: laboratorioAtualizado,
    };
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const laboratorio = await this.prisma.laboratorio.findUnique({
      where: { id },
      select: {
        id: true,
        ordens_servico: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!laboratorio) {
      return { status: 422, message: 'Laboratório não encontrado.' };
    }

    if (laboratorio.ordens_servico.length > 0) {
      return {
        status: 400,
        message:
          'Não é possível excluir laboratório com ordens de serviço vinculadas.',
      };
    }

    await this.prisma.laboratorio.delete({
      where: { id },
    });

    return {
      status: 200,
      message: 'Laboratório deletado com sucesso.',
    };
  }

  private mapResumo(laboratorio: LaboratorioResumo): LaboratorioResumo {
    return {
      id: laboratorio.id,
      empresaId: laboratorio.empresaId,
      nome: laboratorio.nome,
      cnpj: laboratorio.cnpj,
      email: laboratorio.email,
      telefone: laboratorio.telefone,
      ativo: laboratorio.ativo,
      createdAt: laboratorio.createdAt,
      updatedAt: laboratorio.updatedAt,
    };
  }
}

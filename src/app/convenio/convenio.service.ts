import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateConvenioDto, UpdateConvenioDto } from './dto/convenio.dto';
import { ConvenioResumo } from './interfaces/convenio.interface';

@Injectable()
export class ConvenioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateConvenioDto): Promise<ResponseJson> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: dto.empresaId },
      select: { id: true },
    });

    if (!empresa) {
      return { status: 422, message: 'Empresa não encontrada.' };
    }

    const convenioExistente = await this.prisma.convenio.findFirst({
      where: {
        empresaId: dto.empresaId,
        nome: { equals: dto.nome, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (convenioExistente) {
      return {
        status: 400,
        message: 'Já existe um convênio com este nome para esta empresa.',
      };
    }

    try {
      const convenio = await this.prisma.convenio.create({
        data: {
          empresaId: dto.empresaId || '',
          nome: dto.nome,
          registro: dto.registro,
        },
      });

      return {
        status: 201,
        message: 'Convênio criado com sucesso.',
        data: convenio,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          status: 422,
          message: 'Convênio já existe com estes dados.',
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

    const where: Prisma.ConvenioWhereInput = {
      empresaId,
      ...(search
        ? {
            OR: [
              { nome: { contains: search, mode: 'insensitive' } },
              { registro: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [convenios, total] = await this.prisma.$transaction([
      this.prisma.convenio.findMany({
        skip,
        take: limitNumber,
        where,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.convenio.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Convênios listados com sucesso.',
      data: {
        agreements: convenios,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
    };
  }

  async findAll() {
    const convenios = await this.prisma.convenio.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      status: 200,
      message: 'Convênios listados com sucesso.',
      data: {
        agreements: convenios,
      },
    };
  }

  async findById(id: string): Promise<ResponseJson> {
    const convenio = await this.prisma.convenio.findUnique({
      where: { id },
    });

    if (!convenio) {
      return { status: 422, message: 'Convênio não encontrado.' };
    }

    return {
      status: 200,
      message: 'Convênio encontrado.',
      data: convenio,
    };
  }

  async update(id: string, dto: UpdateConvenioDto): Promise<ResponseJson> {
    const convenio = await this.prisma.convenio.findUnique({
      where: { id },
      select: {
        id: true,
        empresaId: true,
        nome: true,
      },
    });

    if (!convenio) {
      return { status: 422, message: 'Convênio não encontrado.' };
    }

    if (dto.nome && dto.nome.toLowerCase() !== convenio.nome.toLowerCase()) {
      const convenioComNome = await this.prisma.convenio.findFirst({
        where: {
          empresaId: convenio.empresaId,
          nome: { equals: dto.nome, mode: 'insensitive' },
        },
        select: { id: true },
      });

      if (convenioComNome && convenioComNome.id !== convenio.id) {
        return {
          status: 400,
          message: 'Já existe um convênio com este nome para esta empresa.',
        };
      }
    }

    const convenioAtualizado = await this.prisma.convenio.update({
      where: { id },
      data: {
        nome: dto.nome,
        registro: dto.registro,
      },
    });

    return {
      status: 200,
      message: 'Convênio atualizado com sucesso.',
      data: convenioAtualizado,
    };
  }

  async updateStatus(id: string, status: string): Promise<ResponseJson> {
    const convenio = await this.prisma.convenio.findUnique({ where: { id } });

    if (!convenio) {
      return { status: 422, message: 'Convênio não encontrado.' };
    }

    const updatedConvenio = await this.prisma.convenio.update({
      where: { id },
      data: { ativo: status as Prisma.EnumStatusFieldUpdateOperationsInput },
    });

    return {
      status: 200,
      message: 'Status do convênio atualizado com sucesso.',
      data: updatedConvenio,
    };
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const convenio = await this.prisma.convenio.findUnique({
      where: { id },
      select: {
        id: true,
        clientes: {
          select: { id: true },
          take: 1,
        },
        atendimentos: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!convenio) {
      return { status: 422, message: 'Convênio não encontrado.' };
    }

    if (convenio.clientes.length > 0 || convenio.atendimentos.length > 0) {
      return {
        status: 400,
        message:
          'Não é possível excluir convênio com clientes ou atendimentos vinculados.',
      };
    }

    await this.prisma.convenio.delete({
      where: { id },
    });

    return {
      status: 200,
      message: 'Convênio deletado com sucesso.',
    };
  }

  private mapResumo(convenio: ConvenioResumo): ConvenioResumo {
    return {
      id: convenio.id,
      empresaId: convenio.empresaId,
      nome: convenio.nome,
      registro: convenio.registro,
      ativo: convenio.ativo,
      createdAt: convenio.createdAt,
      updatedAt: convenio.updatedAt,
    };
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Laboratorio, Prisma } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateLaboratorioDto,
  UpdateLaboratorioDto,
} from './dto/laboratorio.dto';
import {
  FiltroLaboratorio,
  LaboratorioResumo,
} from './interfaces/laboratorio.interface';

@Injectable()
export class LaboratorioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateLaboratorioDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const empresaId = await this.resolverEmpresa(dto.empresaId, escopo);

    await this.garantirNomeDisponivel(empresaId, dto.nome);

    const laboratorio = await this.prisma.laboratorio.create({
      data: {
        empresaId,
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
      data: this.mapResumo(laboratorio),
    };
  }

  async findAll(
    escopo: EscopoUsuario,
    filtro: FiltroLaboratorio,
  ): Promise<ResponseJson> {
    const page = Math.max(1, filtro.page);
    const limit = Math.max(1, filtro.limit);
    const search = filtro.search.trim();

    const where: Prisma.LaboratorioWhereInput = {
      ...(escopo.empresaId && { empresaId: escopo.empresaId }),
      ...(typeof filtro.ativo === 'boolean' && { ativo: filtro.ativo }),
      ...(search && {
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { cnpj: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { telefone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [laboratorios, total] = await this.prisma.$transaction([
      this.prisma.laboratorio.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy: { nome: 'asc' },
      }),
      this.prisma.laboratorio.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Laboratórios listados com sucesso.',
      data: {
        laboratorios: laboratorios.map((laboratorio) =>
          this.mapResumo(laboratorio),
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
    const laboratorio = await this.buscarNoEscopo(id, escopo);

    return {
      status: 200,
      message: 'Laboratório encontrado.',
      data: this.mapResumo(laboratorio),
    };
  }

  async update(
    id: string,
    dto: UpdateLaboratorioDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const laboratorio = await this.buscarNoEscopo(id, escopo);

    if (dto.nome && dto.nome.toLowerCase() !== laboratorio.nome.toLowerCase()) {
      await this.garantirNomeDisponivel(laboratorio.empresaId, dto.nome, id);
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
      data: this.mapResumo(laboratorioAtualizado),
    };
  }

  async deleteById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    await this.buscarNoEscopo(id, escopo);

    const ordensVinculadas = await this.prisma.ordemServico.count({
      where: { laboratorioId: id },
    });

    if (ordensVinculadas > 0) {
      throw new ConflictException(
        'Não é possível excluir laboratório com ordens de serviço vinculadas. Inative-o.',
      );
    }

    await this.prisma.laboratorio.delete({ where: { id } });

    return {
      status: 200,
      message: 'Laboratório deletado com sucesso.',
    };
  }

  private async buscarNoEscopo(
    id: string,
    escopo: EscopoUsuario,
  ): Promise<Laboratorio> {
    const laboratorio = await this.prisma.laboratorio.findFirst({
      where: { id, ...(escopo.empresaId && { empresaId: escopo.empresaId }) },
    });

    if (!laboratorio) {
      throw new NotFoundException('Laboratório não encontrado.');
    }

    return laboratorio;
  }

  private async resolverEmpresa(
    empresaIdInformada: string | undefined,
    escopo: EscopoUsuario,
  ): Promise<string> {
    if (escopo.empresaId) {
      return escopo.empresaId;
    }

    if (!empresaIdInformada) {
      throw new BadRequestException('Informe a empresa do laboratório.');
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

  private async garantirNomeDisponivel(
    empresaId: string,
    nome: string,
    ignorarId?: string,
  ): Promise<void> {
    const existente = await this.prisma.laboratorio.findFirst({
      where: {
        empresaId,
        nome: { equals: nome, mode: 'insensitive' },
        ...(ignorarId && { NOT: { id: ignorarId } }),
      },
      select: { id: true },
    });

    if (existente) {
      throw new ConflictException(
        'Já existe um laboratório com este nome nesta empresa.',
      );
    }
  }

  private mapResumo(laboratorio: Laboratorio): LaboratorioResumo {
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

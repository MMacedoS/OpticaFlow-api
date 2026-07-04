import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseJson } from 'src/interface/response/response.interface';
import { CreateEmpresaDto } from './dto/createEmpresa.dto';
import { UpdateEmpresaDto } from './dto/updateEmpresa.dto';

@Injectable()
export class EmpresaService {
  constructor(private readonly prisma: PrismaService) {}

  private getSenhaBase(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
  }

  async create(dto: CreateEmpresaDto): Promise<ResponseJson> {
    const empresaExistente = await this.prisma.empresa.findFirst({
      where: {
        OR: [{ cnpj: dto.cnpj }, { email: dto.email }],
      },
    });

    if (empresaExistente?.cnpj === dto.cnpj) {
      return { status: 400, message: 'Empresa já existe com este CNPJ.' };
    }

    if (empresaExistente?.email === dto.email) {
      return { status: 400, message: 'Empresa já existe com este email.' };
    }

    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (usuarioExistente) {
      return { status: 400, message: 'Usuário já existe com este email.' };
    }

    const senhaBase = this.getSenhaBase(dto.cnpj);
    const passwordHash = await bcrypt.hash(senhaBase, 10);

    try {
      const empresa = await this.prisma.$transaction(async (tx) => {
        const novaEmpresa = await tx.empresa.create({
          data: {
            nome: dto.nome,
            razao: dto.razao,
            cnpj: dto.cnpj,
            registro_estadual: dto.registro_estadual,
            registro_municipal: dto.registro_municipal,
            email: dto.email,
            website: dto.website,
            status: dto.status,
            enderecos: {
              create: dto.enderecos.map((endereco) => ({
                cep: endereco.cep,
                numero: endereco.numero,
                logradouro: endereco.logradouro,
                bairro: endereco.bairro,
                cidade: endereco.cidade,
                uf: endereco.uf,
                pais: endereco.pais,
                principal: endereco.principal ?? true,
              })),
            },
            contatos: {
              create: dto.contatos.map((contato) => ({
                tipo: contato.tipo,
                contato: contato.contato,
                principal: contato.principal ?? true,
              })),
            },
          },
          include: {
            enderecos: true,
            contatos: true,
          },
        });

        const user = await tx.usuario.create({
          data: {
            empresaId: novaEmpresa.id,
            email: dto.email,
            senha: passwordHash,
            username: dto.nome,
          },
        });

        const todosAcessos = await tx.acesso.findMany({
          where: { nome: { notIn: ['empresa', 'usuario'] } },
          select: {
            id: true,
          },
        });

        await tx.atribuicao.createMany({
          data: todosAcessos.map((acesso) => ({
            usuarioId: user.id,
            acessoId: acesso.id,
          })),
          skipDuplicates: true,
        });

        return novaEmpresa;
      });

      return {
        status: 201,
        message: 'Empresa criada com sucesso.',
        data: {
          id: empresa.id,
          nome: empresa.nome,
          razao: empresa.razao,
          cnpj: empresa.cnpj,
          email: empresa.email,
          enderecos: empresa.enderecos,
          contatos: empresa.contatos,
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          status: 422,
          message: 'Empresa ou usuário já existe com estes dados.',
        };
      }

      throw error;
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    status: string = 'ativo',
  ): Promise<ResponseJson> {
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);

    const skip = (pageNumber - 1) * limitNumber;

    const searchFilter: any = {
      status: status ? { equals: status } : undefined,
    };

    if (search) {
      searchFilter.OR = [
        { nome: { contains: search, mode: 'insensitive' as const } },
        { razao: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { cnpj: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    const [empresas, totalEmpresas] = await Promise.all([
      this.prisma.empresa.findMany({
        skip,
        take: limitNumber,
        where: searchFilter,
        select: {
          id: true,
          nome: true,
          razao: true,
          registro_estadual: true,
          registro_municipal: true,
          website: true,
          cnpj: true,
          email: true,
          enderecos: true,
          contatos: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.empresa.count({ where: searchFilter }),
    ]);

    return {
      status: 200,
      message: 'Empresas listadas com sucesso.',
      data: {
        companies: empresas,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: totalEmpresas,
          pages: Math.ceil(totalEmpresas / limitNumber),
        },
      },
    };
  }

  async updateStatus(id: string, status: string): Promise<ResponseJson> {
    const empresa = await this.prisma.empresa.findUnique({ where: { id } });

    if (!empresa) {
      return { status: 422, message: 'Empresa não encontrada.' };
    }

    const updatedEmpresa = await this.prisma.$transaction(async (tx) => {
      const updatingEmpresa = await this.prisma.empresa.update({
        where: { id },
        data: { status: status as Prisma.EnumStatusFieldUpdateOperationsInput },
      });

      await tx.usuario.updateMany({
        where: { empresaId: id },
        data: { status: status as Prisma.EnumStatusFieldUpdateOperationsInput },
      });

      return updatingEmpresa;
    });

    return {
      status: 200,
      message: 'Status da empresa atualizado com sucesso.',
      data: updatedEmpresa,
    };
  }

  async update(id: string, dto: UpdateEmpresaDto): Promise<ResponseJson> {
    const empresa = await this.prisma.empresa.findUnique({ where: { id } });

    if (!empresa) {
      return { status: 422, message: 'Empresa não encontrada.' };
    }

    const updatedEmpresa = await this.prisma.empresa.update({
      where: { id },
      data: {
        nome: dto.nome,
        razao: dto.razao,
        cnpj: dto.cnpj,
        registro_estadual: dto.registro_estadual,
        registro_municipal: dto.registro_municipal,
        email: dto.email,
        website: dto.website,
        status: dto.status,
        enderecos: {
          deleteMany: {},
          create: dto.enderecos?.map((endereco) => ({
            cep: endereco.cep,
            numero: endereco.numero,
            logradouro: endereco.logradouro,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            uf: endereco.uf,
            pais: endereco.pais,
            principal: endereco.principal ?? true,
          })),
        },
        contatos: {
          deleteMany: {},
          create: dto.contatos?.map((contato) => ({
            tipo: contato.tipo,
            contato: contato.contato,
            principal: contato.principal ?? true,
          })),
        },
      },
      include: {
        enderecos: true,
        contatos: true,
      },
    });

    return {
      status: 200,
      message: 'Empresa atualizada com sucesso.',
      data: updatedEmpresa,
    };
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const empresa = await this.prisma.empresa.findUnique({ where: { id } });

    if (!empresa) {
      return { status: 422, message: 'Empresa não encontrada.' };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.usuario.deleteMany({ where: { empresaId: id } });
      await tx.empresa.delete({ where: { id } });
    });

    return { status: 200, message: 'Empresa deletada com sucesso.' };
  }
}

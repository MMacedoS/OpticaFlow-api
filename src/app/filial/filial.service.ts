import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, Status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseJson } from 'src/interface/response/response.interface';
import { CreateFilialDto } from './dto/filial.dto';
import { getSenhaBase } from 'src/utils/validator';
import { UpdateFilialDto } from './dto/update.dto';

@Injectable()
export class FilialService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFilialDto): Promise<ResponseJson> {
    if (!dto.empresaId) {
      return { status: 400, message: 'O id da empresa é obrigatório.' };
    }

    const empresa = await this.prisma.empresa.findUnique({
      where: { id: dto.empresaId },
    });

    if (!empresa) {
      return { status: 404, message: 'Empresa não encontrada.' };
    }

    if (dto.cnpj) {
      const filialExistente = await this.prisma.filial.findFirst({
        where: { cnpj: dto.cnpj },
      });

      if (filialExistente) {
        return { status: 400, message: 'Filial já existe com este CNPJ.' };
      }
    }

    const senhaBase = getSenhaBase(dto.pessoa.cpf);
    const passwordHash = await bcrypt.hash(senhaBase, 10);

    try {
      const filial = await this.prisma.$transaction(async (tx) => {
        const novaFilial = await tx.filial.create({
          data: {
            nome: dto.nome,
            cnpj: dto.cnpj,
            empresaId: dto.empresaId,
            enderecos: {
              create: dto.enderecos.map((endereco) => ({
                ...endereco,
                principal: endereco.principal ?? true,
              })),
            },
            contatos: {
              create: dto.contatos.map((contato) => ({
                ...contato,
                principal: contato.principal ?? true,
              })),
            },
            ...(dto.config && {
              config: { create: dto.config },
            }),
          },
          include: { enderecos: true, contatos: true, config: true },
        });

        const pessoa = await tx.pessoa.create({
          data: {
            nome: dto.pessoa.nome,
            cpf: dto.pessoa.cpf,
            email: dto.pessoa.email,
            data_nascimento: dto.pessoa.data_nascimento,
            genero: dto.pessoa.genero,
            status: dto.pessoa.status,
            filialId: novaFilial.id,
            enderecos: {
              create: dto.enderecos.map((endereco) => ({
                cep: endereco.cep,
                numero: endereco.numero ?? 'S/N',
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

            funcionario: {
              create: { cargo: 'Gerente' },
            },
          },
        });

        const user = await tx.usuario.create({
          data: {
            empresaId: dto.empresaId,
            email: dto.pessoa.email,
            senha: passwordHash,
            username: dto.pessoa.nome,
            pessoaId: pessoa.id,
          },
        });

        const todosAcessos = await tx.acesso.findMany({
          where: { nome: { notIn: ['empresa', 'usuario', 'filial'] } },
          select: { id: true },
        });

        await tx.atribuicao.createMany({
          data: todosAcessos.map((acesso) => ({
            usuarioId: user.id,
            acessoId: acesso.id,
          })),
          skipDuplicates: true,
        });

        return novaFilial;
      });

      return {
        status: 201,
        message: 'Filial criada com sucesso.',
        data: { branches: filial },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return { status: 400, message: 'Filial já existe com este CNPJ.' };
      }
      throw error;
    }
  }

  async findAllByEmpresa(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search: string = '',
    status: string = 'ativo',
  ): Promise<ResponseJson> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      return { status: 401, message: 'Usuário não encontrado.' };
    }

    const empresaId = usuario.empresaId;

    if (!empresaId) {
      return {
        status: 401,
        message: 'Usuário não está associado a uma empresa.',
      };
    }

    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      return {
        status: 401,
        message: 'Empresa associada ao usuário não encontrada.',
      };
    }

    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const searchFilter = search
      ? {
          OR: [
            { nome: { contains: search, mode: 'insensitive' as const } },
            { cnpj: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [filiais, total] = await this.prisma.$transaction([
      this.prisma.filial.findMany({
        skip,
        take: limitNumber,
        where: { empresaId, ...searchFilter },
        select: {
          id: true,
          nome: true,
          cnpj: true,
          empresaId: true,
          empresa: true,
          enderecos: true,
          contatos: true,
          config: true,
          pessoas: {
            select: {
              id: true,
              nome: true,
              cpf: true,
              email: true,
              data_nascimento: true,
              genero: true,
              status: true,
            },
            where: { funcionario: { cargo: 'Gerente' } },
            take: 1,
          },
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.filial.count({ where: { empresaId, ...searchFilter } }),
    ]);

    const filiaisComGerente = filiais.map((f) => ({
      ...f,
      pessoa: f.pessoas[0] || null,
      pessoas: undefined,
    }));

    return {
      status: 200,
      message: 'Filiais listadas com sucesso.',
      data: {
        branches: filiaisComGerente,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: total,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
    };
  }

  async findById(id: string) {
    return await this.prisma.filial.findUnique({
      where: { id },
      include: {
        enderecos: true,
        contatos: true,
        config: true,
      },
    });
  }

  async findByPessoaId(pessoaId: string) {
    return await this.prisma.pessoa.findUnique({
      where: { id: pessoaId },
      include: { filial: true },
    });
  }

  async update(id: string, dto: UpdateFilialDto): Promise<ResponseJson> {
    const filialExistente = await this.prisma.filial.findUnique({
      where: { id },
    });
    if (!filialExistente) {
      throw new NotFoundException('Filial não encontrada.');
    }

    const filialAtualizada = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.filial.update({
        where: { id },
        data: {
          nome: dto.nome,
          cnpj: dto.cnpj,
        },
      });

      await tx.endereco_filial.deleteMany({ where: { filialId: id } });
      await tx.endereco_filial.createMany({
        data: dto.enderecos.map((end) => ({ ...end, filialId: id })),
      });

      await tx.contato_filial.deleteMany({ where: { filialId: id } });
      await tx.contato_filial.createMany({
        data: dto.contatos.map((cont) => ({ ...cont, filialId: id })),
      });

      return updated;
    });

    const filialComDados = await this.prisma.filial.findUnique({
      where: { id },
      include: {
        pessoas: {
          select: { id: true, nome: true, cpf: true, email: true },
          where: { funcionario: { cargo: 'Gerente' } },
          take: 1,
        },
      },
    });

    const responseData = {
      ...filialComDados,
      pessoa: filialComDados?.pessoas[0] || null,
      pessoas: undefined,
    };

    return {
      status: 200,
      message: 'Filial atualizada com sucesso.',
      data: { branch: responseData },
    };
  }

  async updateStatus(id: string, status: Status): Promise<ResponseJson> {
    const filial = await this.prisma.filial.findUnique({
      where: { id },
    });

    if (!filial) {
      return { status: 404, message: 'Filial não encontrada.' };
    }

    const pessoasDaFilial = await this.prisma.pessoa.findMany({
      where: { filialId: id },
      select: { id: true },
    });
    const pessoaIds = pessoasDaFilial.map((p) => p.id);

    const updatedFilial = await this.prisma.$transaction(async (tx) => {
      const filialUpd = await tx.filial.update({
        where: { id },
        data: { status },
      });

      await tx.pessoa.updateMany({
        where: { filialId: id },
        data: { status },
      });

      await tx.usuario.updateMany({
        where: { pessoaId: { in: pessoaIds } },
        data: { status },
      });

      return filialUpd;
    });

    return {
      status: 200,
      message: 'Status atualizado com sucesso.',
      data: updatedFilial,
    };
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const filial = await this.prisma.filial.findUnique({
      where: { id },
      include: { pessoas: { include: { usuario: true } } }, // Incluímos o usuário para facilitar
    });

    if (!filial) {
      throw new NotFoundException('Filial não encontrada.');
    }

    const pessoaIds = filial.pessoas.map((p) => p.id);
    const usuarioIds = filial.pessoas
      .map((p) => p.usuario?.id)
      .filter((id): id is string => !!id);

    await this.prisma.$transaction(async (tx) => {
      await tx.endereco_filial.deleteMany({ where: { filialId: id } });
      await tx.contato_filial.deleteMany({ where: { filialId: id } });
      await tx.config_filial.deleteMany({ where: { filialId: id } });

      await tx.atribuicao.deleteMany({
        where: { usuarioId: { in: usuarioIds } },
      });
      await tx.usuario.deleteMany({ where: { id: { in: usuarioIds } } });

      await tx.endereco.deleteMany({ where: { pessoaId: { in: pessoaIds } } });
      await tx.contato.deleteMany({ where: { pessoaId: { in: pessoaIds } } });
      await tx.funcionario.deleteMany({
        where: { pessoaId: { in: pessoaIds } },
      });

      await tx.pessoa.deleteMany({ where: { filialId: id } });
      await tx.filial.delete({ where: { id } });
    });

    return { status: 200, message: 'Filial deletada com sucesso.' };
  }

  async upsertConfig(
    filialId: string,
    dto: import('./dto/filial.dto').ConfigFilialDto,
  ): Promise<ResponseJson> {
    await this.assertFilialExists(filialId);

    const config = await this.prisma.config_filial.upsert({
      where: {
        filialId: filialId,
      },
      update: {
        timezone: dto.timezone,
        moeda: dto.moeda,
      },
      create: {
        filialId,
        timezone: dto.timezone,
        moeda: dto.moeda,
      },
    });

    return {
      status: 200,
      message: 'Configuração salva com sucesso.',
      data: config,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async assertFilialExists(filialId: string): Promise<void> {
    const filial = await this.prisma.filial.findUnique({
      where: { id: filialId },
    });

    if (!filial) {
      throw new NotFoundException('Filial não encontrada.');
    }
  }
}

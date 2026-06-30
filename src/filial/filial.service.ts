import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TipoContatos } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseJson } from 'src/interface/response/response.interface';
import { CreateFilialDto } from './dto/filial.dto';

@Injectable()
export class FilialService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFilialDto): Promise<ResponseJson> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: dto.empresaId },
    });

    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    if (dto.cnpj) {
      const filialExistente = await this.prisma.filial.findFirst({
        where: { cnpj: dto.cnpj },
      });

      if (filialExistente) {
        throw new ConflictException('Já existe uma filial com este CNPJ.');
      }
    }

    try {
      const filial = await this.prisma.$transaction(async (tx) => {
        const novaFilial = await tx.filial.create({
          data: {
            nome: dto.nome,
            cnpj: dto.cnpj,
            empresaId: dto.empresaId,
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
                Contato: contato.Contato,
                principal: contato.principal ?? true,
              })),
            },
            ...(dto.config && {
              config: {
                create: {
                  timezone: dto.config.timezone,
                  moeda: dto.config.moeda,
                },
              },
            }),
          },
          include: {
            enderecos: true,
            contatos: true,
            config: true,
          },
        });

        return novaFilial;
      });

      return {
        status: 201,
        message: 'Filial criada com sucesso.',
        data: {
          id: filial.id,
          nome: filial.nome,
          cnpj: filial.cnpj,
          empresaId: filial.empresaId,
          enderecos: filial.enderecos,
          contatos: filial.contatos,
          config: filial.config,
          createdAt: filial.createdAt,
          updatedAt: filial.updatedAt,
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe uma filial com estes dados.');
      }

      throw error;
    }
  }

  async findAllByEmpresa(
    empresaId: string,
    page: number = 1,
    limit: number = 10,
    search: string = '',
  ): Promise<ResponseJson> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada.');
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
          createdAt: true,
          updatedAt: true,
          enderecos: true,
          contatos: true,
          config: true,
        },
      }),
      this.prisma.filial.count({ where: { empresaId, ...searchFilter } }),
    ]);

    return {
      status: 200,
      message: 'Filiais listadas com sucesso.',
      data: filiais,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findById(id: string): Promise<ResponseJson> {
    const filial = await this.prisma.filial.findUnique({
      where: { id },
      include: {
        enderecos: true,
        contatos: true,
        config: true,
      },
    });

    if (!filial) {
      throw new NotFoundException('Filial não encontrada.');
    }

    return {
      status: 200,
      message: 'Filial encontrada.',
      data: filial,
    };
  }

  async update(
    id: string,
    dto: Partial<CreateFilialDto>,
  ): Promise<ResponseJson> {
    const filial = await this.prisma.filial.findUnique({ where: { id } });

    if (!filial) {
      throw new NotFoundException('Filial não encontrada.');
    }

    if (dto.cnpj && dto.cnpj !== filial.cnpj) {
      const filialComCnpj = await this.prisma.filial.findFirst({
        where: { cnpj: dto.cnpj, id: { not: id } },
      });

      if (filialComCnpj) {
        throw new ConflictException('Já existe outra filial com este CNPJ.');
      }
    }

    const filialAtualizada = await this.prisma.filial.update({
      where: { id },
      data: {
        nome: dto.nome,
        cnpj: dto.cnpj,
      },
      include: {
        enderecos: true,
        contatos: true,
        config: true,
      },
    });

    return {
      status: 200,
      message: 'Filial atualizada com sucesso.',
      data: filialAtualizada,
    };
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const filial = await this.prisma.filial.findUnique({ where: { id } });

    if (!filial) {
      throw new NotFoundException('Filial não encontrada.');
    }

    await this.prisma.filial.delete({ where: { id } });

    return { status: 200, message: 'Filial deletada com sucesso.' };
  }

  // ─── Endereço ─────────────────────────────────────────────────────────────

  async addEndereco(
    filialId: string,
    dto: import('./dto/filial.dto').EnderecoFilialDto,
  ): Promise<ResponseJson> {
    await this.assertFilialExists(filialId);

    const endereco = await this.prisma.endereco_filial.create({
      data: {
        filialId,
        cep: dto.cep,
        numero: dto.numero,
        logradouro: dto.logradouro,
        bairro: dto.bairro,
        cidade: dto.cidade,
        uf: dto.uf,
        pais: dto.pais,
        principal: dto.principal ?? false,
      },
    });

    return {
      status: 201,
      message: 'Endereço adicionado com sucesso.',
      data: endereco,
    };
  }

  async updateEndereco(
    filialId: string,
    enderecoId: string,
    dto: Partial<import('./dto/filial.dto').EnderecoFilialDto>,
  ): Promise<ResponseJson> {
    await this.assertFilialExists(filialId);

    const endereco = await this.prisma.endereco_filial.findFirst({
      where: { id: enderecoId, filialId },
    });

    if (!endereco) {
      throw new NotFoundException('Endereço não encontrado para esta filial.');
    }

    const atualizado = await this.prisma.endereco_filial.update({
      where: { id: enderecoId },
      data: dto,
    });

    return {
      status: 200,
      message: 'Endereço atualizado com sucesso.',
      data: atualizado,
    };
  }

  async deleteEndereco(
    filialId: string,
    enderecoId: string,
  ): Promise<ResponseJson> {
    await this.assertFilialExists(filialId);

    const endereco = await this.prisma.endereco_filial.findFirst({
      where: { id: enderecoId, filialId },
    });

    if (!endereco) {
      throw new NotFoundException('Endereço não encontrado para esta filial.');
    }

    await this.prisma.endereco_filial.delete({ where: { id: enderecoId } });

    return { status: 200, message: 'Endereço removido com sucesso.' };
  }

  // ─── Contato ──────────────────────────────────────────────────────────────

  async addContato(
    filialId: string,
    dto: import('./dto/filial.dto').ContatoFilialDto,
  ): Promise<ResponseJson> {
    await this.assertFilialExists(filialId);

    const contato = await this.prisma.contato_filial.create({
      data: {
        filialId,
        tipo: dto.tipo,
        Contato: dto.Contato,
        principal: dto.principal ?? false,
      },
    });

    return {
      status: 201,
      message: 'Contato adicionado com sucesso.',
      data: contato,
    };
  }

  async updateContato(
    filialId: string,
    contatoId: string,
    dto: Partial<import('./dto/filial.dto').ContatoFilialDto>,
  ): Promise<ResponseJson> {
    await this.assertFilialExists(filialId);

    const contato = await this.prisma.contato_filial.findFirst({
      where: { id: contatoId, filialId },
    });

    if (!contato) {
      throw new NotFoundException('Contato não encontrado para esta filial.');
    }

    const atualizado = await this.prisma.contato_filial.update({
      where: { id: contatoId },
      data: dto,
    });

    return {
      status: 200,
      message: 'Contato atualizado com sucesso.',
      data: atualizado,
    };
  }

  async deleteContato(
    filialId: string,
    contatoId: string,
  ): Promise<ResponseJson> {
    await this.assertFilialExists(filialId);

    const contato = await this.prisma.contato_filial.findFirst({
      where: { id: contatoId, filialId },
    });

    if (!contato) {
      throw new NotFoundException('Contato não encontrado para esta filial.');
    }

    await this.prisma.contato_filial.delete({ where: { id: contatoId } });

    return { status: 200, message: 'Contato removido com sucesso.' };
  }

  // ─── Config ───────────────────────────────────────────────────────────────

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

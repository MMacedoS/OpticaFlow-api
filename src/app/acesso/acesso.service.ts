import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Acesso, Prisma } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateAcessoDto,
  PermissaoSelecionadaDto,
  UpdateAcessoDto,
} from './dto/acesso.dto';
import { ModuloCatalogo } from './interfaces/acesso.interface';

/** Modulos sem tela/rota propria, fora do catalogo de permissoes. */
const MODULOS_OCULTOS = new Set(['auth', 'compra-item', 'venda-item']);

const ACESSO_INCLUDE = {
  permissao: {
    select: { permissao: { select: { modulo: true, acao: true } } },
  },
  _count: { select: { atribuicao: true } },
} satisfies Prisma.AcessoInclude;

type AcessoComPermissoes = Prisma.AcessoGetPayload<{
  include: typeof ACESSO_INCLUDE;
}>;

@Injectable()
export class AcessoService {
  constructor(private readonly prisma: PrismaService) {}

  async catalogo(): Promise<ResponseJson> {
    const permissoes = await this.prisma.permissao.findMany({
      where: { empresaId: null },
      select: { modulo: true, acao: true },
      orderBy: [{ modulo: 'asc' }, { acao: 'asc' }],
    });

    const modulos = new Map<string, string[]>();
    for (const { modulo, acao } of permissoes) {
      if (MODULOS_OCULTOS.has(modulo)) continue;
      modulos.set(modulo, [...(modulos.get(modulo) ?? []), acao]);
    }

    const data: ModuloCatalogo[] = [...modulos].map(([modulo, acoes]) => ({
      modulo,
      acoes,
    }));

    return { status: 200, message: 'Catálogo de permissões.', data };
  }

  async findAll(escopo: EscopoUsuario): Promise<ResponseJson> {
    const acessos = await this.prisma.acesso.findMany({
      where: this.filtroVisiveis(escopo),
      include: ACESSO_INCLUDE,
      orderBy: [
        { empresaId: { sort: 'desc', nulls: 'last' } },
        { nome: 'asc' },
      ],
    });

    return {
      status: 200,
      message: 'Perfis de acesso listados com sucesso.',
      data: acessos.map((acesso) => this.mapAcesso(acesso, escopo)),
    };
  }

  async findById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const acesso = await this.buscarVisivel(id, escopo);

    return {
      status: 200,
      message: 'Perfil de acesso encontrado.',
      data: this.mapAcesso(acesso, escopo),
    };
  }

  async create(
    dto: CreateAcessoDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const empresaId = escopo.superadmin
      ? (dto.empresaId ?? null)
      : (escopo.empresaId ?? null);

    if (!empresaId && !escopo.superadmin) {
      throw new ForbiddenException('Usuário sem empresa vinculada.');
    }

    await this.garantirNomeDisponivel(dto.nome, empresaId);
    const permissaoIds = await this.resolverPermissoes(dto.permissoes);

    const acesso = await this.prisma.acesso.create({
      data: {
        nome: dto.nome.trim(),
        descricao: dto.descricao,
        empresaId,
        permissao: {
          create: permissaoIds.map((permissaoId) => ({ permissaoId })),
        },
      },
      include: ACESSO_INCLUDE,
    });

    return {
      status: 201,
      message: 'Perfil de acesso criado com sucesso.',
      data: this.mapAcesso(acesso, escopo),
    };
  }

  async update(
    id: string,
    dto: UpdateAcessoDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const acesso = await this.buscarVisivel(id, escopo);
    this.exigirEditavel(acesso, escopo);

    if (dto.nome && dto.nome.trim() !== acesso.nome) {
      await this.garantirNomeDisponivel(dto.nome, acesso.empresaId, id);
    }

    const permissaoIds = dto.permissoes
      ? await this.resolverPermissoes(dto.permissoes)
      : null;

    const atualizado = await this.prisma.$transaction(async (tx) => {
      if (permissaoIds) {
        await tx.acessoPermissao.deleteMany({ where: { acessoId: id } });
        await tx.acessoPermissao.createMany({
          data: permissaoIds.map((permissaoId) => ({
            acessoId: id,
            permissaoId,
          })),
        });
      }

      return tx.acesso.update({
        where: { id },
        data: { nome: dto.nome?.trim(), descricao: dto.descricao },
        include: ACESSO_INCLUDE,
      });
    });

    return {
      status: 200,
      message:
        'Perfil de acesso atualizado. Os usuários veem a mudança no próximo login.',
      data: this.mapAcesso(atualizado, escopo),
    };
  }

  async deleteById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const acesso = await this.buscarVisivel(id, escopo);
    this.exigirEditavel(acesso, escopo);

    if (acesso._count.atribuicao > 0) {
      throw new ConflictException(
        `Este perfil está atribuído a ${acesso._count.atribuicao} usuário(s); remova-o dos usuários antes de excluir.`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.acessoPermissao.deleteMany({ where: { acessoId: id } }),
      this.prisma.acesso.delete({ where: { id } }),
    ]);

    return { status: 200, message: 'Perfil de acesso excluído com sucesso.' };
  }

  async listarUsuarios(escopo: EscopoUsuario): Promise<ResponseJson> {
    const usuarios = await this.prisma.usuario.findMany({
      where: {
        ...(escopo.empresaId && { empresaId: escopo.empresaId }),
        superadmin: false,
      },
      orderBy: { username: 'asc' },
      select: {
        id: true,
        email: true,
        username: true,
        status: true,
        pessoa: { select: { nome: true } },
        atribuicao: { select: { acessoId: true } },
      },
    });

    return {
      status: 200,
      message: 'Usuários listados com sucesso.',
      data: usuarios.map(({ atribuicao, ...usuario }) => ({
        ...usuario,
        acessoIds: atribuicao.map((a) => a.acessoId),
      })),
    };
  }

  async definirAcessosDoUsuario(
    usuarioId: string,
    acessoIds: string[],
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    if (usuarioId === escopo.usuarioId && !escopo.superadmin) {
      throw new ForbiddenException(
        'Você não pode alterar o seu próprio acesso. Peça a outro administrador.',
      );
    }

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: usuarioId,
        ...(escopo.empresaId && { empresaId: escopo.empresaId }),
      },
      select: { id: true, superadmin: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (usuario.superadmin) {
      throw new ForbiddenException(
        'O acesso do superadmin não pode ser alterado.',
      );
    }

    const permitidos = await this.prisma.acesso.count({
      where: { id: { in: acessoIds }, ...this.filtroVisiveis(escopo) },
    });

    if (permitidos !== acessoIds.length) {
      throw new UnprocessableEntityException(
        'Um ou mais perfis não existem ou não pertencem à sua empresa.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.atribuicao.deleteMany({ where: { usuarioId } }),
      this.prisma.atribuicao.createMany({
        data: acessoIds.map((acessoId) => ({ usuarioId, acessoId })),
      }),
    ]);

    return {
      status: 200,
      message:
        'Acessos do usuário atualizados. A mudança vale no próximo login dele.',
      data: { usuarioId, acessoIds },
    };
  }

  /** Usado pelo login/refresh para montar as permissoes da sessao. */
  async listarAtribuicoesDoUsuario(usuarioId: string) {
    const atribuicoes = await this.prisma.atribuicao.findMany({
      where: { usuarioId },
      select: {
        acesso: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            permissao: {
              select: {
                permissao: {
                  select: {
                    id: true,
                    modulo: true,
                    acao: true,
                    descricao: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return {
      status: 200,
      message: 'Atribuições carregadas com sucesso.',
      data: atribuicoes,
    };
  }

  private filtroVisiveis(escopo: EscopoUsuario): Prisma.AcessoWhereInput {
    if (escopo.superadmin && !escopo.empresaId) return {};
    return {
      OR: [{ empresaId: null }, { empresaId: escopo.empresaId ?? '' }],
    };
  }

  private async buscarVisivel(
    id: string,
    escopo: EscopoUsuario,
  ): Promise<AcessoComPermissoes> {
    const acesso = await this.prisma.acesso.findFirst({
      where: { id, ...this.filtroVisiveis(escopo) },
      include: ACESSO_INCLUDE,
    });

    if (!acesso) {
      throw new NotFoundException('Perfil de acesso não encontrado.');
    }

    return acesso;
  }

  private podeEditar(acesso: Acesso, escopo: EscopoUsuario): boolean {
    return (
      escopo.superadmin ||
      (acesso.empresaId !== null && acesso.empresaId === escopo.empresaId)
    );
  }

  private exigirEditavel(acesso: Acesso, escopo: EscopoUsuario): void {
    if (!this.podeEditar(acesso, escopo)) {
      throw new ForbiddenException(
        'Perfis padrão do sistema não podem ser alterados. Crie um perfil da empresa.',
      );
    }
  }

  private async garantirNomeDisponivel(
    nome: string,
    empresaId: string | null,
    ignorarId?: string,
  ): Promise<void> {
    const existente = await this.prisma.acesso.findFirst({
      where: {
        nome: { equals: nome.trim(), mode: 'insensitive' },
        empresaId,
        ...(ignorarId && { NOT: { id: ignorarId } }),
      },
      select: { id: true },
    });

    if (existente) {
      throw new ConflictException('Já existe um perfil com este nome.');
    }
  }

  private async resolverPermissoes(
    selecionadas: PermissaoSelecionadaDto[],
  ): Promise<string[]> {
    if (selecionadas.length === 0) {
      throw new BadRequestException('Selecione pelo menos uma permissão.');
    }

    const chaves = new Set(selecionadas.map((p) => `${p.modulo}:${p.acao}`));

    const permissoes = await this.prisma.permissao.findMany({
      where: {
        empresaId: null,
        OR: [...chaves].map((chave) => {
          const [modulo, acao] = chave.split(':');
          return { modulo, acao };
        }),
      },
      select: { id: true, modulo: true },
    });

    if (
      permissoes.length !== chaves.size ||
      permissoes.some((p) => MODULOS_OCULTOS.has(p.modulo))
    ) {
      throw new UnprocessableEntityException(
        'Uma ou mais permissões selecionadas não existem.',
      );
    }

    return permissoes.map((p) => p.id);
  }

  private mapAcesso(acesso: AcessoComPermissoes, escopo: EscopoUsuario) {
    return {
      id: acesso.id,
      nome: acesso.nome,
      descricao: acesso.descricao,
      empresaId: acesso.empresaId,
      sistema: acesso.empresaId === null,
      editavel: this.podeEditar(acesso, escopo),
      usuarios: acesso._count.atribuicao,
      permissoes: acesso.permissao.map(({ permissao }) => permissao),
    };
  }
}

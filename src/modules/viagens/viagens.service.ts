import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateViagemDto, FindViagensDto, UpdateViagemDto } from "./dto";

const includeCompleto = {
  veiculo: true,
  motorista: true,
  cidadeOrigem: true,
  cidadeDestino: true,
  pessoas: { include: { pessoa: true } },
};

@Injectable()
export class ViagensService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateViagemDto, usuarioId: number) {
    let motoristaId = dto.motoristaId;

    if (!motoristaId) {
      const motorista = await this.prisma.motorista.findUnique({
        where: { usuarioId },
        select: { id: true, ativo: true },
      });

      if (!motorista) {
        throw new ForbiddenException(
          "O usuario autenticado nao possui um motorista vinculado.",
        );
      }

      if (!motorista.ativo) {
        throw new BadRequestException(
          "O motorista vinculado ao usuario autenticado esta inativo.",
        );
      }

      motoristaId = motorista.id;
    } else {
      const motorista = await this.prisma.motorista.findUnique({
        where: { id: motoristaId },
        select: { id: true, ativo: true },
      });

      if (!motorista) {
        throw new NotFoundException("Motorista nao encontrado.");
      }

      if (!motorista.ativo) {
        throw new BadRequestException("O motorista selecionado esta inativo.");
      }
    }

    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id: dto.veiculoId },
      select: { id: true, ativo: true },
    });
    if (!veiculo) throw new NotFoundException("Veiculo nao encontrado.");
    if (!veiculo.ativo) throw new BadRequestException("O veiculo selecionado esta inativo.");

    const [origem, destino] = await Promise.all([
      this.prisma.cidade.findUnique({
        where: { id: dto.cidadeOrigemId },
        select: { id: true, ativo: true },
      }),
      this.prisma.cidade.findUnique({
        where: { id: dto.cidadeDestinoId },
        select: { id: true, ativo: true },
      }),
    ]);
    if (!origem || !origem.ativo) {
      throw new BadRequestException("A cidade de origem selecionada esta inativa ou nao existe.");
    }
    if (!destino || !destino.ativo) {
      throw new BadRequestException("A cidade de destino selecionada esta inativa ou nao existe.");
    }

    if (dto.pessoas && dto.pessoas.length > 0) {
      const pessoas = await this.prisma.pessoa.findMany({
        where: { id: { in: dto.pessoas.map((p) => p.pessoaId) } },
        select: { id: true, nome: true, ativo: true },
      });
      const inativa = pessoas.find((p) => !p.ativo);
      if (inativa) {
        throw new BadRequestException(`O passageiro ${inativa.nome} esta inativo.`);
      }
    }

    const saida = new Date(dto.dataSaida);
    const entrada = dto.dataEntrada ? new Date(dto.dataEntrada) : undefined;

    if (entrada && entrada < saida) {
      throw new BadRequestException(
        "Data de entrada nao pode ser anterior a saida.",
      );
    }

    return this.prisma.viagem.create({
      data: {
        veiculoId: dto.veiculoId,
        motoristaId,
        cidadeOrigemId: dto.cidadeOrigemId,
        cidadeDestinoId: dto.cidadeDestinoId,
        dataSaida: saida,
        dataEntrada: entrada,
        observacao: dto.observacao,
        pessoas: {
          create: dto.pessoas.map((p) => ({
            pessoaId: p.pessoaId,
            tipoParticipacao: p.tipoParticipacao,
            observacao: p.observacao,
          })),
        },
      },
      include: includeCompleto,
    });
  }

  findAll(query: FindViagensDto) {
    const { page, limit } = query;

    return this.prisma.viagem.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: this.buildWhere(query),
      include: includeCompleto,
      orderBy: { dataSaida: "desc" },
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.viagem.findUnique({
      where: { id },
      include: includeCompleto,
    });

    if (!item) {
      throw new NotFoundException("Viagem nao encontrada");
    }

    return item;
  }

  async update(id: number, dto: UpdateViagemDto) {
    await this.findOne(id);

    const saida = dto.dataSaida ? new Date(dto.dataSaida) : undefined;
    const entrada = dto.dataEntrada ? new Date(dto.dataEntrada) : undefined;

    if (saida && entrada && entrada < saida) {
      throw new BadRequestException(
        "Data de entrada nao pode ser anterior a saida.",
      );
    }

    if (dto.motoristaId) {
      const motorista = await this.prisma.motorista.findUnique({
        where: { id: dto.motoristaId },
        select: { id: true, ativo: true },
      });

      if (!motorista) {
        throw new NotFoundException("Motorista nao encontrado.");
      }

      if (!motorista.ativo) {
        throw new BadRequestException("O motorista selecionado esta inativo.");
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.pessoas) {
        await tx.viagemPessoa.deleteMany({ where: { viagemId: id } });
      }

      return tx.viagem.update({
        where: { id },
        data: {
          veiculoId: dto.veiculoId,
          motoristaId: dto.motoristaId,
          cidadeOrigemId: dto.cidadeOrigemId,
          cidadeDestinoId: dto.cidadeDestinoId,
          dataSaida: saida,
          dataEntrada: entrada,
          observacao: dto.observacao,
          ativo: dto.ativo,
          pessoas: dto.pessoas
            ? {
                create: dto.pessoas.map((p) => ({
                  pessoaId: p.pessoaId,
                  tipoParticipacao: p.tipoParticipacao,
                  observacao: p.observacao,
                })),
              }
            : undefined,
        },
        include: includeCompleto,
      });
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.viagem.update({
      where: { id },
      data: { ativo: false },
    });
  }

  porMotorista(motoristaId: number) {
    return this.prisma.viagem.findMany({
      where: { motoristaId, ativo: true },
      include: includeCompleto,
      orderBy: { dataSaida: "desc" },
    });
  }

  porVeiculo(veiculoId: number) {
    return this.prisma.viagem.findMany({
      where: { veiculoId, ativo: true },
      include: includeCompleto,
      orderBy: { dataSaida: "desc" },
    });
  }

  private buildWhere(query: FindViagensDto): Prisma.ViagemWhereInput {
    const passageiroId = query.passageiroId ?? query.pessoaId;
    const dataInicio = query.dataInicio ? new Date(query.dataInicio) : undefined;
    const dataFim = query.dataFim ? this.fimDoDia(query.dataFim) : undefined;

    if (dataInicio && dataFim && dataFim < dataInicio) {
      throw new BadRequestException(
        "Data final nao pode ser anterior a data inicial.",
      );
    }

    return {
      ativo: query.ativo !== undefined ? query.ativo : true,
      motoristaId: query.motoristaId,
      cidadeDestinoId: query.cidadeDestinoId,
      veiculoId: query.veiculoId,
      dataSaida:
        dataInicio || dataFim
          ? {
              gte: dataInicio,
              lte: dataFim,
            }
          : undefined,
      pessoas: passageiroId
        ? {
            some: {
              pessoaId: passageiroId,
            },
          }
        : undefined,
    };
  }

  private fimDoDia(data: string) {
    const fim = new Date(data);
    fim.setHours(23, 59, 59, 999);
    return fim;
  }
}

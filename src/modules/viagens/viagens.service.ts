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
    const motorista = await this.prisma.motorista.findUnique({
      where: { usuarioId },
      select: { id: true },
    });

    if (!motorista) {
      throw new ForbiddenException(
        "O usuario autenticado nao possui um motorista vinculado.",
      );
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
        motoristaId: motorista.id,
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

    return this.prisma.$transaction(async (tx) => {
      if (dto.pessoas) {
        await tx.viagemPessoa.deleteMany({ where: { viagemId: id } });
      }

      return tx.viagem.update({
        where: { id },
        data: {
          veiculoId: dto.veiculoId,
          cidadeOrigemId: dto.cidadeOrigemId,
          cidadeDestinoId: dto.cidadeDestinoId,
          dataSaida: saida,
          dataEntrada: entrada,
          observacao: dto.observacao,
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
    return this.prisma.viagem.delete({ where: { id } });
  }

  porMotorista(motoristaId: number) {
    return this.prisma.viagem.findMany({
      where: { motoristaId },
      include: includeCompleto,
      orderBy: { dataSaida: "desc" },
    });
  }

  porVeiculo(veiculoId: number) {
    return this.prisma.viagem.findMany({
      where: { veiculoId },
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

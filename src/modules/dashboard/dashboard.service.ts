import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { DashboardPeriodoDto } from "./dashboard-periodo.dto";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(periodo: DashboardPeriodoDto) {
    const [metricas, viagensPorDestino] = await Promise.all([
      this.metricas(periodo),
      this.viagensPorDestino(periodo),
    ]);

    return { ...metricas, viagensPorDestino };
  }

  async metricas(periodo: DashboardPeriodoDto) {
    const whereViagens = this.wherePeriodo(periodo);
    const whereMotoristas = this.temPeriodo(periodo)
      ? whereViagens
      : { dataEntrada: null, ativo: true };
    const totalVeiculos = this.temPeriodo(periodo)
      ? this.prisma.viagem
          .findMany({
            where: whereViagens,
            distinct: ["veiculoId"],
            select: { veiculoId: true },
          })
          .then((veiculos) => veiculos.length)
      : this.prisma.veiculo.count({ where: { ativo: true } });
    const [
      totalViagens,
      totalPassageiros,
      motoristasEmViagem,
      quantidadeVeiculos,
    ] = await Promise.all([
      this.prisma.viagem.count({ where: whereViagens }),
      this.prisma.viagemPessoa.count({ where: { viagem: whereViagens } }),
      this.prisma.viagem.findMany({
        where: whereMotoristas,
        distinct: ["motoristaId"],
        select: { motoristaId: true },
      }),
      totalVeiculos,
    ]);

    return {
      totalViagens,
      totalPassageiros,
      totalMotoristasAtivos: motoristasEmViagem.length,
      totalVeiculos: quantidadeVeiculos,
    };
  }

  private async viagensPorDestino(periodo: DashboardPeriodoDto) {
    const totais = await this.prisma.viagem.groupBy({
      by: ["cidadeDestinoId"],
      _count: { _all: true },
      where: this.wherePeriodo(periodo),
    });

    const cidades = await this.prisma.cidade.findMany({
      where: {
        id: { in: totais.map(({ cidadeDestinoId }) => cidadeDestinoId) },
      },
      select: { id: true, nome: true },
    });
    const nomesPorId = new Map(cidades.map(({ id, nome }) => [id, nome]));

    return totais
      .map(({ cidadeDestinoId, _count }) => ({
        cidade: nomesPorId.get(cidadeDestinoId) ?? "Cidade não encontrada",
        quantidadeViagens: _count._all,
      }))
      .sort(
        (a, b) =>
          b.quantidadeViagens - a.quantidadeViagens ||
          a.cidade.localeCompare(b.cidade, "pt-BR"),
      );
  }

  private wherePeriodo({
    dataInicio,
    dataFim,
  }: DashboardPeriodoDto): Prisma.ViagemWhereInput {
    const inicio = dataInicio ? new Date(dataInicio) : undefined;
    const fim = dataFim ? this.fimDoDia(dataFim) : undefined;

    if (inicio && fim && inicio > fim) {
      throw new BadRequestException(
        "Data inicial não pode ser posterior à data final.",
      );
    }

    if (!inicio && !fim) {
      return { ativo: true };
    }

    return { ativo: true, dataSaida: { gte: inicio, lte: fim } };
  }

  private temPeriodo({ dataInicio, dataFim }: DashboardPeriodoDto) {
    return Boolean(dataInicio || dataFim);
  }

  private fimDoDia(data: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return new Date(data);
    }

    const fim = new Date(`${data}T23:59:59.999Z`);
    return fim;
  }
}

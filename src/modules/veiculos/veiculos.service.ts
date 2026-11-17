import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PaginationDto } from "../../common/pagination.dto";
import { CreateVeiculoDto, UpdateVeiculoDto } from "./dto";

@Injectable()
export class VeiculosService {
  constructor(private prisma: PrismaService) {}
  async create(data: CreateVeiculoDto) {
    return this.prisma.veiculo.create({ data });
  }
  async findAll({ page, limit }: PaginationDto) {
    return this.prisma.veiculo.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { nome: "asc" },
    });
  }
  async findOne(id: number) {
    const item = await this.prisma.veiculo.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("Veículo não encontrado");
    return item;
  }
  async update(id: number, data: UpdateVeiculoDto) {
    await this.findOne(id);
    return this.prisma.veiculo.update({ where: { id }, data });
  }
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.veiculo.update({
      where: { id },
      data: { ativo: false },
    });
  }
}

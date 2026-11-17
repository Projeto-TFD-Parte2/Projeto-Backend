import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PaginationDto } from "../../common/pagination.dto";
import { CreateCidadeDto, UpdateCidadeDto } from "./dto";
@Injectable()
export class CidadesService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateCidadeDto) {
    return this.prisma.cidade.create({
      data: { nome: dto.nome, uf: dto.uf.toUpperCase() },
    });
  }
  findAll({ page, limit }: PaginationDto) {
    return this.prisma.cidade.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: { ativo: true },
      orderBy: [{ uf: "asc" }, { nome: "asc" }],
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.cidade.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("Cidade não encontrada");
    return item;
  }

  async update(id: number, dto: UpdateCidadeDto) {
    await this.findOne(id);
    return this.prisma.cidade.update({
      where: { id },
      data: { ...dto, uf: dto.uf?.toUpperCase() },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.cidade.update({
      where: { id },
      data: { ativo: false },
    });
  }
}

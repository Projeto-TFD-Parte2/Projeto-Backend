import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PaginationDto } from "../../common/pagination.dto";
import { CreatePessoaDto, UpdatePessoaDto } from "./dto";

@Injectable()
export class PessoasService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreatePessoaDto) {
    return this.prisma.pessoa.create({
      data: {
        ...dto,
        dataNascimento: dto.dataNascimento
          ? new Date(dto.dataNascimento)
          : undefined,
      },
    });
  }
  findAll({ page, limit }: PaginationDto) {
    return this.prisma.pessoa.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { nome: "asc" },
    });
  }
  async findOne(id: number) {
    const item = await this.prisma.pessoa.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("Pessoa não encontrada");
    return item;
  }
  async historico(id: number) {
    await this.findOne(id);
    return this.prisma.viagemPessoa.findMany({
      where: { pessoaId: id },
      include: {
        viagem: {
          include: {
            motorista: true,
            veiculo: true,
            cidadeOrigem: true,
            cidadeDestino: true,
          },
        },
      },
      orderBy: { viagem: { dataSaida: "desc" } },
    });
  }
  async update(id: number, dto: UpdatePessoaDto) {
    await this.findOne(id);
    return this.prisma.pessoa.update({
      where: { id },
      data: {
        ...dto,
        dataNascimento: dto.dataNascimento
          ? new Date(dto.dataNascimento)
          : undefined,
      },
    });
  }
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.pessoa.update({
      where: { id },
      data: { ativo: false },
    });
  }
}

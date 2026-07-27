import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PaginationDto } from "../../common/pagination.dto";
import {
  CreateMotoristaDto,
  UpdateMotoristaDto,
  VincularMotoristaUsuarioDto,
} from "./dto";

@Injectable()
export class MotoristasService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMotoristaDto) {
    const usuario = await this.buscarOperadorDisponivel(dto.usuarioId);

    return this.prisma.motorista.create({
      data: {
        nome: usuario.nome,
        cpf: dto.cpf,
        endereco: dto.endereco,
        renach: dto.renach,
        validadeHabilitacao: new Date(dto.validadeHabilitacao),
        tipoHabilitacao: dto.tipoHabilitacao,
        tipoVinculo: dto.tipoVinculo,
        usuarioId: usuario.id,
      },
    });
  }
  findAll({ page, limit }: PaginationDto) {
    return this.prisma.motorista.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { nome: "asc" },
    });
  }
  async findOne(id: number) {
    const item = await this.prisma.motorista.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("Motorista não encontrado");
    return item;
  }
  async update(id: number, dto: UpdateMotoristaDto) {
    await this.findOne(id);
    return this.prisma.motorista.update({
      where: { id },
      data: {
        ...dto,
        validadeHabilitacao: dto.validadeHabilitacao
          ? new Date(dto.validadeHabilitacao)
          : undefined,
      },
    });
  }
  async remove(id: number) {
    const motorista = await this.findOne(id);
    if (motorista.usuarioId) {
      throw new BadRequestException(
        "Nao e permitido remover o motorista vinculado a um usuario operador.",
      );
    }
    return this.prisma.motorista.delete({ where: { id } });
  }

  async vincularUsuario(id: number, dto: VincularMotoristaUsuarioDto) {
    const motorista = await this.findOne(id);
    if (motorista.usuarioId) {
      throw new ConflictException(
        "Este motorista ja esta vinculado a um usuario.",
      );
    }

    const usuario = await this.buscarOperadorDisponivel(dto.usuarioId);
    return this.prisma.motorista.update({
      where: { id },
      data: { usuarioId: usuario.id, nome: usuario.nome },
    });
  }
  habilitacoesVencendo(dias = 30) {
    const limite = new Date();
    limite.setDate(limite.getDate() + dias);
    return this.prisma.motorista.findMany({
      where: { validadeHabilitacao: { lte: limite } },
      orderBy: { validadeHabilitacao: "asc" },
    });
  }

  private async buscarOperadorDisponivel(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nome: true,
        role: true,
        motorista: { select: { id: true } },
      },
    });

    if (!usuario) {
      throw new NotFoundException("Usuario nao encontrado");
    }
    if (usuario.role !== "OPERADOR") {
      throw new BadRequestException("O usuario precisa ter a role OPERADOR.");
    }
    if (usuario.motorista) {
      throw new ConflictException(
        "O usuario ja possui um motorista vinculado.",
      );
    }

    return usuario;
  }
}

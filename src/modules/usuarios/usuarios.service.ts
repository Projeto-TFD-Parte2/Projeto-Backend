import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PasswordService } from "../../auth/password.service";
import {
  CreateUsuarioDto,
  UpdateUsuarioDto,
  UpdateUsuarioSenhaDto,
} from "./dto";

const usuarioSelect = {
  id: true,
  nome: true,
  email: true,
  role: true,
  ativo: true,
  createdAt: true,
  updatedAt: true,
  motorista: {
    select: {
      id: true,
      cpf: true,
      endereco: true,
      renach: true,
      validadeHabilitacao: true,
      tipoHabilitacao: true,
      tipoVinculo: true,
    },
  },
};

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  create(dto: CreateUsuarioDto) {
    const role = dto.role ?? "OPERADOR";

    if (role === "OPERADOR" && !dto.motorista) {
      throw new BadRequestException(
        "Um usuario operador precisa dos dados de motorista.",
      );
    }

    if (role === "ADMIN" && dto.motorista) {
      throw new BadRequestException(
        "Dados de motorista so podem ser informados para um operador.",
      );
    }

    return this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        email: dto.email.toLowerCase(),
        senhaHash: this.passwordService.hash(dto.password),
        role,
        motorista: dto.motorista
          ? {
              create: {
                nome: dto.nome,
                cpf: dto.motorista.cpf,
                endereco: dto.motorista.endereco,
                renach: dto.motorista.renach,
                validadeHabilitacao: new Date(
                  dto.motorista.validadeHabilitacao,
                ),
                tipoHabilitacao: dto.motorista.tipoHabilitacao,
                tipoVinculo: dto.motorista.tipoVinculo,
              },
            }
          : undefined,
      },
      select: usuarioSelect,
    });
  }

  findAll() {
    return this.prisma.usuario.findMany({
      orderBy: { nome: "asc" },
      select: usuarioSelect,
    });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: usuarioSelect,
    });

    if (!usuario) {
      throw new NotFoundException("Usuario nao encontrado");
    }

    return usuario;
  }

  async update(id: number, dto: UpdateUsuarioDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, motorista: { select: { id: true } } },
    });

    if (!usuario) {
      throw new NotFoundException("Usuario nao encontrado");
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        nome: dto.nome,
        email: dto.email?.toLowerCase(),
        ativo: dto.ativo,
        senhaHash: dto.password
          ? this.passwordService.hash(dto.password)
          : undefined,
        motorista:
          dto.nome && usuario.motorista
            ? { update: { nome: dto.nome } }
            : undefined,
      },
      select: usuarioSelect,
    });
  }

  async updateSenha(id: number, dto: UpdateUsuarioSenhaDto) {
    await this.findOne(id);

    return this.prisma.usuario.update({
      where: { id },
      data: {
        senhaHash: this.passwordService.hash(dto.password),
      },
      select: usuarioSelect,
    });
  }
}

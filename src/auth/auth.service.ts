import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "./jwt.service";
import { PasswordService } from "./password.service";
import { LoginDto } from "./dto";

const motoristaSelect = {
  id: true,
  cpf: true,
  endereco: true,
  renach: true,
  validadeHabilitacao: true,
  tipoHabilitacao: true,
  tipoVinculo: true,
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.validateCredentials(dto);

    if (usuario.role !== "OPERADOR") {
      throw new UnauthorizedException("Credenciais invalidas");
    }

    return this.createLoginResponse(usuario);
  }

  async adminLogin(dto: LoginDto) {
    const usuario = await this.validateCredentials(dto);

    if (usuario.role !== "ADMIN") {
      throw new UnauthorizedException("Credenciais invalidas");
    }

    return this.createLoginResponse(usuario);
  }

  async me(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        motorista: { select: motoristaSelect },
      },
    });

    if (!usuario) {
      throw new UnauthorizedException("Credenciais invalidas");
    }

    return usuario;
  }

  private async validateCredentials(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { motorista: { select: motoristaSelect } },
    });

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException("Credenciais invalidas");
    }

    const validPassword = this.passwordService.verify(
      dto.password,
      usuario.senhaHash,
    );

    if (!validPassword) {
      throw new UnauthorizedException("Credenciais invalidas");
    }

    return usuario;
  }

  private createLoginResponse(
    usuario: Awaited<ReturnType<AuthService["validateCredentials"]>>,
  ) {
    const token = this.jwtService.sign({
      sub: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
    });

    return {
      ...token,
      tokenType: "Bearer",
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        motorista: usuario.motorista,
      },
    };
  }
}

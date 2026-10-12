import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.validateCredentials(dto);

    if (usuario.role !== "OPERADOR") {
      this.logger.warn(
        `Acesso negado: Usuário ${usuario.email} tentou login de operador, mas possui perfil ${usuario.role}`,
      );
      throw new UnauthorizedException("Credenciais invalidas");
    }

    this.logger.log(
      `Operador autenticado com sucesso: ${usuario.email} (ID: ${usuario.id})`,
    );
    return this.createLoginResponse(usuario);
  }

  async adminLogin(dto: LoginDto) {
    const usuario = await this.validateCredentials(dto);

    if (usuario.role !== "ADMIN") {
      this.logger.warn(
        `Acesso negado: Usuário ${usuario.email} tentou login de admin, mas possui perfil ${usuario.role}`,
      );
      throw new UnauthorizedException("Credenciais invalidas");
    }

    this.logger.log(
      `Administrador autenticado com sucesso: ${usuario.email} (ID: ${usuario.id})`,
    );
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
    const credential = this.getLoginCredential(dto);
    const usuario = await this.prisma.usuario.findFirst({
      where: this.isEmailCredential(credential)
        ? { email: credential.toLowerCase() }
        : {
            motorista: {
              is: {
                cpf: {
                  in: this.getCpfSearchValues(credential),
                },
              },
            },
          },
      include: { motorista: { select: motoristaSelect } },
    });

    if (!usuario) {
      this.logger.warn(`Tentativa de login com usuário inexistente: ${credential}`);
      throw new UnauthorizedException("Credenciais invalidas");
    }

    if (!usuario.ativo) {
      this.logger.warn(`Tentativa de login com usuário inativo: ${usuario.email} (ID: ${usuario.id})`);
      throw new UnauthorizedException("Credenciais invalidas");
    }

    const validPassword = this.passwordService.verify(
      dto.password,
      usuario.senhaHash,
    );

    if (!validPassword) {
      this.logger.warn(`Tentativa de login com senha incorreta para o usuário: ${usuario.email}`);
      throw new UnauthorizedException("Credenciais invalidas");
    }

    return usuario;
  }

  private getLoginCredential(dto: LoginDto) {
    const credential = dto.login ?? dto.email ?? dto.cpf;

    if (!credential?.trim()) {
      throw new UnauthorizedException("Credenciais invalidas");
    }

    return credential.trim();
  }

  private isEmailCredential(credential: string) {
    return credential.includes("@");
  }

  private getCpfSearchValues(cpf: string) {
    const onlyDigits = cpf.replace(/\D/g, "");
    return Array.from(new Set([cpf, onlyDigits].filter(Boolean)));
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

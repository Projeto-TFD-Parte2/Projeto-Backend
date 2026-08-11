import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaErrorFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    if (exception.code === "P2002") {
      throw new ConflictException(this.getUniqueConstraintMessage(exception));
    }

    if (exception.code === "P2025") {
      throw new NotFoundException("Registro nao encontrado.");
    }

    response
      .status(400)
      .json({ message: exception.message, code: exception.code });
  }

  private getUniqueConstraintMessage(
    exception: Prisma.PrismaClientKnownRequestError,
  ) {
    const target = Array.isArray(exception.meta?.target)
      ? exception.meta.target.join(", ")
      : String(exception.meta?.target ?? "");

    if (target.includes("email")) {
      return "Ja existe um usuario cadastrado com este email.";
    }

    if (target.includes("cpf")) {
      return "Ja existe um cadastro com este CPF.";
    }

    if (target.includes("renach")) {
      return "Ja existe um motorista cadastrado com este RENACH.";
    }

    if (target.includes("placa")) {
      return "Ja existe um veiculo cadastrado com esta placa.";
    }

    if (target.includes("renavam")) {
      return "Ja existe um veiculo cadastrado com este RENAVAM.";
    }

    return "Registro duplicado em campo unico.";
  }
}

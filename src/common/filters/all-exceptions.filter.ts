import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("Exceptions");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = "Erro interno do servidor";
    let errorName = "InternalServerError";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === "object" && res !== null && "message" in res
          ? (res as any).message
          : res;
      errorName = exception.name;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === "P2002") {
        status = HttpStatus.CONFLICT;
        message = this.getUniqueConstraintMessage(exception);
        errorName = "ConflictException";
      } else if (exception.code === "P2025") {
        status = HttpStatus.NOT_FOUND;
        message = "Registro não encontrado.";
        errorName = "NotFoundException";
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = `Erro no banco de dados (${exception.code})`;
        errorName = "PrismaClientError";
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorName = exception.name;
    }

    const requestId = request.headers["x-request-id"] || "-";
    const logDetails = `[${requestId}] ${request.method} ${request.url} - Status ${status} (${errorName}): ${
      typeof message === "string" ? message : JSON.stringify(message)
    }`;

    if (status >= 500) {
      this.logger.error(
        logDetails,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(logDetails);
    }

    response.status(status).json({
      statusCode: status,
      error: errorName,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getUniqueConstraintMessage(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string {
    const target = Array.isArray(exception.meta?.target)
      ? exception.meta.target.join(", ")
      : String(exception.meta?.target ?? "");

    if (target.includes("email")) {
      return "Já existe um usuário cadastrado com este e-mail.";
    }

    if (target.includes("cpf")) {
      return "Já existe um cadastro com este CPF.";
    }

    if (target.includes("renach")) {
      return "Já existe um motorista cadastrado com este RENACH.";
    }

    if (target.includes("placa")) {
      return "Já existe um veículo cadastrado com esta placa.";
    }

    if (target.includes("renavam")) {
      return "Já existe um veículo cadastrado com este RENAVAM.";
    }

    return "Registro duplicado em campo único.";
  }
}

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.DEBUG_PRISMA === "true"
          ? ["query", "info", "warn", "error"]
          : ["warn", "error"],
    });
  }

  async onModuleInit() {
    this.logger.log("Conectando ao banco de dados...");
    await this.$connect();
    this.logger.log("Conexão com o banco de dados estabelecida com sucesso.");
  }

  async onModuleDestroy() {
    this.logger.log("Desconectando do banco de dados...");
    await this.$disconnect();
    this.logger.log("Conexão com o banco de dados encerrada.");
  }
}

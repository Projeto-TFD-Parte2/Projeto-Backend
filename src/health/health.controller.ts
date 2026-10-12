import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/public.decorator";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: "Verifica o status da aplicação e a conectividade com o banco de dados",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Aplicação e banco de dados operacionais",
    schema: {
      example: {
        status: "ok",
        timestamp: "2026-10-12T23:40:00.000Z",
        uptime: 123.45,
        database: {
          status: "up",
          latencyMs: 4,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: "Banco de dados ou serviço indisponível",
    schema: {
      example: {
        statusCode: 503,
        error: "ServiceUnavailableException",
        message: "Banco de dados indisponível",
        timestamp: "2026-10-12T23:40:00.000Z",
        path: "/api/health",
      },
    },
  })
  async health() {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - start;

      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: Number(process.uptime().toFixed(2)),
        database: {
          status: "up",
          latencyMs,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Falha na conexão com o banco de dados";

      this.logger.error(
        `Health check falhou ao consultar o banco de dados: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new ServiceUnavailableException("Banco de dados indisponível");
    }
  }
}

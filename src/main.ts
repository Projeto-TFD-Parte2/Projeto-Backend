import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";

function requireEnvironment() {
  const jwtSecret = process.env.JWT_SECRET;

  if (process.env.NODE_ENV === "production" && !jwtSecret) {
    throw new Error("JWT_SECRET must be set in production");
  }

  if (
    process.env.NODE_ENV === "production" &&
    jwtSecret &&
    jwtSecret.length < 32
  ) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }

  if (process.env.NODE_ENV === "production" && !process.env.CORS_ORIGINS) {
    throw new Error("CORS_ORIGINS must be set in production");
  }
}

function getAllowedOrigins() {
  const configuredOrigins = process.env.CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins?.length) {
    return configuredOrigins;
  }

  return ["http://localhost:3000", "http://localhost:5173"];
}

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  requireEnvironment();

  const isProduction = process.env.NODE_ENV === "production";
  const app = await NestFactory.create(AppModule, {
    logger: isProduction
      ? ["log", "warn", "error"]
      : ["log", "warn", "error", "debug", "verbose"],
  });

  app.setGlobalPrefix("api");
  app.use(helmet());
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || getAllowedOrigins().includes(origin)) {
        callback(null, true);
        return;
      }

      logger.warn(`Requisição bloqueada por CORS da origem: ${origin}`);
      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("API Transporte de Pacientes")
    .setDescription(
      "Controle de viagens, veículos, motoristas, cidades, pacientes e acompanhantes.",
    )
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  if (
    !isProduction ||
    process.env.ENABLE_SWAGGER === "true"
  ) {
    const document = SwaggerModule.createDocument(app, config);
    document.security = [{ bearer: [] }];
    SwaggerModule.setup("docs", app, document);
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);

  logger.log(`Aplicação iniciada com sucesso [ambiente: ${process.env.NODE_ENV || "development"}]`);
  logger.log(`API ouvindo na porta ${port}: http://localhost:${port}/api`);
  if (!isProduction || process.env.ENABLE_SWAGGER === "true") {
    logger.log(`Documentação Swagger disponível em: http://localhost:${port}/docs`);
  }
}
bootstrap();

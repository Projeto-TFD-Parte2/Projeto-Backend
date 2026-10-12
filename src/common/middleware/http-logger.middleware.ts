import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

const SENSITIVE_KEYS = new Set([
  "password",
  "senha",
  "token",
  "secret",
  "authorization",
  "currentpassword",
  "newpassword",
]);

function sanitize(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item));
  }
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      clean[key] = sanitize(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    // Correlation / Request ID
    const incomingId = req.headers["x-request-id"] as string | undefined;
    const requestId = incomingId || randomUUID();
    req.headers["x-request-id"] = requestId;
    res.setHeader("X-Request-Id", requestId);

    const { method, originalUrl } = req;
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      "-";

    res.on("finish", () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const contentLength = res.get("content-length") || "0";

      // Informações do usuário autenticado (se presente via JwtAuthGuard)
      const user = (req as any).user;
      const userInfo = user
        ? `[User: ${user.email ?? user.nome ?? user.id} (ID: ${user.id}, Role: ${user.role})]`
        : "[User: Anonymous]";

      const logMessage = `[${requestId}] ${method} ${originalUrl} ${statusCode} +${duration}ms - ${contentLength}b - IP: ${ip} ${userInfo}`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }

      // Se ocorreu erro (>= 400), loga payload sanitizado para agilizar debug sem vazar senhas
      if (
        statusCode >= 400 &&
        req.body &&
        typeof req.body === "object" &&
        Object.keys(req.body).length > 0 &&
        method !== "GET"
      ) {
        const sanitizedBody = sanitize(req.body);
        this.logger.debug(
          `[${requestId}] Request Body: ${JSON.stringify(sanitizedBody)}`,
        );
      }
    });

    res.on("close", () => {
      if (!res.writableEnded) {
        const duration = Date.now() - startTime;
        this.logger.warn(
          `[${requestId}] ${method} ${originalUrl} CLOSED (Aborted by client) +${duration}ms - IP: ${ip}`,
        );
      }
    });

    next();
  }
}

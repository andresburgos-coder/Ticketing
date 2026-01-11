import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import * as cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { DomainExceptionFilter } from "./infrastructure/common/domain-exception.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: false,
  });

  app.useGlobalFilters(new DomainExceptionFilter());

  // Set global prefix for all routes
  app.setGlobalPrefix("api");

  // Cookie Parser: Parse cookies from requests
  // MUST be added before CORS and guards to ensure cookies are available
  app.use(cookieParser());

  // Security: Add Helmet middleware for HTTP security headers
  // A05:2021 - Security Misconfiguration
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      dnsPrefetchControl: true,
      frameguard: { action: "deny" },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      xssFilter: true,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: [
      "http://localhost:4200",
      "http://127.0.0.1:4200",
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle("Ticket Sales System API")
    .setDescription(
      "Sistema de venta de entradas para eventos con reserva temporal y liberación automática",
    )
    .setVersion("1.0")
    .addTag("auth", "Authentication endpoints")
    .addTag("events", "Event management endpoints")
    .addTag("reservations", "Reservation management endpoints")
    .addTag("tickets", "Ticket management endpoints")
    .addTag("health", "Health check endpoints")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger documentation available at: http://localhost:${port}/api`,
  );
}

bootstrap();

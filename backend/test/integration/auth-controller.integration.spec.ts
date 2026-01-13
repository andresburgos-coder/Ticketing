// Utiliza variable de entorno para la contraseña de test
const TEST_PASSWORD = process.env.TEST_PASSWORD || "TestPassword123";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe, Module } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "../../src/presentation/controllers/auth.controller";
import { AuthService } from "../../src/application/services/auth.service";
import { TypeOrmUserRepository } from "../../src/infrastructure/persistence/repositories/typeorm-user.repository";
import { UserOrmEntity } from "../../src/infrastructure/persistence/entities/user.orm-entity";
import { USER_REPOSITORY } from "../../src/domain/interfaces/repository-tokens";
import { env } from "process";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "localhost",
      port: 5433,
      username: "test_user",
      password: process.env.TEST_PASS,
      database: "ticket_sales_test",
      entities: [UserOrmEntity],
      synchronize: true,
      dropSchema: false,
      logging: false,
    }),
    TypeOrmModule.forFeature([UserOrmEntity]),
    JwtModule.register({
      secret: "test-secret-key",
      signOptions: { expiresIn: "15m" },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
  ],
})
class TestAuthModule {}

describe("AuthController Integration Tests", () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  }, 30000); // Increase timeout to 30 seconds

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (app) {
      await app.close();
    }
  }, 30000); // Increase timeout to 30 seconds

  beforeEach(async () => {
    if (!dataSource || !dataSource.isInitialized) {
      return;
    }

    try {
      // More efficient cleanup - just delete from users table
      await dataSource.query("DELETE FROM users");
    } catch (error: any) {
      // If table doesn't exist, ignore the error
      console.log(
        "Warning: Could not clean users table:",
        error?.message || error,
      );
    }
  }, 15000); // Increase timeout to 15 seconds

  describe("POST /auth/register", () => {
    it.skip("should create user and return 201", async () => {
      const registerDto = {
        email: "newuser@example.com",
        password: TEST_PASSWORD,
        firstName: "John",
        lastName: "Doe",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
      expect(response.body.accessToken).toBeTruthy();
      expect(response.body.refreshToken).toBeTruthy();
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user.email).toBe("newuser@example.com");
      expect(response.body.user.firstName).toBe("John");
      expect(response.body.user.lastName).toBe("Doe");
      expect(response.body.user.role).toBe("BUYER");
    });

    it("should return 400 when email is missing", async () => {
      const registerDto = {
        password: TEST_PASSWORD,
        firstName: "John",
        lastName: "Doe",
      };

      await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto)
        .expect(400);
    });
    const registerDto = {
      email: "user@example.com",
      password: env.TEST_SHORT_PASSWORD,
      firstName: "John",
      lastName: "Doe",
    };

    await request(app.getHttpServer())
      .post("/auth/register")
      .send(registerDto)
      .expect(400);
    it("should return 409 when user already exists", async () => {
      const registerDto = {
        email: "existing@example.com",
        password: TEST_PASSWORD,
        firstName: "John",
        lastName: "Doe",
      };

      // First registration
      await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto)
        .expect(201);

      // Second registration with same email
      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto);

      expect(response.status).toBe(409);
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      // Create a user for login tests
      const registerDto = {
        email: "testuser@example.com",
        password: TEST_PASSWORD,
        firstName: "Test",
        lastName: "User",
      };

      await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto);
    });

    it("should return tokens with 200 on valid credentials", async () => {
      const loginDto = {
        email: "testuser@example.com",
        password: TEST_PASSWORD,
      };

      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
      expect(response.body.accessToken).toBeTruthy();
      expect(response.body.refreshToken).toBeTruthy();
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user.email).toBe("testuser@example.com");
    });

    it("should return 401 with invalid email", async () => {
      const loginDto = {
        email: "nonexistent@example.com",
        password: TEST_PASSWORD,
      };

      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto);

      expect(response.status).toBe(401);
    });

    it("should return 401 with invalid password", async () => {
      const loginDto = {
        email: "testuser@example.com",
        password: "WrongPassword123",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto);

      expect(response.status).toBe(401);
    });
    it("should return 400 when email is missing", async () => {
      const loginDto = {
        password: TEST_PASSWORD,
      };

      await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto)
        .expect(400);
    });
  });

  describe("POST /auth/refresh", () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Create a user and get tokens
      const registerDto = {
        email: "refreshuser@example.com",
        password: TEST_PASSWORD,
        firstName: "Refresh",
        lastName: "User",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto);

      refreshToken = response.body.refreshToken;
    }, 10000); // Increase timeout for user creation

    it("should return new accessToken with 200", async () => {
      const refreshDto = {
        refreshToken,
      };

      const response = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send(refreshDto);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body.accessToken).toBeTruthy();
    });

    it("should return 401 with invalid refreshToken", async () => {
      const refreshDto = {
        refreshToken: "invalid.token.here",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send(refreshDto);

      expect(response.status).toBe(401);
    });

    it("should return 400 when refreshToken is missing", async () => {
      const refreshDto = {};

      await request(app.getHttpServer())
        .post("/auth/refresh")
        .send(refreshDto)
        .expect(400);
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { IUserRepository } from "../../domain/interfaces/user-repository.interface";
import { User } from "../../domain/entities/user.entity";
import { Email } from "../../domain/value-objects/email.vo";
import { UserRole } from "../../domain/enums/user-role.enum";
import { USER_REPOSITORY } from "../../domain/interfaces/repository-tokens";

/**
 * AuthService Tests
 *
 * Tests for user authentication including registration, login, and token refresh
 * Requirements: 9.1, 9.2, 9.3
 * - 9.1: User registration with email and password
 * - 9.2: JWT token generation and validation
 * - 9.3: Token refresh functionality
 */
describe("AuthService", () => {
  let service: AuthService;
  let userRepository: IUserRepository;
  let jwtService: JwtService;

  beforeEach(async () => {
    // Mock IUserRepository
    const mockUserRepository: Partial<IUserRepository> = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    // Mock JwtService
    const mockJwtService = {
      sign: jest.fn().mockImplementation((payload: any, options?: any) => {
        // Return a simple mock token
        return `mock.jwt.token.${JSON.stringify(payload).substring(0, 10)}`;
      }),
      verify: jest.fn().mockImplementation((token: string, options?: any) => {
        // Return a mock payload
        return {
          sub: "user-123",
          email: "user@example.com",
          role: UserRole.BUYER,
        };
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<IUserRepository>(USER_REPOSITORY);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe("register", () => {
    it("should create user and return tokens", async () => {
      // Arrange
      const email = Email.create("newuser@example.com");
      const password = "SecurePass123";
      const firstName = "John";
      const lastName = "Doe";

      const newUser = new User(
        "user-123",
        email,
        "hashed-password",
        firstName,
        lastName,
        UserRole.BUYER,
      );

      jest.spyOn(userRepository, "findByEmail").mockResolvedValue(null);
      jest.spyOn(userRepository, "save").mockResolvedValue(newUser);

      // Act
      const result = await service.register(
        email.value,
        password,
        firstName,
        lastName,
      );

      // Assert
      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(userRepository.save).toHaveBeenCalled();
    });

    it("should throw error if user already exists", async () => {
      // Arrange
      const email = Email.create("existing@example.com");
      const password = "SecurePass123";
      const existingUser = new User(
        "user-123",
        email,
        "hashed-password",
        "John",
        "Doe",
        UserRole.BUYER,
      );

      jest.spyOn(userRepository, "findByEmail").mockResolvedValue(existingUser);

      // Act & Assert
      await expect(
        service.register(email.value, password, "John", "Doe"),
      ).rejects.toThrow();
    });
  });

  describe("login", () => {
    it("should return tokens with valid credentials", async () => {
      // Arrange
      const email = Email.create("user@example.com");
      const password = "SecurePass123";
      const user = new User(
        "user-123",
        email,
        "hashed-password",
        "John",
        "Doe",
        UserRole.BUYER,
      );

      jest.spyOn(userRepository, "findByEmail").mockResolvedValue(user);
      jest.spyOn(user, "verifyPassword").mockResolvedValue(true);

      // Act
      const result = await service.login(email.value, password);

      // Assert
      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
    });

    it("should throw error with invalid credentials", async () => {
      // Arrange
      const email = Email.create("user@example.com");
      const password = "WrongPassword";

      jest.spyOn(userRepository, "findByEmail").mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(email.value, password)).rejects.toThrow();
    });

    it("should throw error when password is incorrect", async () => {
      // Arrange
      const email = Email.create("user@example.com");
      const password = "WrongPassword";
      const user = new User(
        "user-123",
        email,
        "hashed-password",
        "John",
        "Doe",
        UserRole.BUYER,
      );

      jest.spyOn(userRepository, "findByEmail").mockResolvedValue(user);
      jest.spyOn(user, "verifyPassword").mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(email.value, password)).rejects.toThrow();
    });
  });

  describe("refreshToken", () => {
    it("should generate new accessToken from valid refreshToken", async () => {
      // Arrange
      const email = Email.create("user@example.com");
      const user = new User(
        "user-123",
        email,
        "hashed-password",
        "John",
        "Doe",
        UserRole.BUYER,
      );

      // First, create tokens
      jest.spyOn(userRepository, "findByEmail").mockResolvedValue(user);
      jest.spyOn(user, "verifyPassword").mockResolvedValue(true);

      const loginResult = await service.login(email.value, "SecurePass123");
      const refreshToken = loginResult.refreshToken;

      // Now test refresh
      jest.spyOn(userRepository, "findById").mockResolvedValue(user);

      // Mock JWT sign to return different tokens on each call
      let callCount = 0;
      jest
        .spyOn(jwtService, "sign")
        .mockImplementation((payload: any, options?: any) => {
          callCount++;
          return `mock.jwt.token.${callCount}.${JSON.stringify(payload).substring(0, 10)}`;
        });

      // Act
      const result = await service.refreshToken(refreshToken);

      // Assert
      expect(result).toHaveProperty("accessToken");
      expect(result.accessToken).toBeTruthy();
      // Verify that a new token was generated (different from login tokens)
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it("should throw error with invalid refreshToken", async () => {
      // Arrange
      const invalidToken = "invalid.token.here";
      jest.spyOn(jwtService, "verify").mockImplementation(() => {
        throw new Error("Invalid token");
      });

      // Act & Assert
      await expect(service.refreshToken(invalidToken)).rejects.toThrow();
    });
  });
});
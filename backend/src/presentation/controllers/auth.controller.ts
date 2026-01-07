import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService, AuthResponse } from '../../application/services/auth.service';
import { LoginDto } from '../../application/dto/login.dto';
import { RegisterDto } from '../../application/dto/register.dto';
import { RefreshTokenDto } from '../../application/dto/refresh-token.dto';

/**
 * AuthController
 * Handles authentication endpoints: register, login, and token refresh
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 * - 9.1: User registration with email and password
 * - 9.2: JWT token generation and validation
 * - 9.3: Token refresh functionality
 * - 9.4: Error handling for invalid credentials
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   * POST /auth/register
   * 
   * @param registerDto - Registration data (email, password, firstName, lastName)
   * @returns AuthResponse with tokens and user data
   * @throws ConflictException if user already exists
   * @throws BadRequestException if validation fails
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register a new user',
    description: 'Creates a new user account with email, password, and personal information'
  })
  @ApiBody({ 
    type: RegisterDto,
    description: 'User registration data'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'JWT access token' },
        refreshToken: { type: 'string', description: 'JWT refresh token' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'User ID' },
            email: { type: 'string', description: 'User email' },
            firstName: { type: 'string', description: 'User first name' },
            lastName: { type: 'string', description: 'User last name' },
            role: { type: 'string', description: 'User role', enum: ['BUYER', 'ORGANIZER', 'ADMIN'] }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflict - user already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'User with this email already exists' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.firstName,
      registerDto.lastName
    );
  }

  /**
   * Login user with email and password
   * POST /auth/login
   * 
   * @param loginDto - Login credentials (email, password)
   * @returns AuthResponse with tokens and user data
   * @throws UnauthorizedException if credentials are invalid
   * @throws BadRequestException if validation fails
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Login user',
    description: 'Authenticates user with email and password, returns JWT tokens'
  })
  @ApiBody({ 
    type: LoginDto,
    description: 'User login credentials'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully authenticated',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'JWT access token' },
        refreshToken: { type: 'string', description: 'JWT refresh token' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'User ID' },
            email: { type: 'string', description: 'User email' },
            firstName: { type: 'string', description: 'User first name' },
            lastName: { type: 'string', description: 'User last name' },
            role: { type: 'string', description: 'User role', enum: ['BUYER', 'ORGANIZER', 'ADMIN'] }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid credentials',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid email or password' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  /**
   * Refresh access token using refresh token
   * POST /auth/refresh
   * 
   * @param refreshTokenDto - Refresh token
   * @returns Object with new accessToken
   * @throws UnauthorizedException if refresh token is invalid
   * @throws BadRequestException if validation fails
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Refresh access token',
    description: 'Generates a new access token using a valid refresh token'
  })
  @ApiBody({ 
    type: RefreshTokenDto,
    description: 'Refresh token data'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'New access token generated',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'New JWT access token' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid refresh token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid refresh token' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto
  ): Promise<{ accessToken: string }> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }
}

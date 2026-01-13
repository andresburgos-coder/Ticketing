import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

/**
 * JWT Auth Guard
 * Protects routes by validating JWT tokens
 * Extracts user information from the token and attaches it to the request
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly JWT_SECRET = process.env.JWT_SECRET ?? "your-secret-key";

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token =
      this.extractTokenFromHeader(request) ||
      this.extractTokenFromCookie(request);

    if (!token) {
      this.logger.warn("No token provided in request");
      throw new UnauthorizedException("No token provided");
    }

    // Check for Postman placeholder variables
    if (token.includes("{{") || token.includes("}}")) {
      this.logger.error(`Token contains Postman placeholder: ${token}`);
      throw new UnauthorizedException(
        "Token contains unresolved variable. Please login first to get a valid token.",
      );
    }

    try {
      this.logger.debug(
        `Attempting to verify token: ${token.substring(0, 20)}...`,
      );
      this.logger.debug(
        `Using JWT_SECRET: ${this.JWT_SECRET.substring(0, 10)}...`,
      );

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.JWT_SECRET,
      });

      this.logger.debug(
        `Token verified successfully for user: ${payload.email}`,
      );

      // Attach user info to request
      (request as any).user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Token verification failed: ${err.message}`);
      this.logger.error(`Error name: ${err.name}`);
      if (err.stack) {
        this.logger.error(`Error stack: ${err.stack}`);
      }
      throw new UnauthorizedException("Invalid token");
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    return request.cookies?.accessToken;
  }
}

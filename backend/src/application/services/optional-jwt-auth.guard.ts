import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

/**
 * Optional JWT Auth Guard
 * Extracts user information from JWT token if present, but doesn't fail if no token
 * Used for endpoints that can work with or without authentication
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(OptionalJwtAuthGuard.name);
  private readonly JWT_SECRET = process.env.JWT_SECRET ?? "your-secret-key";

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token =
      this.extractTokenFromHeader(request) ||
      this.extractTokenFromCookie(request);

    if (!token) {
      this.logger.debug(
        "No token provided - proceeding without authentication",
      );
      return true;
    }

    // Check for Postman placeholder variables
    if (token.includes("{{") || token.includes("}}")) {
      this.logger.warn(`Token contains Postman placeholder: ${token}`);
      return true; // Don't fail, just proceed without auth
    }

    try {
      this.logger.debug(
        `Attempting to verify token: ${token.substring(0, 20)}...`,
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
      this.logger.warn(
        `Token verification failed: ${err.message} - proceeding without authentication`,
      );
      return true; // Don't fail, just proceed without auth
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

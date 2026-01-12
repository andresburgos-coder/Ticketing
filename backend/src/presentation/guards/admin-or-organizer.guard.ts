import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { UserRole } from "../../domain/enums/user-role.enum";

@Injectable()
export class AdminOrOrganizerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("User not authenticated");
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.ORGANIZER) {
      throw new ForbiddenException(
        "Access denied. Admin or Organizer role required.",
      );
    }

    return true;
  }
}

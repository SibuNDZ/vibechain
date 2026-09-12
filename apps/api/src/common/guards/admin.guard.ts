import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { isAdminUser } from "../admin/admin-ids";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: { userId?: string } }>();
    const userId = request.user?.userId;

    if (
      isAdminUser(
        userId,
        this.configService.get<string>("ADMIN_USER_IDS"),
        this.configService.get<string>("NODE_ENV")
      )
    ) {
      return true;
    }

    throw new ForbiddenException("Admin access required");
  }
}

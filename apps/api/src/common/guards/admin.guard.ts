import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: { userId?: string } }>();
    const userId = request.user?.userId;

    const configured = this.configService.get<string>("ADMIN_USER_IDS", "").trim();
    const adminIds = configured
      ? configured.split(",").map((id) => id.trim()).filter(Boolean)
      : [];

    if (adminIds.length === 0) {
      if (this.configService.get<string>("NODE_ENV") !== "production") {
        return true;
      }

      throw new ForbiddenException("Admin access required");
    }

    if (!userId || !adminIds.includes(userId)) {
      throw new ForbiddenException("Admin access required");
    }

    return true;
  }
}

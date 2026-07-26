import { Body, Controller, Get, Patch, Query, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { NotificationsService } from "./notifications.service";
import { MarkNotificationsReadDto } from "./dto/mark-read.dto";

@ApiTags("notifications")
@Controller("notifications")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Get current user's notifications" })
  @ApiQuery({ name: "cursor", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number })
  findAll(
    @Request() req: { user: { userId: string } },
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string
  ) {
    return this.notificationsService.findForUser(
      req.user.userId,
      cursor,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get unread notification count" })
  getUnreadCount(@Request() req: { user: { userId: string } }) {
    return this.notificationsService.getUnreadCount(req.user.userId);
  }

  @Patch("read")
  @ApiOperation({ summary: "Mark specific notifications as read" })
  markRead(
    @Request() req: { user: { userId: string } },
    @Body() dto: MarkNotificationsReadDto
  ) {
    return this.notificationsService.markRead(req.user.userId, dto.ids);
  }

  @Patch("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  markAllRead(@Request() req: { user: { userId: string } }) {
    return this.notificationsService.markAllRead(req.user.userId);
  }
}

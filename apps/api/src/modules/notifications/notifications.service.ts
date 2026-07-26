import { Injectable } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

const VOTE_MILESTONES = [10, 50, 100, 500, 1000];

interface CreateNotificationInput {
  type: NotificationType;
  actorId: string;
  recipientId: string;
  videoId?: string;
  commentId?: string;
  campaignId?: string;
  metadata?: { milestone: number };
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Never notify a user about their own action -- enforced here so no caller can bypass it. */
  private async create(data: CreateNotificationInput) {
    if (data.actorId === data.recipientId) return null;
    return this.prisma.notification.create({ data });
  }

  async notifyFollow(actorId: string, recipientId: string) {
    const existing = await this.prisma.notification.findFirst({
      where: { type: "FOLLOW", actorId, recipientId, read: false },
      select: { id: true },
    });
    if (existing) return null;

    return this.create({ type: "FOLLOW", actorId, recipientId });
  }

  async notifyComment(
    actorId: string,
    recipientId: string,
    videoId: string,
    commentId: string
  ) {
    return this.create({
      type: "COMMENT",
      actorId,
      recipientId,
      videoId,
      commentId,
    });
  }

  async notifyMention(
    actorId: string,
    recipientId: string,
    videoId: string,
    commentId: string
  ) {
    return this.create({
      type: "MENTION",
      actorId,
      recipientId,
      videoId,
      commentId,
    });
  }

  async notifyContribution(
    actorId: string,
    recipientId: string,
    campaignId: string
  ) {
    return this.create({
      type: "CONTRIBUTION",
      actorId,
      recipientId,
      campaignId,
    });
  }

  /** Call after a vote is recorded; only creates a notification if the new count just crossed a milestone. */
  async checkVoteMilestone(
    actorId: string,
    recipientId: string,
    videoId: string
  ) {
    const voteCount = await this.prisma.vote.count({ where: { videoId } });
    const milestone = VOTE_MILESTONES.find((m) => m === voteCount);
    if (!milestone) return null;

    const existing = await this.prisma.notification.findFirst({
      where: {
        type: "VOTE_MILESTONE",
        videoId,
        metadata: { path: ["milestone"], equals: milestone },
      },
      select: { id: true },
    });
    if (existing) return null;

    return this.create({
      type: "VOTE_MILESTONE",
      actorId,
      recipientId,
      videoId,
      metadata: { milestone },
    });
  }

  async findForUser(userId: string, cursor?: string, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 50);

    const notifications = await this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        actor: { select: { id: true, username: true, avatarUrl: true } },
        video: { select: { id: true, title: true } },
        comment: { select: { id: true, content: true } },
        campaign: {
          select: { id: true, video: { select: { id: true, title: true } } },
        },
      },
    });

    const hasMore = notifications.length > take;
    const page = hasMore ? notifications.slice(0, take) : notifications;

    return {
      data: page,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { recipientId: userId, read: false },
    });
    return { count };
  }

  async markRead(userId: string, ids: string[]) {
    await this.prisma.notification.updateMany({
      where: { id: { in: ids }, recipientId: userId },
      data: { read: true },
    });
    return { message: "Marked as read" };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, read: false },
      data: { read: true },
    });
    return { message: "All notifications marked as read" };
  }
}

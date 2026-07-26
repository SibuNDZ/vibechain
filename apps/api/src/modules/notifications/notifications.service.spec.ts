import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../database/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('notifyFollow', () => {
    it('creates a FOLLOW notification for a new follower', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);
      prisma.notification.create.mockResolvedValue({} as any);

      await service.notifyFollow('actor-1', 'recipient-1');

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: { type: 'FOLLOW', actorId: 'actor-1', recipientId: 'recipient-1' },
      });
    });

    it('skips creating a duplicate when an unread FOLLOW notification already exists', async () => {
      prisma.notification.findFirst.mockResolvedValue({ id: 'existing' } as any);

      await service.notifyFollow('actor-1', 'recipient-1');

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('never creates a notification for self-follow', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);

      await service.notifyFollow('user-1', 'user-1');

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('notifyComment', () => {
    it('creates a COMMENT notification for the video owner', async () => {
      prisma.notification.create.mockResolvedValue({} as any);

      await service.notifyComment('commenter-1', 'owner-1', 'video-1', 'comment-1');

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          type: 'COMMENT',
          actorId: 'commenter-1',
          recipientId: 'owner-1',
          videoId: 'video-1',
          commentId: 'comment-1',
        },
      });
    });

    it('skips notifying yourself when commenting on your own video', async () => {
      await service.notifyComment('owner-1', 'owner-1', 'video-1', 'comment-1');

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('notifyMention', () => {
    it('creates a MENTION notification for the mentioned user', async () => {
      prisma.notification.create.mockResolvedValue({} as any);

      await service.notifyMention('commenter-1', 'mentioned-1', 'video-1', 'comment-1');

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          type: 'MENTION',
          actorId: 'commenter-1',
          recipientId: 'mentioned-1',
          videoId: 'video-1',
          commentId: 'comment-1',
        },
      });
    });

    it('skips notifying yourself when mentioning yourself', async () => {
      await service.notifyMention('user-1', 'user-1', 'video-1', 'comment-1');

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('notifyContribution', () => {
    it('creates a CONTRIBUTION notification for the campaign video owner', async () => {
      prisma.notification.create.mockResolvedValue({} as any);

      await service.notifyContribution('contributor-1', 'owner-1', 'campaign-1');

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          type: 'CONTRIBUTION',
          actorId: 'contributor-1',
          recipientId: 'owner-1',
          campaignId: 'campaign-1',
        },
      });
    });

    it('skips notifying yourself when contributing to your own campaign', async () => {
      await service.notifyContribution('owner-1', 'owner-1', 'campaign-1');

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('checkVoteMilestone', () => {
    it('creates a VOTE_MILESTONE notification when the vote count exactly hits a threshold', async () => {
      prisma.vote.count.mockResolvedValue(100);
      prisma.notification.findFirst.mockResolvedValue(null);
      prisma.notification.create.mockResolvedValue({} as any);

      await service.checkVoteMilestone('voter-1', 'owner-1', 'video-1');

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          type: 'VOTE_MILESTONE',
          actorId: 'voter-1',
          recipientId: 'owner-1',
          videoId: 'video-1',
          metadata: { milestone: 100 },
        },
      });
    });

    it('does nothing when the vote count is not exactly on a milestone', async () => {
      prisma.vote.count.mockResolvedValue(101);

      await service.checkVoteMilestone('voter-1', 'owner-1', 'video-1');

      expect(prisma.notification.findFirst).not.toHaveBeenCalled();
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('skips creating a duplicate milestone notification for the same video and value', async () => {
      prisma.vote.count.mockResolvedValue(500);
      prisma.notification.findFirst.mockResolvedValue({ id: 'existing' } as any);

      await service.checkVoteMilestone('voter-1', 'owner-1', 'video-1');

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('skips notifying yourself when you vote on your own video and tip a milestone', async () => {
      prisma.vote.count.mockResolvedValue(10);
      prisma.notification.findFirst.mockResolvedValue(null);

      await service.checkVoteMilestone('owner-1', 'owner-1', 'video-1');

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('findForUser', () => {
    it('returns a page of notifications with no next cursor when under the limit', async () => {
      const rows = Array.from({ length: 3 }, (_, i) => ({ id: `n-${i}` }));
      prisma.notification.findMany.mockResolvedValue(rows as any);

      const result = await service.findForUser('user-1', undefined, 20);

      expect(result).toEqual({ data: rows, nextCursor: null });
    });

    it('returns a next cursor when more rows exist than the page limit', async () => {
      const rows = Array.from({ length: 4 }, (_, i) => ({ id: `n-${i}` }));
      prisma.notification.findMany.mockResolvedValue(rows as any);

      const result = await service.findForUser('user-1', undefined, 3);

      expect(result.data).toHaveLength(3);
      expect(result.nextCursor).toBe('n-2');
    });

    it('passes the cursor through to prisma when provided', async () => {
      prisma.notification.findMany.mockResolvedValue([]);

      await service.findForUser('user-1', 'cursor-id', 20);

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: { id: 'cursor-id' }, skip: 1 })
      );
    });
  });

  describe('getUnreadCount', () => {
    it('returns the unread count for the user', async () => {
      prisma.notification.count.mockResolvedValue(7);

      const result = await service.getUnreadCount('user-1');

      expect(result).toEqual({ count: 7 });
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { recipientId: 'user-1', read: false },
      });
    });
  });

  describe('markRead', () => {
    it('only marks notifications belonging to the requesting user', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 2 } as any);

      await service.markRead('user-1', ['n-1', 'n-2']);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['n-1', 'n-2'] }, recipientId: 'user-1' },
        data: { read: true },
      });
    });
  });

  describe('markAllRead', () => {
    it('marks all of the current user unread notifications as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 } as any);

      await service.markAllRead('user-1');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { recipientId: 'user-1', read: false },
        data: { read: true },
      });
    });
  });
});

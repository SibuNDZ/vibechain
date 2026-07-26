import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: DeepMockProxy<PrismaClient>;
  let notificationsService: { notifyComment: jest.Mock; notifyMention: jest.Mock };

  const mockVideo = {
    id: 'video-1',
    userId: 'owner-1',
    title: 'Test Video',
  };

  const mockComment = {
    id: 'comment-1',
    content: 'hello',
    userId: 'commenter-1',
    videoId: 'video-1',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'commenter-1', username: 'commenter', avatarUrl: null },
  };

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();
    notificationsService = {
      notifyComment: jest.fn(),
      notifyMention: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  describe('create', () => {
    it('throws NotFoundException when the video does not exist', async () => {
      prisma.video.findUnique.mockResolvedValue(null);

      await expect(
        service.create('commenter-1', 'video-1', { content: 'hi' })
      ).rejects.toThrow(NotFoundException);
    });

    it('notifies the video owner and creates no mentions when the comment has none', async () => {
      prisma.video.findUnique.mockResolvedValue(mockVideo as any);
      prisma.comment.create.mockResolvedValue(mockComment as any);
      prisma.user.findMany.mockResolvedValue([]);

      const result = await service.create('commenter-1', 'video-1', {
        content: 'just a regular comment',
      });

      expect(result.mentions).toEqual([]);
      expect(notificationsService.notifyComment).toHaveBeenCalledWith(
        'commenter-1',
        'owner-1',
        'video-1',
        'comment-1'
      );
      expect(notificationsService.notifyMention).not.toHaveBeenCalled();
      expect(prisma.commentMention.createMany).not.toHaveBeenCalled();
    });

    it('creates a mention row and notifies a mentioned user who is not the video owner', async () => {
      prisma.video.findUnique.mockResolvedValue(mockVideo as any);
      prisma.comment.create.mockResolvedValue({
        ...mockComment,
        content: 'hey @alice check this out',
      } as any);
      prisma.user.findMany.mockResolvedValue([
        { id: 'alice-id', username: 'alice' } as any,
      ]);

      const result = await service.create('commenter-1', 'video-1', {
        content: 'hey @alice check this out',
      });

      expect(prisma.commentMention.createMany).toHaveBeenCalledWith({
        data: [{ commentId: 'comment-1', mentionedUserId: 'alice-id' }],
        skipDuplicates: true,
      });
      expect(notificationsService.notifyMention).toHaveBeenCalledWith(
        'commenter-1',
        'alice-id',
        'video-1',
        'comment-1'
      );
      expect(notificationsService.notifyComment).toHaveBeenCalledWith(
        'commenter-1',
        'owner-1',
        'video-1',
        'comment-1'
      );
      expect(result.mentions).toEqual([
        { mentionedUserId: 'alice-id', mentionedUser: { id: 'alice-id', username: 'alice' } },
      ]);
    });

    it('sends only a MENTION notification, not a COMMENT one, when the video owner is mentioned', async () => {
      prisma.video.findUnique.mockResolvedValue(mockVideo as any);
      prisma.comment.create.mockResolvedValue({
        ...mockComment,
        content: 'great work @owner',
      } as any);
      prisma.user.findMany.mockResolvedValue([
        { id: 'owner-1', username: 'owner' } as any,
      ]);

      await service.create('commenter-1', 'video-1', {
        content: 'great work @owner',
      });

      expect(notificationsService.notifyMention).toHaveBeenCalledWith(
        'commenter-1',
        'owner-1',
        'video-1',
        'comment-1'
      );
      expect(notificationsService.notifyComment).not.toHaveBeenCalled();
    });

    it('excludes a self-mention: no row, no notification', async () => {
      prisma.video.findUnique.mockResolvedValue(mockVideo as any);
      prisma.comment.create.mockResolvedValue({
        ...mockComment,
        content: 'talking to myself @commenter',
      } as any);
      prisma.user.findMany.mockResolvedValue([
        { id: 'commenter-1', username: 'commenter' } as any,
      ]);

      const result = await service.create('commenter-1', 'video-1', {
        content: 'talking to myself @commenter',
      });

      expect(prisma.commentMention.createMany).not.toHaveBeenCalled();
      expect(notificationsService.notifyMention).not.toHaveBeenCalled();
      expect(result.mentions).toEqual([]);
    });

    it('ignores a mention token that does not resolve to a real user', async () => {
      prisma.video.findUnique.mockResolvedValue(mockVideo as any);
      prisma.comment.create.mockResolvedValue({
        ...mockComment,
        content: 'hey @nobodyhere',
      } as any);
      prisma.user.findMany.mockResolvedValue([]);

      const result = await service.create('commenter-1', 'video-1', {
        content: 'hey @nobodyhere',
      });

      expect(prisma.commentMention.createMany).not.toHaveBeenCalled();
      expect(result.mentions).toEqual([]);
    });

    it('caps resolved mentions at 10, in order of first appearance', async () => {
      const names = Array.from({ length: 11 }, (_, i) => `user${i}`);
      const content = names.map((n) => `@${n}`).join(' ');
      const users = names.map((n, i) => ({ id: `id-${i}`, username: n }));

      prisma.video.findUnique.mockResolvedValue(mockVideo as any);
      prisma.comment.create.mockResolvedValue({
        ...mockComment,
        content,
      } as any);
      prisma.user.findMany.mockResolvedValue(users as any);

      const result = await service.create('commenter-1', 'video-1', { content });

      expect(result.mentions).toHaveLength(10);
      expect(result.mentions.map((m) => m.mentionedUserId)).toEqual(
        users.slice(0, 10).map((u) => u.id)
      );
      expect(notificationsService.notifyMention).toHaveBeenCalledTimes(10);
    });

    it('throws ForbiddenException when the parent comment belongs to a different video', async () => {
      prisma.video.findUnique.mockResolvedValue(mockVideo as any);
      prisma.comment.findUnique.mockResolvedValue({
        id: 'parent-1',
        videoId: 'other-video',
      } as any);

      await expect(
        service.create('commenter-1', 'video-1', {
          content: 'a reply',
          parentId: 'parent-1',
        })
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

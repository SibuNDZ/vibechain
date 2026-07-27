import { Test, TestingModule } from '@nestjs/testing';
import { TagsService } from './tags.service';
import { PrismaService } from '../../database/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('TagsService', () => {
  let service: TagsService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TagsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<TagsService>(TagsService);
  });

  describe('getTrending', () => {
    it('returns tags ranked by distinct video count, most recent window only', async () => {
      (prisma.videoTag.groupBy as jest.Mock).mockResolvedValue([
        { tagId: 'tag-1', _count: { videoId: 5 } },
        { tagId: 'tag-2', _count: { videoId: 3 } },
      ]);
      prisma.tag.findMany.mockResolvedValue([
        { id: 'tag-1', name: 'gqom' } as any,
        { id: 'tag-2', name: 'amapiano' } as any,
      ]);

      const result = await service.getTrending(10);

      expect(result.data).toEqual([
        { id: 'tag-1', name: 'gqom', videoCount: 5 },
        { id: 'tag-2', name: 'amapiano', videoCount: 3 },
      ]);
      expect(prisma.videoTag.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ video: { status: 'APPROVED' } }),
        })
      );
    });

    it('returns an empty list without querying tags when nothing was tagged recently', async () => {
      (prisma.videoTag.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await service.getTrending();

      expect(result.data).toEqual([]);
      expect(prisma.tag.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getVideosByTag', () => {
    it('returns an empty page when the tag does not exist', async () => {
      prisma.tag.findUnique.mockResolvedValue(null);

      const result = await service.getVideosByTag('nonexistent');

      expect(result).toEqual({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });
      expect(prisma.video.findMany).not.toHaveBeenCalled();
    });

    it('returns approved videos for the tag, sorted by votes desc', async () => {
      prisma.tag.findUnique.mockResolvedValue({ id: 'tag-1', name: 'gqom' } as any);
      prisma.video.findMany.mockResolvedValue([{ id: 'video-1' }] as any);
      prisma.video.count.mockResolvedValue(1);

      const result = await service.getVideosByTag('gqom', 1, 20);

      expect(result.data).toEqual([{ id: 'video-1' }]);
      expect(prisma.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'APPROVED', tags: { some: { tagId: 'tag-1' } } },
          orderBy: { votes: { _count: 'desc' } },
        })
      );
    });

    it('lowercases the tag name before lookup', async () => {
      prisma.tag.findUnique.mockResolvedValue(null);

      await service.getVideosByTag('GQOM');

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({ where: { name: 'gqom' } });
    });
  });
});

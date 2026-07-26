import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../database/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashed-password',
    walletAddress: '0x1234567890abcdef',
    avatarUrl: 'https://example.com/avatar.png',
    bio: 'Test bio',
    lastUsernameChangeAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a user with email and password', async () => {
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.create({
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed-password',
      });

      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          username: 'testuser',
          passwordHash: 'hashed-password',
        },
      });
    });

    it('should create a user with wallet address', async () => {
      const walletUser = { ...mockUser, email: null, passwordHash: null };
      prisma.user.create.mockResolvedValue(walletUser);

      const result = await service.create({
        walletAddress: '0x1234567890abcdef',
        username: 'walletuser',
      });

      expect(result).toEqual(walletUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          walletAddress: '0x1234567890abcdef',
          username: 'walletuser',
        },
      });
    });
  });

  describe('findById', () => {
    it('should return user by id with selected fields', async () => {
      const expectedUser = {
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        walletAddress: mockUser.walletAddress,
        avatarUrl: mockUser.avatarUrl,
        bio: mockUser.bio,
        createdAt: mockUser.createdAt,
      };
      prisma.user.findUnique.mockResolvedValue(expectedUser as any);

      const result = await service.findById('user-123');

      expect(result).toEqual(expectedUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          email: true,
          username: true,
          walletAddress: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
        },
      });
    });

    it('should return null for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null for non-existent email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByWallet', () => {
    it('should return user by wallet address', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findByWallet('0x1234567890abcdef');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          walletAddress: {
            equals: '0x1234567890abcdef',
            mode: 'insensitive',
          },
        },
      });
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      const updatedUser = { ...mockUser, username: 'newusername', lastUsernameChangeAt: new Date() };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.usernameHistory.findFirst.mockResolvedValue(null);
      prisma.user.update.mockResolvedValue(updatedUser);
      prisma.usernameHistory.create.mockResolvedValue({} as any);
      (prisma.$transaction as jest.Mock).mockImplementation((ops: Promise<unknown>[]) =>
        Promise.all(ops)
      );

      const result = await service.update('user-123', { username: 'newusername' });

      expect(result).toEqual(updatedUser);
      expect(prisma.usernameHistory.create).toHaveBeenCalledWith({
        data: { userId: 'user-123', oldUsername: mockUser.username, newUsername: 'newusername' },
      });
    });

    it('rejects an invalid username format', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.update('user-123', { username: 'AB' })
      ).rejects.toThrow('Username must be 3-30 characters: lowercase letters, numbers, and underscores only');
    });

    it('rejects a reserved username', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.update('user-123', { username: 'admin' })
      ).rejects.toThrow('This username is reserved');
    });

    it('rejects a username change within the 30-day cooldown', async () => {
      const recentChange = { ...mockUser, lastUsernameChangeAt: new Date() };
      prisma.user.findUnique.mockResolvedValue(recentChange);

      await expect(
        service.update('user-123', { username: 'newusername' })
      ).rejects.toThrow('Username can only be changed once every 30 days.');
    });

    it('rejects a username held by another account', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.usernameHistory.findFirst.mockResolvedValue({
        id: 'history-1',
      } as any);

      await expect(
        service.update('user-123', { username: 'newusername' })
      ).rejects.toThrow(
        'This username was recently released by another account and is on hold for 30 days'
      );
    });

    it('excludes the requesting user\'s own history when checking the hold window', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.usernameHistory.findFirst.mockResolvedValue(null);
      prisma.user.update.mockResolvedValue({ ...mockUser, username: 'newusername' });
      prisma.usernameHistory.create.mockResolvedValue({} as any);
      (prisma.$transaction as jest.Mock).mockImplementation((ops: Promise<unknown>[]) =>
        Promise.all(ops)
      );

      await service.update('user-123', { username: 'newusername' });

      expect(prisma.usernameHistory.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ NOT: { userId: 'user-123' } }),
        })
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile with counts', async () => {
      const profile = {
        id: mockUser.id,
        username: mockUser.username,
        avatarUrl: mockUser.avatarUrl,
        bio: mockUser.bio,
        createdAt: mockUser.createdAt,
        _count: {
          videos: 5,
          votes: 10,
          contributions: 3,
        },
      };
      prisma.user.findUnique.mockResolvedValue(profile as any);

      const result = await service.getProfile('user-123');

      expect(result).toEqual(profile);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
          _count: {
            select: {
              videos: true,
              votes: true,
              contributions: true,
            },
          },
        },
      });
    });
  });
});

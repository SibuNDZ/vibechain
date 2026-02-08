import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AnalyticsService } from '../../common/analytics/analytics.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let prismaService: {
    authNonce: {
      findFirst: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
    };
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: '',
    walletAddress: null,
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByWallet: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            authNonce: {
              findFirst: jest.fn(),
              updateMany: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('600000'),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            track: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    prismaService = module.get(PrismaService);
  });

  describe('register', () => {
    it('should create a new user and return access token', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          username: 'testuser',
        })
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('should hash the password before storing', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);

      await service.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      });

      const createCall = usersService.create.mock.calls[0][0];
      expect(createCall.passwordHash).toBeDefined();
      expect(createCall.passwordHash).not.toBe('password123');

      const isValid = await bcrypt.compare('password123', createCall.passwordHash as string);
      expect(isValid).toBe(true);
    });
  });

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: hashedPassword,
      });

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: mockUser.id });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: hashedPassword,
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for user without password', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('walletAuth', () => {
    const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const nonce = '123456';

    it('should create new user if wallet not registered', async () => {
      prismaService.authNonce.findFirst.mockResolvedValue({
        id: 'nonce-1',
        walletAddress,
        nonce,
        used: false,
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
      });
      prismaService.authNonce.updateMany.mockResolvedValue({ count: 1 });

      usersService.findByWallet.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        ...mockUser,
        walletAddress,
      });

      // Mock ethers.verifyMessage - we need to mock the module
      const ethers = require('ethers');
      jest.spyOn(ethers, 'verifyMessage').mockReturnValue(walletAddress);

      const result = await service.walletAuth({
        walletAddress,
        signature: 'valid-signature',
        nonce,
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(usersService.create).toHaveBeenCalled();
    });

    it('should login existing wallet user', async () => {
      prismaService.authNonce.findFirst.mockResolvedValue({
        id: 'nonce-2',
        walletAddress,
        nonce,
        used: false,
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
      });
      prismaService.authNonce.updateMany.mockResolvedValue({ count: 1 });

      usersService.findByWallet.mockResolvedValue({
        ...mockUser,
        walletAddress,
      });

      const ethers = require('ethers');
      jest.spyOn(ethers, 'verifyMessage').mockReturnValue(walletAddress);

      const result = await service.walletAuth({
        walletAddress,
        signature: 'valid-signature',
        nonce,
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid signature', async () => {
      prismaService.authNonce.findFirst.mockResolvedValue({
        id: 'nonce-3',
        walletAddress,
        nonce,
        used: false,
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
      });

      const ethers = require('ethers');
      jest.spyOn(ethers, 'verifyMessage').mockReturnValue('0xdifferentaddress');

      await expect(
        service.walletAuth({
          walletAddress,
          signature: 'invalid-signature',
          nonce,
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

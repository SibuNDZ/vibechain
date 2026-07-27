import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AnalyticsService } from '../../common/analytics/analytics.service';
import { EmailService } from '../../common/email/email.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let emailService: { sendPasswordResetEmail: jest.Mock };
  let prismaService: {
    authNonce: {
      findFirst: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
    };
    passwordResetToken: {
      findFirst: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
    };
    user: {
      update: jest.Mock;
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
    lastUsernameChangeAt: null,
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
            assertUsernameAvailableForRegistration: jest.fn(),
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
            passwordResetToken: {
              findFirst: jest.fn(),
              updateMany: jest.fn(),
              create: jest.fn(),
            },
            user: {
              update: jest.fn(),
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
        {
          provide: EmailService,
          useValue: {
            sendPasswordResetEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    prismaService = module.get(PrismaService);
    emailService = module.get(EmailService);
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
    const walletAddress = 'FJhq3J2KzCGRxfS7UkWtCsQBhGHPZzjkD3sYVqmXpNcN';
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

      // Mock nacl.sign.detached.verify to return true for valid signature
      const nacl = require('tweetnacl');
      jest.spyOn(nacl.sign.detached, 'verify').mockReturnValue(true);

      const result = await service.walletAuth({
        walletAddress,
        signature: 'MockSignatureBase58Test9xzK2pQ7',
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

      const nacl = require('tweetnacl');
      jest.spyOn(nacl.sign.detached, 'verify').mockReturnValue(true);

      const result = await service.walletAuth({
        walletAddress,
        signature: 'MockSignatureBase58Test9xzK2pQ7',
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

      const nacl = require('tweetnacl');
      jest.spyOn(nacl.sign.detached, 'verify').mockReturnValue(false);

      await expect(
        service.walletAuth({
          walletAddress,
          signature: 'WrongSignatureXeon2pQR8zK',
          nonce,
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('creates a reset token and emails a reset link for a real account', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: 'hashed',
      });
      prismaService.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      prismaService.passwordResetToken.create.mockResolvedValue({} as any);

      const result = await service.forgotPassword({ email: 'test@example.com' });

      expect(result.message).toMatch(/if an account exists/i);
      expect(prismaService.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, used: false },
        data: expect.objectContaining({ used: true }),
      });
      expect(prismaService.passwordResetToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: mockUser.id }),
      });
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.stringContaining('/reset-password?token=')
      );
    });

    it('returns the same generic message without creating a token when the email does not match an account', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'nobody@example.com' });

      expect(result.message).toMatch(/if an account exists/i);
      expect(prismaService.passwordResetToken.create).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('returns the same generic message for a wallet-only account with no password', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
      });

      const result = await service.forgotPassword({ email: 'test@example.com' });

      expect(result.message).toMatch(/if an account exists/i);
      expect(prismaService.passwordResetToken.create).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('resets the password with a valid, unused, unexpired token', async () => {
      prismaService.passwordResetToken.findFirst.mockResolvedValue({
        id: 'reset-1',
        userId: mockUser.id,
        token: 'valid-token',
        used: false,
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
        usedAt: null,
      });
      prismaService.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
      prismaService.user.update.mockResolvedValue({} as any);

      const result = await service.resetPassword({
        token: 'valid-token',
        newPassword: 'newpassword123',
      });

      expect(result.message).toMatch(/reset successfully/i);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { passwordHash: expect.any(String) },
      });

      const updateCall = prismaService.user.update.mock.calls[0][0];
      const isValid = await bcrypt.compare('newpassword123', updateCall.data.passwordHash);
      expect(isValid).toBe(true);
    });

    it('throws BadRequestException for an invalid or expired token', async () => {
      prismaService.passwordResetToken.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'bad-token', newPassword: 'newpassword123' })
      ).rejects.toThrow(BadRequestException);
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException if the token was already consumed concurrently', async () => {
      prismaService.passwordResetToken.findFirst.mockResolvedValue({
        id: 'reset-2',
        userId: mockUser.id,
        token: 'valid-token',
        used: false,
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
        usedAt: null,
      });
      prismaService.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.resetPassword({ token: 'valid-token', newPassword: 'newpassword123' })
      ).rejects.toThrow(BadRequestException);
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });
});

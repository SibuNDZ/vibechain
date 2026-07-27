import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

describe('EmailService', () => {
  let configValues: Record<string, string | undefined>;

  const buildService = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultValue?: string) =>
              configValues[key] ?? defaultValue,
          },
        },
      ],
    }).compile();

    return module.get<EmailService>(EmailService);
  };

  beforeEach(() => {
    mockSend.mockReset();
    configValues = {};
  });

  describe('when RESEND_API_KEY is not set', () => {
    it('reports itself as not configured', async () => {
      const service = await buildService();
      expect(service.isConfigured()).toBe(false);
    });

    it('no-ops instead of sending', async () => {
      const service = await buildService();
      await service.sendPasswordResetEmail('user@example.com', 'https://app/reset?token=abc');
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('when RESEND_API_KEY is set', () => {
    beforeEach(() => {
      configValues.RESEND_API_KEY = 'test-key';
      configValues.EMAIL_FROM = 'noreply@vibechain.app';
    });

    it('reports itself as configured', async () => {
      const service = await buildService();
      expect(service.isConfigured()).toBe(true);
    });

    it('sends the reset email with the reset URL included', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });
      const service = await buildService();

      await service.sendPasswordResetEmail('user@example.com', 'https://app/reset?token=abc');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@vibechain.app',
          to: 'user@example.com',
          subject: expect.stringContaining('Reset'),
          html: expect.stringContaining('https://app/reset?token=abc'),
        })
      );
    });

    it('does not throw when the send call itself rejects', async () => {
      mockSend.mockRejectedValue(new Error('network down'));
      const service = await buildService();

      await expect(
        service.sendPasswordResetEmail('user@example.com', 'https://app/reset?token=abc')
      ).resolves.toBeUndefined();
    });

    it('does not throw when Resend returns an error payload', async () => {
      mockSend.mockResolvedValue({ data: null, error: { message: 'invalid domain' } });
      const service = await buildService();

      await expect(
        service.sendPasswordResetEmail('user@example.com', 'https://app/reset?token=abc')
      ).resolves.toBeUndefined();
    });
  });
});

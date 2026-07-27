import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("RESEND_API_KEY");
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.fromAddress = this.configService.get<string>(
      "EMAIL_FROM",
      "noreply@vibechain.app"
    );
  }

  isConfigured() {
    return this.resend !== null;
  }

  async sendPasswordResetEmail(to: string, resetUrl: string) {
    if (!this.resend) {
      this.logger.warn(
        "RESEND_API_KEY not set -- skipping password reset email send"
      );
      return;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject: "Reset your VibeChain password",
        html: `
          <p>Someone requested a password reset for your VibeChain account.</p>
          <p><a href="${resetUrl}">Click here to reset your password</a></p>
          <p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
        `,
      });

      if (error) {
        this.logger.warn(`Password reset email failed to send: ${error.message}`);
      }
    } catch (error) {
      this.logger.warn(
        `Password reset email error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

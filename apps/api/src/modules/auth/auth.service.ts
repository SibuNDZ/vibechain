import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as nacl from "tweetnacl";
import bs58 from "bs58";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { UsersService } from "../users/users.service";
import {
  RegisterDto,
  LoginDto,
  WalletLoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./dto/auth.dto";
import { PrismaService } from "../../database/prisma.service";
import { AnalyticsService } from "../../common/analytics/analytics.service";
import { EmailService } from "../../common/email/email.service";
import { toUsernameSeed } from "../../common/username/username-policy";

const PASSWORD_RESET_GENERIC_MESSAGE =
  "If an account exists for that email, a reset link has been sent.";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly analyticsService: AnalyticsService,
    private readonly emailService: EmailService
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    await this.usersService.assertUsernameAvailableForRegistration(dto.username);

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
    });

    void this.analyticsService.track({
      event: "user_signup",
      user_id: user.id,
      method: "email",
    });

    return this.generateToken(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    void this.analyticsService.track({
      event: "user_login",
      user_id: user.id,
      method: "password",
    });

    return this.generateToken(user.id);
  }

  async walletAuth(dto: WalletLoginDto) {
    // Solana addresses are case-sensitive base58, do not lowercase
    const walletAddress = dto.walletAddress;
    const now = new Date();

    const nonceRecord = await this.prisma.authNonce.findFirst({
      where: {
        walletAddress,
        nonce: dto.nonce,
        used: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!nonceRecord) {
      throw new UnauthorizedException("Invalid or expired nonce");
    }

    // Verify Ed25519 signature (Solana wallet signing)
    const message = `Sign this message to authenticate with VibeChain: ${dto.nonce}`;
    const messageBytes = new TextEncoder().encode(message);

    let signatureBytes: Uint8Array;
    let publicKeyBytes: Uint8Array;
    try {
      signatureBytes = bs58.decode(dto.signature);
      publicKeyBytes = bs58.decode(walletAddress);
    } catch {
      // This endpoint is unauthenticated by definition (it IS the login flow),
      // so malformed non-base58 input must fail as 401, not crash as 500.
      throw new UnauthorizedException("Invalid signature");
    }

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid) {
      throw new UnauthorizedException("Invalid signature");
    }

    const usedResult = await this.prisma.authNonce.updateMany({
      where: { id: nonceRecord.id, used: false },
      data: { used: true, usedAt: new Date() },
    });

    if (usedResult.count === 0) {
      throw new UnauthorizedException("Nonce already used");
    }

    let user = await this.usersService.findByWallet(walletAddress);
    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      // Wallet addresses are mixed-case base58 -- must seed through the same
      // slugifier the username policy enforces everywhere else, or this
      // auto-provisioned handle would violate its own charset rule.
      const seed = toUsernameSeed(walletAddress).slice(0, 6);
      try {
        user = await this.usersService.create({
          walletAddress,
          username: `user_${seed}`,
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          // Extremely unlikely address-prefix collision -- disambiguate and retry once.
          const suffix = randomBytes(2).toString("hex");
          user = await this.usersService.create({
            walletAddress,
            username: `user_${seed}_${suffix}`,
          });
        } else {
          throw error;
        }
      }
    }

    void this.analyticsService.track({
      event: isNewUser ? "user_signup" : "user_login",
      user_id: user.id,
      method: "wallet",
    });

    return this.generateToken(user.id);
  }

  async getWalletNonce(walletAddress: string) {
    // Solana addresses are case-sensitive, no normalization needed
    const ttlMs = parseInt(
      this.configService.get<string>("AUTH_NONCE_TTL_MS", "600000"),
      10
    );

    const nonce = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + ttlMs);

    await this.prisma.authNonce.updateMany({
      where: { walletAddress, used: false },
      data: { used: true, usedAt: new Date() },
    });

    const record = await this.prisma.authNonce.create({
      data: { walletAddress, nonce, expiresAt },
    });

    return { nonce: record.nonce, expiresAt: record.expiresAt };
  }

  /**
   * Always returns the same generic message regardless of whether the email
   * matches an account, so this endpoint can't be used to enumerate
   * registered emails.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.passwordHash) {
      return { message: PASSWORD_RESET_GENERIC_MESSAGE };
    }

    const ttlMs = parseInt(
      this.configService.get<string>("PASSWORD_RESET_TTL_MS", "1800000"),
      10
    );
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + ttlMs);

    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true, usedAt: new Date() },
    });

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const frontendUrl = this.configService.get<string>("FRONTEND_URL");
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    void this.emailService.sendPasswordResetEmail(dto.email, resetUrl);

    return { message: PASSWORD_RESET_GENERIC_MESSAGE };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const now = new Date();
    const record = await this.prisma.passwordResetToken.findFirst({
      where: { token: dto.token, used: false, expiresAt: { gt: now } },
    });

    if (!record) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    const consumed = await this.prisma.passwordResetToken.updateMany({
      where: { id: record.id, used: false },
      data: { used: true, usedAt: new Date() },
    });

    if (consumed.count === 0) {
      throw new BadRequestException("Reset token already used");
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });

    return { message: "Password has been reset successfully" };
  }

  private generateToken(userId: string) {
    const payload = { sub: userId };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}

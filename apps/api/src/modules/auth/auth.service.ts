import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { ethers } from "ethers";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { UsersService } from "../users/users.service";
import { RegisterDto, LoginDto, WalletLoginDto } from "./dto/auth.dto";
import { PrismaService } from "../../database/prisma.service";
import { AnalyticsService } from "../../common/analytics/analytics.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly analyticsService: AnalyticsService
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException("Email already registered");
    }

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
    const walletAddress = dto.walletAddress.toLowerCase();
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

    const message = `Sign this message to authenticate with VibeChain: ${dto.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, dto.signature);

    if (recoveredAddress.toLowerCase() !== walletAddress) {
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
      user = await this.usersService.create({
        walletAddress,
        username: `user_${walletAddress.slice(2, 8)}`,
      });
    }

    void this.analyticsService.track({
      event: isNewUser ? "user_signup" : "user_login",
      user_id: user.id,
      method: "wallet",
    });

    return this.generateToken(user.id);
  }

  async getWalletNonce(walletAddress: string) {
    const normalized = walletAddress.toLowerCase();
    const ttlMs = parseInt(
      this.configService.get<string>("AUTH_NONCE_TTL_MS", "600000"),
      10
    );

    const nonce = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + ttlMs);

    await this.prisma.authNonce.updateMany({
      where: { walletAddress: normalized, used: false },
      data: { used: true, usedAt: new Date() },
    });

    const record = await this.prisma.authNonce.create({
      data: { walletAddress: normalized, nonce, expiresAt },
    });

    return { nonce: record.nonce, expiresAt: record.expiresAt };
  }

  private generateToken(userId: string) {
    const payload = { sub: userId };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as nacl from "tweetnacl";
import bs58 from "bs58";
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
      user = await this.usersService.create({
        walletAddress,
        username: `user_${walletAddress.slice(0, 6)}`,
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

  private generateToken(userId: string) {
    const payload = { sub: userId };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}

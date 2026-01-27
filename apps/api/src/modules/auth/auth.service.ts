import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ethers } from "ethers";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { RegisterDto, LoginDto, WalletLoginDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
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

    return this.generateToken(user.id);
  }

  async walletAuth(dto: WalletLoginDto) {
    const message = `Sign this message to authenticate with VibeChain: ${dto.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, dto.signature);

    if (recoveredAddress.toLowerCase() !== dto.walletAddress.toLowerCase()) {
      throw new UnauthorizedException("Invalid signature");
    }

    let user = await this.usersService.findByWallet(dto.walletAddress);
    if (!user) {
      user = await this.usersService.create({
        walletAddress: dto.walletAddress,
        username: `user_${dto.walletAddress.slice(2, 8)}`,
      });
    }

    return this.generateToken(user.id);
  }

  private generateToken(userId: string) {
    const payload = { sub: userId };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}

import { Controller, Post, Body, HttpCode, HttpStatus, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import {
  RegisterDto,
  LoginDto,
  WalletLoginDto,
  WalletNonceRequestDto,
} from "./dto/auth.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Register a new user" })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Login with email and password" })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get("wallet/nonce")
  @Throttle({ auth: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: "Get a wallet login nonce" })
  @ApiQuery({ name: "walletAddress", required: true })
  async getWalletNonce(@Query() query: WalletNonceRequestDto) {
    return this.authService.getWalletNonce(query.walletAddress);
  }

  @Post("wallet")
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Login or register with wallet signature" })
  async walletAuth(@Body() dto: WalletLoginDto) {
    return this.authService.walletAuth(dto);
  }
}

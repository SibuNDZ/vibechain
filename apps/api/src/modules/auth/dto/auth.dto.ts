import { IsEmail, IsString, Matches, MaxLength, MinLength, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { USERNAME_FORMAT_MESSAGE, USERNAME_REGEX } from "../../../common/username/username-policy";

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(USERNAME_REGEX, { message: USERNAME_FORMAT_MESSAGE })
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;
}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}

export class WalletLoginDto {
  @ApiProperty()
  @IsString()
  walletAddress: string;

  @ApiProperty()
  @IsString()
  signature: string;

  @ApiProperty()
  @IsString()
  nonce: string;
}

export class WalletNonceRequestDto {
  @ApiProperty()
  @IsString()
  walletAddress: string;
}

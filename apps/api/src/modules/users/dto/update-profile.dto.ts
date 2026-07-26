import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { USERNAME_FORMAT_MESSAGE, USERNAME_REGEX } from "../../../common/username/username-policy";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(USERNAME_REGEX, { message: USERNAME_FORMAT_MESSAGE })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string | null;
}
